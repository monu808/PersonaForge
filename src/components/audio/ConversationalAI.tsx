import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Mic, MicOff, Bot, User, Play, Pause } from 'lucide-react';
import {
  createConversationalAgent,
  startConversation,
  sendConversationMessage,
  getConversationHistory,
  getAvailableVoices,
  ConversationConfig,
  ConversationSession,
  ConversationMessage,
  ElevenLabsVoice
} from '@/lib/api/elevenlabs';

interface ConversationalAIProps {
  personaId?: string;
}

export function ConversationalAI({ personaId }: ConversationalAIProps) {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'chat'>('setup');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadVoices = async () => {
    try {
      const voiceList = await getAvailableVoices();
      setVoices(voiceList);
      if (voiceList.length > 0) {
        setSelectedVoice(voiceList[0].id);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load voices');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createAgent = async () => {
    if (!selectedVoice || !agentPrompt || !firstMessage) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreatingAgent(true);
    setError(null);

    try {
      const config: ConversationConfig = {
        voice_id: selectedVoice,
        conversation_config: {
          agent: {
            prompt: {
              prompt: agentPrompt,
            },
            first_message: firstMessage,
            language: 'en',
          },
          tts: {
            voice_id: selectedVoice,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          },
          stt: {
            model: 'nova-2',
            language: 'en',
          },
        },
      };

      const agent = await createConversationalAgent(config);
      setAgentId(agent.agent_id);
      
      // Automatically start conversation
      await startConversationSession(agent.agent_id);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const startConversationSession = async (agentIdParam?: string) => {
    const currentAgentId = agentIdParam || agentId;
    if (!currentAgentId) return;

    setIsStartingConversation(true);
    setError(null);

    try {
      const session = await startConversation(currentAgentId);
      setConversation(session);
      setStep('chat');
      
      // Load conversation history
      const history = await getConversationHistory(session.conversation_id);
      setMessages(history);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!conversation || !currentMessage.trim()) return;

    setIsSendingMessage(true);
    setError(null);

    try {
      const userMessage: ConversationMessage = {
        message_id: Date.now().toString(),
        user_id: 'user',
        content: currentMessage,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');

      const response = await sendConversationMessage(conversation.conversation_id, currentMessage);
      
      if (response.message) {
        const agentMessage: ConversationMessage = {
          message_id: response.message.id || Date.now().toString(),
          user_id: 'agent',
          content: response.message.content,
          role: 'agent',
          timestamp: new Date().toISOString(),
          audio_url: response.message.audio_url,
        };

        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        
        if (conversation) {
          await sendVoiceMessage(audioFile);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioFile: File) => {
    if (!conversation) return;

    setIsSendingMessage(true);
    try {
      const response = await sendConversationMessage(conversation.conversation_id, '', audioFile);
      
      if (response.message) {
        const agentMessage: ConversationMessage = {
          message_id: response.message.id || Date.now().toString(),
          user_id: 'agent',
          content: response.message.content,
          role: 'agent',
          timestamp: new Date().toISOString(),
          audio_url: response.message.audio_url,
        };

        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (err) {
      console.error('Error sending voice message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send voice message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create Conversational AI Agent
          </CardTitle>
          <CardDescription>
            Set up an AI agent that can have natural conversations using your selected voice
          </CardDescription>
        </CardHeader>        <CardContent>
          <div className="space-y-6">
            {/* API Notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">Conversational AI Availability</p>
                  <p className="text-amber-700">
                    This feature requires a Business plan or higher with ElevenLabs. 
                    If you're seeing errors, please upgrade your ElevenLabs subscription to access Conversational AI features.
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice *</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} ({voice.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Personality & Instructions *</label>
              <Textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="Describe how the AI should behave, its personality, knowledge domain, and conversation style..."
                rows={4}
                required
              />
            </div>

            {/* First Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First Message *</label>
              <Input
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="What should the AI say to start the conversation?"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={createAgent}
              disabled={isCreatingAgent || !selectedVoice || !agentPrompt || !firstMessage}
              className="w-full"
            >
              {isCreatingAgent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                'Create Agent & Start Chat'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Conversation
        </CardTitle>
        <CardDescription>
          Chat with your AI agent using text or voice
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.message_id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-xs opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                {message.audio_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAudio(message.audio_url!)}
                    className="mt-2 p-1 h-auto"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={isSendingMessage}
            className="flex-1"
          />
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            disabled={isSendingMessage}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={sendMessage}
            disabled={isSendingMessage || !currentMessage.trim()}
          >
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
