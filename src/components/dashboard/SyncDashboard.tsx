import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Mic, 
  Video, 
  RefreshCw, 
  Eye, 
  MessageSquare,
  TrendingUp,
  Clock,
  Zap,
  Bot,
  Play
} from 'lucide-react';
import { syncService, syncEvents } from '@/lib/api/sync-service';
import { PersonaChat } from '@/components/chat/PersonaChat';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncDashboardProps {
  className?: string;
}

export function SyncDashboard({ className }: SyncDashboardProps) {
  const [personas, setPersonas] = useState<any[]>([]);
  const [voiceContent, setVoiceContent] = useState<any[]>([]);
  const [videoContent, setVideoContent] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'error'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    setupSyncListeners();
    loadInitialData();

    return () => {
      cleanupSyncListeners();
    };
  }, []);

  const setupSyncListeners = () => {
    syncEvents.on('personas:updated', (updatedPersonas) => {
      setPersonas(updatedPersonas || []);
      setLastSyncTime(new Date());
    });

    syncEvents.on('voices:updated', (updatedVoices) => {
      setVoiceContent(updatedVoices || []);
      setLastSyncTime(new Date());
    });

    syncEvents.on('videos:updated', (updatedVideos) => {
      setVideoContent(updatedVideos || []);
      setLastSyncTime(new Date());
    });

    syncEvents.on('activities:updated', (updatedActivities) => {
      setActivities(updatedActivities || []);
      setLastSyncTime(new Date());
    });

    syncEvents.on('activity:logged', (activity) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]);
      setLastSyncTime(new Date());
    });

    syncEvents.on('neurovia:coruscant:action', (actionData) => {
      // Show real-time action feedback
      console.log('Coruscant action synced:', actionData);
    });
  };

  const cleanupSyncListeners = () => {
    syncEvents.off('personas:updated', () => {});
    syncEvents.off('voices:updated', () => {});
    syncEvents.off('videos:updated', () => {});
    syncEvents.off('activities:updated', () => {});
    syncEvents.off('activity:logged', () => {});
    syncEvents.off('neurovia:coruscant:action', () => {});
  };

  const loadInitialData = async () => {
    setSyncStatus('syncing');
    try {
      await syncService.syncAllData();
      setSyncStatus('connected');
    } catch (error) {
      console.error('Error loading initial data:', error);
      setSyncStatus('error');
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      await syncService.syncAllData();
      setSyncStatus('connected');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncStatus('error');
    }
  };

  const openPersonaChat = (persona: any) => {
    setSelectedPersona(persona);
    setShowChat(true);
  };

  const stats = {
    totalPersonas: personas.length,
    totalVoices: voiceContent.length,
    totalVideos: videoContent.length,
    totalActivities: activities.length
  };

  return (
    <div className={className}>
      {/* Sync Status Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus === 'connected' ? 'bg-green-500' : 
                syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <CardTitle>Sync Dashboard</CardTitle>
              <Badge variant={syncStatus === 'connected' ? 'default' : 'secondary'}>
                {syncStatus === 'connected' ? 'Connected' : 
                 syncStatus === 'syncing' ? 'Syncing...' : 
                 'Error'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPersonas}</p>
                <p className="text-xs text-gray-500">Personas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalVoices}</p>
                <p className="text-xs text-gray-500">Voice Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
                <p className="text-xs text-gray-500">Video Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
                <p className="text-xs text-gray-500">Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="chat">Chat Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {persona.attributes?.image_url ? (
                          <img 
                            src={persona.attributes.image_url} 
                            alt={persona.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{persona.name}</h3>
                          <p className="text-xs text-gray-500">{persona.replica_type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {persona.attributes?.default_replica_id ? 'Has Replica' : 'No Replica'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {persona.description || 'No description available'}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openPersonaChat(persona)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-green-500" />
                  Voice Content ({voiceContent.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {voiceContent.slice(0, 5).map((voice, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{voice.personas?.name || 'Unknown Persona'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(voice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Video Content ({videoContent.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {videoContent.slice(0, 5).map((video, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{video.personas?.name || 'Unknown Persona'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {video.metadata?.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {activities.slice(0, 10).map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <Card key={persona.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openPersonaChat(persona)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {persona.attributes?.image_url ? (
                      <img 
                        src={persona.attributes.image_url} 
                        alt={persona.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{persona.name}</h3>
                      <p className="text-xs text-gray-500">Ready to chat</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Conversation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && selectedPersona && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChat(false)}
          >
            <motion.div
              className="w-full max-w-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PersonaChat 
                persona={selectedPersona} 
                onClose={() => setShowChat(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
