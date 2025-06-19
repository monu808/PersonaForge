import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  Loader2,
  Sparkles,
  EyeOff,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPersonas, deletePersona } from '@/lib/api/personas';
import { geminiChatService, ChatMessage, ChatConfig } from '@/lib/api/gemini-chat';
import { toast } from '@/components/ui/use-toast';

interface UserPersona {
  id: string;
  name: string;
  description: string;
  attributes: {
    traits?: any[];
    image_url?: string;
    system_prompt?: string;
    context?: string;
  };
  replica_type: string;
  created_at: string;
  updated_at: string;
}

interface ActivePersonasProps {
  className?: string;
}

export function ActivePersonas({ className }: ActivePersonasProps) {
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
  const [chatSession, setChatSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<UserPersona | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getPersonas();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPersonas(data);
      } else {
        setError('No personas found. Create your first persona to get started!');
      }
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load personas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPersonaStatus = (persona: UserPersona) => {
    // Simulate online status based on recent activity
    const lastUpdated = new Date(persona.updated_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 1) return { status: 'online', color: 'bg-green-400' };
    if (hoursDiff < 24) return { status: 'away', color: 'bg-yellow-400' };
    return { status: 'offline', color: 'bg-gray-400' };
  };

  const getPersonaEmoji = (replicaType: string) => {
    const emojiMap: Record<string, string> = {
      professional: '💼',
      personal: '👤',
      historical: '📚',
      emergency: '🚨',
      creator: '🎨',
      technical: '⚙️',
      medical: '⚕️',
      educational: '🎓'
    };
    return emojiMap[replicaType] || '🤖';
  };

  const startChatWithPersona = async (persona: UserPersona) => {
    try {
      setSelectedPersona(persona);
      setShowChat(true);
      setIsTyping(true);
      
      const config: ChatConfig = {
        persona_id: persona.id,
        persona_name: persona.name,
        persona_description: persona.description,
        persona_traits: persona.attributes?.traits?.map(t => t.name || t) || [],
        system_prompt: persona.attributes?.system_prompt,
        context: persona.attributes?.context
      };

      const sessionId = await geminiChatService.startChat(config);
      setChatSession(sessionId);
      setMessages([]);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Hello! I'm ${persona.name}. ${persona.description} How can I help you today?`,
        timestamp: new Date(),
        persona_id: persona.id
      };
      
      setMessages([welcomeMessage]);
      
      toast({
        title: 'Chat Started',
        description: `Now chatting with ${persona.name}`,
      });
    } catch (err) {
      console.error('Error starting chat:', err);
      toast({
        title: 'Error',
        description: 'Failed to start chat session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !chatSession || isSending) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsSending(true);

    // Add user message immediately
    const newUserMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      persona_id: selectedPersona?.id
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      // Send to Gemini and get response
      const aiResponse = await geminiChatService.sendMessage(chatSession, userMessage);
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const closeChat = () => {
    if (chatSession) {
      geminiChatService.endChat(chatSession);
      setChatSession(null);
    }
    setShowChat(false);
    setSelectedPersona(null);
    setMessages([]);
    setCurrentMessage('');
  };

  const handleDeletePersona = (persona: UserPersona) => {
    setPersonaToDelete(persona);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePersona = async () => {
    if (!personaToDelete) return;

    try {
      const { error } = await deletePersona(personaToDelete.id);
      
      if (error) {
        throw error;
      }

      // Remove from local state
      setPersonas(prev => prev.filter(p => p.id !== personaToDelete.id));
      
      // Clear selection if deleted persona was selected
      if (selectedPersona?.id === personaToDelete.id) {
        closeChat();
      }

      toast({
        title: "Persona Deleted",
        description: `${personaToDelete.name} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        title: "Error",
        description: "Failed to delete persona. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteConfirm(false);
      setPersonaToDelete(null);
    }
  };

  const cancelDeletePersona = () => {
    setShowDeleteConfirm(false);
    setPersonaToDelete(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPersonas} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Active Personas Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Users className="h-8 w-8 text-blue-600" />
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Active Personas</h2>
              <p className="text-sm text-gray-600">
                Chat with your AI personas powered by Google Gemini
              </p>
            </div>
          </div>
          
          {showChat && (
            <Button
              onClick={closeChat}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <EyeOff className="h-4 w-4" />
              <span>Close Chat</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">        {/* Personas List */}
        <div className={`${showChat ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col min-h-0`}>
          <div className="bg-white rounded-xl p-6 shadow-sm border flex-1 flex flex-col">
            <h3 className="text-xl font-semibold flex items-center mb-6 text-gray-900">
              <Sparkles className="h-6 w-6 mr-3 text-blue-600" />
              Your Personas ({personas.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 pb-4">
                {personas.map((persona) => {
                  const { status, color } = getPersonaStatus(persona);
                  const emoji = getPersonaEmoji(persona.replica_type);
                    return (
                    <motion.div
                      key={persona.id}
                      className={`
                        bg-gray-50 hover:bg-blue-50 rounded-xl p-5 border-2 transition-all duration-300 
                        hover:shadow-md hover:border-blue-300 group h-fit relative
                        ${selectedPersona?.id === persona.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200'}
                      `}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <motion.button
                          className="bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 p-2 rounded-lg shadow-sm border"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: "Edit Persona",
                              description: "Edit functionality coming soon!",
                            });
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </motion.button>
                        <motion.button
                          className="bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 p-2 rounded-lg shadow-sm border"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePersona(persona);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </motion.button>
                      </div>

                      <div 
                        className="cursor-pointer"
                        onClick={() => startChatWithPersona(persona)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                              <AvatarImage src={persona.attributes?.image_url} />
                              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-100 to-purple-100">
                                {emoji}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${color} shadow-sm`} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-16">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">{persona.name}</h4>
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex-shrink-0">
                                {persona.replica_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {persona.description}
                            </p>
                            
                            {persona.attributes?.traits && persona.attributes.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {persona.attributes.traits.slice(0, 2).map((trait, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-white border-gray-300 text-gray-700">
                                    {typeof trait === 'string' ? trait : trait.name}
                                  </Badge>
                                ))}
                                {persona.attributes.traits.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-700">
                                    +{persona.attributes.traits.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500 capitalize font-medium">
                                {status}
                              </div>
                              <motion.div
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white p-2 rounded-lg shadow-sm"
                                whileHover={{ scale: 1.1 }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {!showChat && personas.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Start a Conversation</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Click on any of your personas above to start an AI-powered conversation with Google Gemini
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>        {/* Chat Interface */}
        <AnimatePresence>
          {showChat && selectedPersona && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5 flex flex-col min-h-0"
            >
              <Card className="flex-1 flex flex-col bg-white shadow-lg border min-h-0">
                <CardHeader className="flex-shrink-0 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage src={selectedPersona.attributes?.image_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                        {getPersonaEmoji(selectedPersona.replica_type)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedPersona.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Persona • Powered by Gemini
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 min-h-0">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {message.role === 'user' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                          <div className="flex items-center space-x-2">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-blue-500 rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-2">
                              {selectedPersona.name} is typing...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-3">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={`Message ${selectedPersona.name}...`}
                        disabled={isSending}
                        className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isSending || !currentMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteConfirm && personaToDelete && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="h-8 w-8 text-red-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Persona</h3>
                  <p className="text-gray-600 mb-2">
                    Are you sure you want to delete <strong>{personaToDelete.name}</strong>?
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    This action cannot be undone. All associated data and conversations will be permanently removed.
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={cancelDeletePersona}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={confirmDeletePersona}
                      className="px-6"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Persona
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
