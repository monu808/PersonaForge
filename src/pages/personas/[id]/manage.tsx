import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  Settings, 
  Edit, 
  Trash2, 
  Star,
  Activity,
  Calendar,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPersonas } from '@/lib/api/personas';
import { geminiChatService, ChatConfig } from '@/lib/api/gemini-chat';
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

export default function PersonaManagePage() {
  const { id: personaId } = useParams<{ id: string }>();
  const [persona, setPersona] = useState<UserPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personaId) {
      loadPersona();
    }
  }, [personaId]);

  const loadPersona = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getPersonas();
      
      if (error) throw error;
      
      const foundPersona = data?.find(p => p.id === personaId);
      if (foundPersona) {
        setPersona(foundPersona);
      } else {
        setError('Persona not found');
      }
    } catch (err) {
      console.error('Error loading persona:', err);
      setError('Failed to load persona details');
    } finally {
      setLoading(false);
    }
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

  const startChatWithPersona = async () => {
    if (!persona) return;

    try {
      const config: ChatConfig = {
        persona_id: persona.id,
        persona_name: persona.name,
        persona_description: persona.description,
        persona_traits: persona.attributes?.traits?.map(t => t.name || t) || [],
        system_prompt: persona.attributes?.system_prompt,
        context: persona.attributes?.context
      };

      const sessionId = await geminiChatService.startChat(config);
      
      toast({
        title: 'Chat Started',
        description: `Now chatting with ${persona.name}`,
      });

      // Navigate to personas page with chat active
      window.location.href = '/personas';
    } catch (err) {
      console.error('Error starting chat:', err);
      toast({
        title: 'Error',
        description: 'Failed to start chat session',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading persona...</p>
        </div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-center mb-2">
              {error || 'Persona Not Found'}
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              {error === 'Persona not found' 
                ? 'The persona you\'re looking for doesn\'t exist or has been deleted.'
                : 'There was an error loading the persona details.'
              }
            </p>
            <Button asChild>
              <Link to="/personas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Personas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/personas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Personas
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={persona.attributes?.image_url} />
                <AvatarFallback className="text-xl">
                  {getPersonaEmoji(persona.replica_type)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{persona.name}</h1>
                <p className="text-muted-foreground">{persona.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={startChatWithPersona} className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Start Chat</span>
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traits">Traits & Behavior</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Persona Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <Badge variant="secondary" className="mt-1">
                          {persona.replica_type}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-sm mt-1">
                          {new Date(persona.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm mt-1">{persona.description}</p>
                    </div>

                    {persona.attributes?.system_prompt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">System Prompt</label>
                        <p className="text-sm mt-1 bg-muted p-3 rounded-lg">
                          {persona.attributes.system_prompt}
                        </p>
                      </div>
                    )}

                    {persona.attributes?.context && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Context</label>
                        <p className="text-sm mt-1 bg-muted p-3 rounded-lg">
                          {persona.attributes.context}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Quick Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversations</span>
                      <span className="text-sm font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">
                        {new Date(persona.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={startChatWithPersona} 
                      className="w-full justify-start"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Persona
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="h-4 w-4 mr-2" />
                      Mark as Favorite
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personality Traits</CardTitle>
              </CardHeader>
              <CardContent>
                {persona.attributes?.traits && persona.attributes.traits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {persona.attributes.traits.map((trait, index) => (
                      <Badge key={index} variant="outline">
                        {typeof trait === 'string' ? trait : trait.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No traits configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No recent activity to display</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Persona Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Basic Information
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bot className="h-4 w-4 mr-2" />
                  Configure AI Behavior
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Persona
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
