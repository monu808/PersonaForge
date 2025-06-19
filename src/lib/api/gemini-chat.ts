// Gemini AI integration for persona chatting
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  persona_id?: string;
}

export interface PersonaChat {
  id: string;
  persona_id: string;
  persona_name: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

export interface ChatConfig {
  persona_id: string;
  persona_name: string;
  persona_description?: string;
  persona_traits?: string[];
  system_prompt?: string;
  context?: string;
}

class GeminiChatService {
  private genAI: GoogleGenerativeAI | null = null;
  private activeSessions: Map<string, any> = new Map();
  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  // Initialize chat session for a persona
  async startChat(config: ChatConfig): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured. Please set VITE_GOOGLE_GEMINI_API_KEY in your environment variables.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Build system prompt based on persona
      const systemPrompt = this.buildPersonaPrompt(config);
      
      // Start chat session
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model", 
            parts: [{ text: `Hello! I'm ${config.persona_name}. I'm ready to chat with you. What would you like to talk about?` }],
          },
        ],
      });

      const sessionId = `chat_${config.persona_id}_${Date.now()}`;
      this.activeSessions.set(sessionId, {
        chat,
        config,
        messages: []
      });

      return sessionId;
    } catch (error) {
      console.error('Error starting Gemini chat:', error);
      throw new Error('Failed to start chat session');
    }
  }

  // Send message to persona
  async sendMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    try {
      // Send user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(userMessage);

      // Get AI response
      const result = await session.chat.sendMessage(message);
      const response = await result.response;
      const aiResponse = response.text();

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('Failed to send message');
    }
  }

  // Get chat history
  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.activeSessions.get(sessionId);
    return session ? session.messages : [];
  }

  // Get all active sessions
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  // End chat session
  endChat(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  // Build persona-specific system prompt
  private buildPersonaPrompt(config: ChatConfig): string {
    let prompt = `You are ${config.persona_name}, an AI persona.`;

    if (config.persona_description) {
      prompt += ` ${config.persona_description}`;
    }

    if (config.system_prompt) {
      prompt += ` ${config.system_prompt}`;
    }

    if (config.context) {
      prompt += ` Context: ${config.context}`;
    }

    if (config.persona_traits && config.persona_traits.length > 0) {
      prompt += ` Your personality traits include: ${config.persona_traits.join(', ')}.`;
    }

    prompt += ` 

Instructions:
- Respond as this persona consistently
- Stay in character throughout the conversation  
- Be helpful, engaging, and authentic to your persona
- Keep responses conversational and natural
- If asked about your nature, acknowledge you're an AI persona but maintain your character
- Adapt your communication style to match your persona's traits
- Be concise but thorough when needed

Remember: You are ${config.persona_name} - embody this identity fully in all your responses.`;

    return prompt;
  }

  // Stream response (for real-time chat)
  async sendMessageStream(
    sessionId: string, 
    message: string, 
    onChunk: (chunk: string) => void
  ): Promise<ChatMessage> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    try {
      // Send user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(userMessage);

      // Get streaming response
      const result = await session.chat.sendMessageStream(message);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      // Create final AI response message
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error streaming message:', error);
      throw new Error('Failed to stream message');
    }
  }

  // Save chat to database (optional persistence)
  async saveChatToDatabase(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // This would integrate with your Supabase database
      // For now, we'll just log it
      console.log('Saving chat to database:', {
        sessionId,
        persona_id: session.config.persona_id,
        messages: session.messages
      });
      
      // TODO: Implement actual database saving if needed
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  }
}

// Create singleton instance
export const geminiChatService = new GeminiChatService();

// Utility functions
export function formatChatMessage(message: ChatMessage): string {
  const timestamp = message.timestamp.toLocaleTimeString();
  const sender = message.role === 'user' ? 'You' : 'AI';
  return `[${timestamp}] ${sender}: ${message.content}`;
}

export function getChatDuration(messages: ChatMessage[]): number {
  if (messages.length < 2) return 0;
  const first = messages[0].timestamp.getTime();
  const last = messages[messages.length - 1].timestamp.getTime();
  return Math.round((last - first) / 1000 / 60); // minutes
}

export function getChatStats(messages: ChatMessage[]): {
  messageCount: number;
  userMessages: number;
  aiMessages: number;
  averageResponseTime: number;
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'assistant');
  
  // Calculate average response time (simplified)
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const responseTime = messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  return {
    messageCount: messages.length,
    userMessages: userMessages.length,
    aiMessages: aiMessages.length,
    averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0
  };
}

// Export a simple text generation function for podcast scripts
export async function generateText(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set VITE_GOOGLE_GEMINI_API_KEY in your environment variables.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error('Failed to generate text content');
  }
}
