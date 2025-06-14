import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, Phone, ExternalLink, Clock, Users } from 'lucide-react';
import { createTavusConversation } from '@/lib/api/tavus';
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

export function TavusConversationManager({ personas, onConversationCreated }: TavusConversationManagerProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [conversationName, setConversationName] = useState('');
  const [maxDuration, setMaxDuration] = useState<number>(30);
  const [enableRecording, setEnableRecording] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    try {
      const selectedPersonaData = personas.find(p => p.id === selectedPersona);
      const personaId = selectedPersonaData?.attributes?.default_replica_id || selectedPersona;

      const conversationData = await createTavusConversation({
        persona_id: personaId,
        conversation_name: conversationName || `${selectedPersonaData?.name} Conversation`,
        properties: {
          max_duration: maxDuration * 60, // Convert to seconds
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: enableRecording,
        },
      });

      if (conversationData.error) {
        throw new Error(conversationData.error);
      }

      if (conversationData.conversation_id && conversationData.conversation_url) {
        // Add to active conversations list
        const newConversation = {
          id: conversationData.conversation_id,
          name: conversationName || `${selectedPersonaData?.name} Conversation`,
          url: conversationData.conversation_url,
          persona_name: selectedPersonaData?.name || 'Unknown',
          created_at: new Date().toISOString(),
        };
        
        setActiveConversations(prev => [newConversation, ...prev]);
        
        // Reset form
        setConversationName('');
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinConversation = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxDuration">Max Duration (minutes)</Label>
                <Input 
                  id="maxDuration" 
                  type="number"
                  min="5"
                  max="120"
                  value={maxDuration} 
                  onChange={(e) => setMaxDuration(parseInt(e.target.value) || 30)}
                />
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
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Error: {error}
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
                    </p>
                  </div>
                  <Button
                    onClick={() => handleJoinConversation(conversation.url)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join
                  </Button>
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
