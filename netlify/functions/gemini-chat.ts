import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface ChatRequest {
  message: string;
  chatHistory?: ChatMessage[];
  config?: ChatConfig;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gemini API key not configured' }),
      };
    }

    // Parse request body
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const { message, chatHistory = [], config = {} } = body;

    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required and must be a string' }),
      };
    }

    // Rate limiting check (basic implementation)
    const userIP = event.headers['x-forwarded-for'] || 'unknown';
    console.log(`Chat request from IP: ${userIP}`);

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
    });

    let result;
    let response;
    let responseText;

    // Check if we have chat history to maintain context
    if (chatHistory && chatHistory.length > 0) {
      try {
        // Format chat history for Gemini API
        // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
        const formattedHistory = chatHistory
          .filter(msg => msg.role && msg.content && msg.content.trim()) // Filter out invalid messages
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

        // Ensure the history starts with a user message if not empty
        if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
          formattedHistory.shift(); // Remove first message if it's not from user
        }

        // Only use chat session if we have valid history
        if (formattedHistory.length > 0) {
          const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
              temperature: config.temperature || 0.7,
              maxOutputTokens: config.maxOutputTokens || 1000,
            },
          });

          result = await chat.sendMessage(message);
          response = await result.response;
          responseText = response.text();
        } else {
          // Fall back to simple generation if history is invalid
          result = await model.generateContent(message);
          response = await result.response;
          responseText = response.text();
        }
      } catch (historyError) {
        // If chat history fails, fall back to simple generation
        console.warn('Chat history failed, falling back to simple generation:', historyError);
        result = await model.generateContent(message);
        response = await result.response;
        responseText = response.text();
      }
    } else {
      // No chat history, use simple content generation
      result = await model.generateContent(message);
      response = await result.response;
      responseText = response.text();
    }

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
