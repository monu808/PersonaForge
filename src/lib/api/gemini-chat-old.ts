// Secure Gemini AI integration for persona chatting
import { SecureAIService } from './secure-ai-service';

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
  private secureAI: SecureAIService;
  private activeSessions: Map<string, any> = new Map();
  
  constructor() {
    this.secureAI = new SecureAIService();
  }

  // Initialize chat session for a persona// Secure Gemini AI integration for persona chatting
import { SecureAIService } from './secure-ai-service';

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
  private secureAI: SecureAIService;
  private activeSessions: Map<string, any> = new Map();
  
  constructor() {
    this.secureAI = new SecureAIService();
  }

  // Initialize chat session for a persona
  async startChat(config: ChatConfig): Promise<string> {
    try {
      // Build system prompt based on persona
      const systemPrompt = this.buildPersonaPrompt(config);
      
      const sessionId = `chat_${config.persona_id}_${Date.now()}`;
      
      // Initialize session with system prompt
      const messages: ChatMessage[] = [
        {
          id: `msg_${Date.now()}_system`,
          role: 'assistant',
          content: `Hello! I'm ${config.persona_name}. I'm ready to chat with you. What would you like to talk about?`,
          timestamp: new Date(),
          persona_id: config.persona_id
        }
      ];

      this.activeSessions.set(sessionId, {
        config,
        messages,
        systemPrompt
      });

      return sessionId;
    } catch (error) {
      console.error('Error starting chat session:', error);
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
      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(userMessage);

      // Prepare chat history for the API
      const chatHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Build full prompt with persona context
      const fullPrompt = session.systemPrompt + '\n\nUser: ' + message;

      // Get AI response using secure service
      const response = await this.secureAI.sendMessage(fullPrompt, chatHistory);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get AI response');
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.response || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
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
      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        persona_id: session.config.persona_id
      };

      session.messages.push(userMessage);

      // Prepare chat history for the API
      const chatHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Build full prompt with persona context
      const fullPrompt = session.systemPrompt + '\n\nUser: ' + message;

      // Use the secure AI service with streaming callback
      await this.secureAI.sendMessageStream(fullPrompt, chatHistory, {}, onChunk);

      // For now, get the full response after streaming
      const response = await this.secureAI.sendMessage(fullPrompt, chatHistory);
      
      // Create final AI response message
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.response || 'I apologize, but I could not generate a response.',
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
  try {
    const secureAI = new SecureAIService();
    const response = await secureAI.sendMessage(prompt, []);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate text');
    }
    
    return response.response || '';
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text content');
  }
}
