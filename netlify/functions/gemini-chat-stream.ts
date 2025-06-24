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
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Gemini API key not configured' }),
      };
    }

    // Parse request body
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const { message, chatHistory = [], config = {} } = body;

    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message is required and must be a string' }),
      };
    }

    // Rate limiting check
    const userIP = event.headers['x-forwarded-for'] || 'unknown';
    console.log(`Streaming chat request from IP: ${userIP}`);

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash',
    });

    let result;

    // Check if we have chat history to maintain context
    if (chatHistory && chatHistory.length > 0) {
      try {
        // Format chat history for Gemini API
        const formattedHistory = chatHistory
          .filter(msg => msg.role && msg.content && msg.content.trim())
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

        // Ensure the history starts with a user message
        if (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
          formattedHistory.shift();
        }

        if (formattedHistory.length > 0) {
          const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
              temperature: config.temperature || 0.7,
              maxOutputTokens: config.maxOutputTokens || 1000,
            },
          });

          result = await chat.sendMessageStream(message);
        } else {
          result = await model.generateContentStream(message);
        }
      } catch (historyError) {
        console.warn('Chat history failed, falling back to simple generation:', historyError);
        result = await model.generateContentStream(message);
      }
    } else {
      result = await model.generateContentStream(message);
    }

    // Stream the response
    let responseText = '';
    let sseData = '';

    try {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        responseText += chunkText;
        
        // Send chunk as SSE data
        sseData += `data: ${JSON.stringify({
          type: 'chunk',
          content: chunkText,
          partial: responseText
        })}\n\n`;
      }

      // Send final message
      sseData += `data: ${JSON.stringify({
        type: 'complete',
        content: responseText,
        usage: {
          promptTokens: result.response?.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response?.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response?.usageMetadata?.totalTokenCount || 0,
        },
        timestamp: new Date().toISOString(),
      })}\n\n`;

      sseData += `data: [DONE]\n\n`;

      return {
        statusCode: 200,
        headers,
        body: sseData,
      };

    } catch (streamError) {
      console.error('Streaming error:', streamError);
      const errorData = `data: ${JSON.stringify({
        type: 'error',
        error: 'Streaming failed',
        details: process.env.NODE_ENV === 'development' ? (streamError as Error).message : undefined,
      })}\n\n`;

      return {
        statusCode: 200,
        headers,
        body: errorData,
      };
    }

  } catch (error) {
    console.error('Gemini streaming chat error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to process streaming chat request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      }),
    };
  }
};
