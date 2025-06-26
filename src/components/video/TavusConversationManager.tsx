import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, Phone, ExternalLink, Clock, Users } from 'lucide-react';
import { createTavusConversation, listTavusConversations, endTavusConversation } from '@/lib/api/tavus';
import { createLiveEvent, updateEventStatus } from '@/lib/api/events';
import { toast } from '@/components/ui/use-toast';

interface TavusConversationManagerProps {
  personas: Array<{
    id: string;
    name: string;
    attributes?: {
      default_replica_id?: string;
    };
  }>;
  onConversationCreated?: (conversationData: any) => void;
}

export function TavusConversationManager({ personas, onConversationCreated }: TavusConversationManagerProps) {  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [conversationName, setConversationName] = useState('');
  const [conversationContext, setConversationContext] = useState('');
  const [maxDuration, setMaxDuration] = useState<number>(30);
  const [enableRecording, setEnableRecording] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<{
    conversationId: string;
    conversationUrl: string;
    liveEventId: string;
    name: string;
  } | null>(null);
  const [activeConversations, setActiveConversations] = useState<Array<{
    id: string;
    name: string;
    url: string;
    persona_name: string;
    created_at: string;
  }>>([]);

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersona) {
      setError('Please select a persona.');
      return;
    }

    setIsCreating(true);
    setError(null);    try {      const selectedPersonaData = personas.find(p => p.id === selectedPersona);
      
      if (!selectedPersonaData) {
        throw new Error('Selected persona not found');
      }
      
      const replicaId = selectedPersonaData?.attributes?.default_replica_id;
      const tavusPersonaId = (selectedPersonaData?.attributes as any)?.tavus_persona_id;
        // Debug logging to help identify the issue
      console.log('DEBUG: Conversation creation parameters:', {
        selectedPersona,
        selectedPersonaData: {
          id: selectedPersonaData.id,
          name: selectedPersonaData.name,
          attributes: selectedPersonaData.attributes
        },
        resolvedReplicaId: replicaId,
        resolvedTavusPersonaId: tavusPersonaId
      });

      if (!replicaId) {
        throw new Error(`No Tavus replica ID found for persona "${selectedPersonaData.name}". Please create a replica for this persona first.`);
      }

      if (!tavusPersonaId) {
        throw new Error(`No Tavus persona ID found for persona "${selectedPersonaData.name}". Please create a TAVUS persona for this persona first.`);
      }      // Validate that the replica ID looks like a Tavus replica ID (should start with 'r')
      if (!replicaId.startsWith('r')) {
        throw new Error(`Invalid replica ID format: ${replicaId}. Please ensure the persona has a valid Tavus replica.`);
      }

      // Validate that the persona ID looks like a Tavus persona ID (should start with 'p')
      if (!tavusPersonaId.startsWith('p')) {
        throw new Error(`Invalid persona ID format: ${tavusPersonaId}. Please ensure the persona has a valid Tavus persona.`);
      }

      const conversationData = await createTavusConversation({
        replica_id: replicaId,
        persona_id: tavusPersonaId,
        conversation_name: conversationName || `${selectedPersonaData?.name} Conversation`,
        conversation_context: conversationContext || undefined,
        properties: {
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: enableRecording,
        },
      });      if (conversationData.error) {
        throw new Error(conversationData.error);
      }

      if (conversationData.conversation_id && conversationData.conversation_url) {
        // Create a live event for this conversation
        let liveEventId = '';
        try {
          const { data: liveEvent, error: eventError } = await createLiveEvent({
            title: conversationName || `${selectedPersonaData?.name} Conversation`,
            description: `Live video conversation with ${selectedPersonaData?.name}`,
            host_replica_id: replicaId,
            participants: [],
            status: 'live', // Mark as live immediately since conversation is starting
            start_time: new Date().toISOString(),
            duration: 60, // Default duration
            type: 'video_call',
            visibility: 'public',
            max_participants: 10,
            room_url: conversationData.conversation_url
          });

          if (eventError) {
            console.error('Failed to create live event:', eventError);
            // Don't fail the whole process if live event creation fails
          } else if (liveEvent) {
            liveEventId = liveEvent.id;
            console.log('Live event created successfully:', liveEvent);
          }
        } catch (eventErr) {
          console.error('Error creating live event:', eventErr);
          // Don't fail the whole process if live event creation fails
        }        // Store current conversation info
        setCurrentConversation({
          conversationId: conversationData.conversation_id,
          conversationUrl: conversationData.conversation_url,
          liveEventId: liveEventId,
          name: conversationName || `${selectedPersonaData?.name} Conversation`
        });
        
        // Add to active conversations list
        const newActiveConversation = {
          id: conversationData.conversation_id,
          name: conversationName || `${selectedPersonaData?.name} Conversation`,
          url: conversationData.conversation_url,
          persona_name: selectedPersonaData?.name || 'Unknown Persona',
          created_at: new Date().toISOString()
        };
        setActiveConversations(prev => [newActiveConversation, ...prev]);
        
        // Reset form
        setConversationName('');
        setConversationContext('');
        setSelectedPersona('');
        
        toast({
        title: "Conversation Created",
        description: `Your conversation with ${selectedPersonaData?.name} is ready. Click to join!`,
      });

      onConversationCreated?.(conversationData);
    } else {
      throw new Error('Failed to create conversation - no ID or URL returned');
    }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      
      // Handle specific Tavus API errors
      if (errorMessage.includes('maximum concurrent conversations')) {
        errorMessage = `You have reached the maximum number of active conversations on your Tavus account. 

To fix this:
1. End any existing conversations that are still running
2. Wait 5-10 minutes for inactive conversations to timeout automatically
3. Or upgrade your Tavus plan for more concurrent conversations

Try again in a few minutes.`;
      } else if (errorMessage.includes('Insufficient Tavus credits')) {
        errorMessage = 'Insufficient Tavus credits. Please add credits to your Tavus account or upgrade your plan.';
      } else if (errorMessage.includes('Invalid Tavus API key')) {
        errorMessage = 'Invalid Tavus API key. Please check your API key configuration.';
      }
      
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      
      toast({
        title: "Conversation Creation Failed",
        description: errorMessage.includes('maximum concurrent') ? 
          "Too many active conversations. Please wait a few minutes and try again." : 
          errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinConversation = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const handleEndConversation = async (conversationId: string) => {
    setIsEnding(true);
    try {
      // End the Tavus conversation
      const { success, error: tavusError } = await endTavusConversation(conversationId);
      
      if (!success) {
        console.error('Failed to end Tavus conversation:', tavusError);
        toast({
          title: "Warning",
          description: "Failed to end conversation in Tavus, but updating status locally.",
          variant: "destructive",
        });
      }

      // Update the live event status to ended if we have the live event ID
      if (currentConversation?.liveEventId && currentConversation.conversationId === conversationId) {
        const { error: eventError } = await updateEventStatus(
          currentConversation.liveEventId, 
          'ended'
        );
        
        if (eventError) {
          console.error('Failed to update live event status:', eventError);
        }
      }

      // Clear current conversation if it's the one being ended
      if (currentConversation?.conversationId === conversationId) {
        setCurrentConversation(null);
      }
      
      // Remove from active conversations
      setActiveConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      );      toast({
        title: "Conversation Ended",
        description: "The conversation has been ended successfully.",
      });

    } catch (error) {
      console.error('Error ending conversation:', error);
      toast({
        title: "Error",
        description: "Failed to end conversation properly. It may still be active.",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  // Load active conversations on component mount
  const loadActiveConversations = async () => {
    try {
      const result = await listTavusConversations();
      console.log('listTavusConversations result:', result); // Debug log
      
      if (result.conversations && Array.isArray(result.conversations)) {
        // Filter only active/live conversations
        const activeConvs = result.conversations
          .filter(conv => conv.status === 'active' || conv.status === 'live')
          .map(conv => ({
            id: conv.conversation_id,
            name: conv.conversation_name || 'Untitled Conversation',
            url: conv.conversation_url,
            persona_name: conv.persona_name || 'Unknown Persona',
            created_at: conv.created_at
          }));
        
        setActiveConversations(activeConvs);
      } else {
        console.warn('Invalid conversations data structure:', {
          result,
          conversationsType: typeof result.conversations,
          isArray: Array.isArray(result.conversations),
          conversationsKeys: result.conversations ? Object.keys(result.conversations) : 'null'
        });
        setActiveConversations([]);
      }
    } catch (error) {
      console.error('Error loading active conversations:', error);
      setActiveConversations([]);
      // Don't show error toast for this, as it's not critical
    }
  };

  useEffect(() => {
    loadActiveConversations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Create New Conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Create Video Conversation
          </CardTitle>
          <p className="text-sm text-gray-600">
            Start a real-time video conversation with your AI persona
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateConversation} className="space-y-4">
            <div>
              <Label htmlFor="persona">Select Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger id="persona">
                  <SelectValue placeholder="Choose a persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                      {persona.attributes?.default_replica_id && (
                        <span className="text-xs text-green-600 ml-2">(Has Replica)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conversationName">Conversation Name (Optional)</Label>
              <Input 
                id="conversationName" 
                value={conversationName} 
                onChange={(e) => setConversationName(e.target.value)}
                placeholder="Enter conversation name..."
              />
            </div>

            <div>
              <Label htmlFor="conversationContext">Conversation Context (optional)</Label>
              <textarea
                id="conversationContext"
                value={conversationContext}
                onChange={(e) => setConversationContext(e.target.value)}
                placeholder="Enter context for your conversation"
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide additional context or instructions for the conversation
              </p>
            </div>            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxDuration">Max Duration (minutes)</Label>
                <Input 
                  id="maxDuration" 
                  type="number"
                  min="5"
                  max="120"
                  value={maxDuration} 
                  onChange={(e) => setMaxDuration(parseInt(e.target.value) || 30)}
                  disabled
                  className="opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Currently not supported by Tavus API
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="enableRecording"
                  checked={enableRecording}
                  onChange={(e) => setEnableRecording(e.target.checked)}
                />
                <Label htmlFor="enableRecording" className="text-sm">
                  Enable Recording
                </Label>
              </div>
            </div>            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <div className="font-medium mb-2">Unable to create conversation</div>
                <div className="whitespace-pre-wrap">{error}</div>
              </div>
            )}

            <Button type="submit" disabled={isCreating || !selectedPersona} className="w-full">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Conversation...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Create Conversation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Conversations */}
      {activeConversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{conversation.name}</h4>
                    <p className="text-sm text-gray-600">
                      with {conversation.persona_name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Created {new Date(conversation.created_at).toLocaleTimeString()}
                    </p>                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleJoinConversation(conversation.url)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Join
                    </Button>
                    <Button
                      onClick={() => handleEndConversation(conversation.id)}
                      size="sm"
                      variant="destructive"
                      disabled={isEnding}
                      className="flex items-center gap-2"
                    >
                      {isEnding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      End
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-900">How it works:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Select a persona with an associated replica for best results</li>
              <li>• The conversation will open in a new tab with video calling interface</li>
              <li>• Speak naturally - the AI will respond with voice and video</li>
              <li>• Conversations automatically end after the specified duration</li>
              <li>• Recordings (if enabled) will be available in your dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
