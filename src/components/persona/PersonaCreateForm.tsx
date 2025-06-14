import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { createPersona } from '@/lib/api/personas';
import { syncService } from '@/lib/api/sync-service';
import { Loader2, User, Brain } from 'lucide-react';

const REPLICA_TYPES = ['personal', 'historical', 'professional', 'emergency', 'creator'];

// Tavus-specific personality layer configurations
const PERSONA_TEMPLATES: Record<string, {
  name: string;
  systemPrompt: string;
  context: string;
  layers: {
    llm: { model: string };
    tts: { voice_settings: { speed: string; emotion: string[] } };
    stt: { participant_pause_sensitivity: string };
  };
}> = {
  assistant: {
    name: 'Personal Assistant',
    systemPrompt: 'You are a helpful personal assistant. Be professional, friendly, and concise in your responses.',
    context: 'You help with scheduling, reminders, and general assistance tasks.',
    layers: {
      llm: { model: 'gpt-4' },
      tts: { voice_settings: { speed: 'normal', emotion: ['professional'] } },
      stt: { participant_pause_sensitivity: 'medium' }
    }
  },
  coach: {
    name: 'Life Coach', 
    systemPrompt: 'You are a supportive life coach. Help users achieve their goals with encouragement and practical advice.',
    context: 'You specialize in motivation, goal-setting, and personal development.',
    layers: {
      llm: { model: 'gpt-4' },
      tts: { voice_settings: { speed: 'normal', emotion: ['positivity:high', 'curiosity'] } },
      stt: { participant_pause_sensitivity: 'high' }
    }
  },
  educator: {
    name: 'Educator',
    systemPrompt: 'You are a knowledgeable educator. Explain concepts clearly and adapt to the learner\'s level.',
    context: 'You help students learn new topics with patience and clarity.',
    layers: {
      llm: { model: 'gpt-4' },
      tts: { voice_settings: { speed: 'slow', emotion: ['patience'] } },
      stt: { participant_pause_sensitivity: 'high' }
    }
  }
};

export function PersonaCreateForm({ onSuccess }: { onSuccess?: (personaId: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [replicaType, setReplicaType] = useState<string>('');
  const [personaTemplate, setPersonaTemplate] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [context, setContext] = useState('');
  const [defaultReplicaId, setDefaultReplicaId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Handle template selection
  const handleTemplateChange = (template: string) => {
    setPersonaTemplate(template);
    if (template && PERSONA_TEMPLATES[template]) {
      const config = PERSONA_TEMPLATES[template];
      setSystemPrompt(config.systemPrompt);
      setContext(config.context);
      if (!name) setName(config.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !replicaType) {
      setError('Name and Replica Type are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {      const result = await createPersona({
        name,
        description,
        replicaType,
        traits: [], // Will be enhanced with Tavus persona configuration
        systemPrompt,
        context,
        defaultReplicaId
      });

      if (result.error) {
        throw result.error;
      }      if (result.data) {
        // Reset form
        setName('');
        setDescription('');
        setReplicaType('');
        setPersonaTemplate('');
        setSystemPrompt('');
        setContext('');
        setDefaultReplicaId('');
        
        // Log activity for sync
        await syncService.logActivity(
          'persona_created',
          `Created new persona: ${result.data.name}`,
          {
            persona_id: result.data.id,
            persona_name: result.data.name,
            replica_type: result.data.replica_type
          }
        );
        
        onSuccess?.(result.data.id);
      } else {
        throw new Error('Failed to create persona, no data returned.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error creating persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Persona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Persona Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter persona name..."
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your persona's purpose and characteristics..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="replicaType">Replica Type</Label>
                <Select value={replicaType} onValueChange={setReplicaType}>
                  <SelectTrigger id="replicaType">
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPLICA_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="personaTemplate">Persona Template (Optional)</Label>
                <Select value={personaTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="personaTemplate">
                    <SelectValue placeholder="Choose a template or create custom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERSONA_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tavus Persona Configuration */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Brain className="h-4 w-4" />
                Conversational AI Configuration
              </div>
              
              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea 
                  id="systemPrompt" 
                  value={systemPrompt} 
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define how your persona should behave and respond..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This defines your persona's personality and behavior patterns
                </p>
              </div>
              
              <div>
                <Label htmlFor="context">Contextual Information</Label>
                <Textarea 
                  id="context" 
                  value={context} 
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide background information for better responses..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Background information that helps the LLM provide better responses
                </p>
              </div>
              
              <div>
                <Label htmlFor="defaultReplicaId">Default Replica ID (Optional)</Label>
                <Input 
                  id="defaultReplicaId" 
                  value={defaultReplicaId} 
                  onChange={(e) => setDefaultReplicaId(e.target.value)}
                  placeholder="Enter replica ID if available..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link to an existing Tavus replica for audio/visual appearance
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Error: {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Persona...
                </>
              ) : (
                'Create Persona'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

