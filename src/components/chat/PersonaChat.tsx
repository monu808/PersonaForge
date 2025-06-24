import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, MessageSquare, Sparkles, Zap, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  geminiChatService, 
  ChatMessage, 
  ChatConfig,
  getChatStats,
  getChatDuration 
} from '@/lib/api/gemini-chat';
import { motion } from 'framer-motion';

interface PersonaChatProps {
  persona: {
    id: string;
    name: string;
    description?: string;
    attributes?: {
      traits?: string[];
      system_prompt?: string;
      context?: string;
      image_url?: string;
    };
  };
  onClose?: () => void;
}

export function PersonaChat({ persona, onClose }: PersonaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatStats, setChatStats] = useState({
    messageCount: 0,
    userMessages: 0,
    aiMessages: 0,
    averageResponseTime: 0
  });
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startChatSession();
    return () => {
      if (sessionId) {
        geminiChatService.endChat(sessionId);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  useEffect(() => {
    setChatStats(getChatStats(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChatSession = async () => {
    setIsConnecting(true);
    try {
      const config: ChatConfig = {
        persona_id: persona.id,
        persona_name: persona.name,
        persona_description: persona.description,
        persona_traits: persona.attributes?.traits || [],
        system_prompt: persona.attributes?.system_prompt,
        context: persona.attributes?.context
      };

      const session = await geminiChatService.startChat(config);
      setSessionId(session);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${persona.name}. I'm ready to chat with you. What would you like to talk about?`,
        timestamp: new Date(),
        persona_id: persona.id
      };

      setMessages([welcomeMessage]);
      toast({
        title: "Chat Started",
        description: `Connected to ${persona.name}`,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start chat",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isLoading) return;

    const messageText = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingResponse('');

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        persona_id: persona.id
      };

      setMessages(prev => [...prev, userMessage]);      // Stream AI response
      const aiMessage = await geminiChatService.sendMessageStream(
        sessionId,
        messageText,
        (chunk: string) => {
          // chunk contains only the new text, so append it
          setStreamingResponse(prev => prev + chunk);
        }
      );

      // Add complete AI message
      setMessages(prev => [...prev, aiMessage]);
      setStreamingResponse('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Failed",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isConnecting) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Connecting to {persona.name}</h3>
            <p className="text-gray-600">Initializing AI persona...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={persona.attributes?.image_url} />
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {persona.name}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Chat
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 max-w-md truncate">
                  {persona.description || "AI-powered persona ready to chat"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {chatStats.messageCount} messages
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getChatDuration(messages)}m
                </div>
              </div>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900 border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Streaming Response */}
              {isStreaming && streamingResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-4 w-4" />
                      <span className="text-xs opacity-75">typing...</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {streamingResponse}
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Loading indicator */}
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900 border">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Chat with ${persona.name}...`}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !currentMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Press Enter to send</span>
                {chatStats.averageResponseTime > 0 && (
                  <span>Avg response: {Math.round(chatStats.averageResponseTime)}s</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Powered by Gemini AI</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
