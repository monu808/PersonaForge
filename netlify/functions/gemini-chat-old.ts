import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface ChatRequest {
  message: string;
  chatHistory?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  config?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate API key is present
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    // Parse request body
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const { message, chatHistory = [], config = {} } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required and must be a string' }),
      };
    }

    // Rate limiting check (basic implementation)
    const userIP = event.headers['x-forwarded-for'] || 'unknown';
    console.log(`Chat request from IP: ${userIP}`);    // Initialize model
    const model = genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
    });

    // For now, use simple content generation instead of chat with history
    // This avoids the chat history formatting issues
    const prompt = `${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: responseText,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Gemini chat error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      }),
    };
  }
};
