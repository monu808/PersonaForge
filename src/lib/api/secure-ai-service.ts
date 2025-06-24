// Secure API client that calls Netlify Functions instead of exposing API keys
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

interface ChatResponse {
  success: boolean;
  response?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  details?: string;
  timestamp?: string;
}

class SecureAIService {
  private baseUrl: string;  constructor() {
    // Environment detection for API endpoints
    if (typeof window === 'undefined') {
      // Server-side (should not happen in browser)
      this.baseUrl = '/.netlify/functions';
    } else {
      // Client-side environment detection
      const hostname = window.location.hostname;
      const port = window.location.port;
      const isDev = import.meta.env.DEV;
      
      if (isDev && hostname === 'localhost') {
        if (port === '8888') {
          // Running with Netlify Dev - functions available
          this.baseUrl = 'http://localhost:8888/.netlify/functions';
        } else if (port === '5173') {
          // Running with Vite dev server - need to proxy to Netlify Dev
          console.warn('⚠️ Running on Vite dev server. Functions may not be available.');
          console.warn('💡 For full functionality, use: npm run netlify:dev');
          // Try to connect to default Netlify dev port
          this.baseUrl = 'http://localhost:8888/.netlify/functions';
        } else {
          // Other local dev setup
          this.baseUrl = '/.netlify/functions';
        }
      } else {
        // Production or other environments
        this.baseUrl = '/.netlify/functions';
      }
    }
    
    console.log('SecureAIService initialized with baseUrl:', this.baseUrl);
    console.log('Current environment - hostname:', window?.location?.hostname, 'port:', window?.location?.port, 'isDev:', import.meta.env.DEV);
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Send a message to the AI using secure Netlify Functions
   */
  async sendMessage(
    message: string,
    chatHistory: ChatMessage[] = [],
    config: ChatConfig = {}
  ): Promise<ChatResponse> {
    try {
      // Convert chat history to Gemini format
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await this.makeRequest('/gemini-chat', {
        message,
        chatHistory: formattedHistory,
        config
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  /**
   * Stream a message response (for real-time chat) using Server-Sent Events
   */
  async sendMessageStream(
    message: string,
    chatHistory: ChatMessage[] = [],
    config: ChatConfig = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert chat history to Gemini format
        const formattedHistory = chatHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        // Create request payload
        const requestData = {
          message,
          chatHistory: formattedHistory,
          config
        };

        // Use fetch for streaming instead of EventSource for better control
        fetch(`${this.baseUrl}/gemini-chat-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(requestData),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          const readChunk = async (): Promise<void> => {
            try {
              const { done, value } = await reader.read();
              
              if (done) {
                resolve();
                return;
              }

              // Decode and add to buffer
              buffer += decoder.decode(value, { stream: true });
              
              // Process complete lines
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6); // Remove 'data: ' prefix
                  
                  if (data === '[DONE]') {
                    resolve();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.type === 'chunk' && parsed.content) {
                      onChunk(parsed.content);
                    } else if (parsed.type === 'complete') {
                      resolve();
                      return;
                    } else if (parsed.type === 'error') {
                      reject(new Error(parsed.error || 'Streaming error'));
                      return;
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', data);
                  }
                }
              }

              // Continue reading
              readChunk();
            } catch (error) {
              reject(error);
            }
          };

          readChunk();
        })
        .catch(error => {
          console.error('Fetch error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Streaming error:', error);
        reject(error);
      }
    });
  }

  /**
   * Check service health
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health-check`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a persona response (legacy compatibility)
   */
  async generatePersonaResponse(
    personaName: string,
    personaTraits: string[],
    context: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = `You are ${personaName}. Your traits: ${personaTraits.join(', ')}. Context: ${context}`;
    
    const response = await this.sendMessage(
      userMessage,
      [
        { role: 'assistant', content: systemPrompt },
        ...conversationHistory
      ]
    );

    if (response.success && response.response) {
      return response.response;
    } else {
      throw new Error(response.error || 'Failed to generate response');
    }
  }
}

// Export singleton instance
export const secureAIService = new SecureAIService();

// Export types
export type { ChatMessage, ChatConfig, ChatResponse };

// Export class for custom instances
export default SecureAIService;
