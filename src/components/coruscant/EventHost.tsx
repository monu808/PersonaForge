import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Mic, 
  Video, 
  Users, 
  Calendar, 
  Clock,
  Share,
  Settings,
  Play,
  Square,
  MessageCircle,
  Phone,
  Monitor,
  Globe,
  Lock,
  Eye,
  Loader2,
  Headphones
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getPodcastManager, type PodcastGenerationOptions } from '@/lib/api/podcast-manager';
import { PODCAST_TOPICS, DEFAULT_PODCAST_VOICES } from '@/lib/api/podcasts';
import { createLiveEvent, getUserEvents, updateEventStatus, LiveEvent } from '@/lib/api/events';

interface Replica {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface EventHostProps {
  replicas: Replica[];
}

const eventTypes = [
  { value: 'podcast', label: 'Podcast', icon: <Mic className="h-4 w-4" /> },
  { value: 'interview', label: 'Interview', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'chat', label: 'Group Chat', icon: <Users className="h-4 w-4" /> },
  { value: 'presentation', label: 'Presentation', icon: <Monitor className="h-4 w-4" /> },
  { value: 'workshop', label: 'Workshop', icon: <Settings className="h-4 w-4" /> }
];

export default function EventHost({ replicas }: EventHostProps) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
    // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hostReplicaId: '',
    type: '',
    visibility: 'public',
    maxParticipants: 50,
    duration: 60,
    // Podcast-specific fields
    podcastTopic: '',
    customTopic: '',
    host1Voice: DEFAULT_PODCAST_VOICES.host1.id,
    host2Voice: DEFAULT_PODCAST_VOICES.host2.id,
    quality: 'standard' as 'draft' | 'standard' | 'high',
    enableMerging: true
  });

  const [isCreatingPodcast, setIsCreatingPodcast] = useState(false);
  const podcastManager = getPodcastManager();

  // Load user events on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data, error } = await getUserEvents();
        if (error) {
          console.error('Error loading events:', error);
          return;
        }
        if (data) {
          setEvents(data);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  const createEvent = async () => {
    // Validate based on event type
    if (formData.type === 'podcast') {
      // For podcasts, only title and type are required
      if (!formData.title || !formData.type) {
        toast({
          title: "Missing Information",
          description: "Please fill in the event title.",
          variant: "destructive"
        });
        return;
      }
    } else {
      // For regular events, require title, host persona, and type
      if (!formData.title || !formData.hostReplicaId || !formData.type) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
    }

    // Handle podcast creation specially
    if (formData.type === 'podcast') {
      await createPodcastEvent();
      return;
    }

    try {
      const { data: newEvent, error } = await createLiveEvent({
        title: formData.title,
        description: formData.description,
        host_replica_id: formData.hostReplicaId,
        participants: [],
        status: 'upcoming',
        start_time: new Date().toISOString(),
        duration: formData.duration,
        type: formData.type,
        visibility: formData.visibility as 'public' | 'private',
        max_participants: formData.maxParticipants,
        room_url: `https://coruscant.app/room/${Date.now()}`
      });

      if (error) {
        toast({
          title: "Event Creation Failed",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (newEvent) {
        setEvents(prev => [newEvent, ...prev]);
      }
      
      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        hostReplicaId: '',
        type: '',
        visibility: 'public',
        maxParticipants: 50,
        duration: 60,
        podcastTopic: '',
        customTopic: '',
        host1Voice: DEFAULT_PODCAST_VOICES.host1.id,
        host2Voice: DEFAULT_PODCAST_VOICES.host2.id,
        quality: 'standard',
        enableMerging: true
      });

      toast({
        title: "Event Created",
        description: `"${formData.title}" has been scheduled successfully.`,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Event Creation Failed",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };
  const createPodcastEvent = async () => {
    setIsCreatingPodcast(true);

    try {
      const topic = formData.customTopic.trim() || formData.podcastTopic;
      
      if (!topic) {
        toast({
          title: "Topic Required",
          description: "Please select a topic or enter a custom topic for the podcast.",
          variant: "destructive",
        });
        setIsCreatingPodcast(false);
        return;
      }

      // Create enhanced podcast with audio merging capabilities
      const options: PodcastGenerationOptions = {
        enableMerging: formData.enableMerging,
        quality: formData.quality,
        pauseBetweenSpeakers: 1.0,
        maxSegments: formData.duration > 7 ? 12 : 8
      };

      const result = await podcastManager.createEnhancedPodcast({
        topic,
        duration: formData.duration,
        host1VoiceId: formData.host1Voice,
        host2VoiceId: formData.host2Voice
      }, options);

      if (result.error) {
        toast({
          title: "Podcast Creation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Podcast Event Created",
        description: `"${formData.title}" podcast is being generated. Check the Neurovia Podcasts tab to view it.`,
      });

      // Create a shared event to track the podcast - show as live
      const { data: podcastEvent, error } = await createLiveEvent({
        title: formData.title,
        description: `Podcast about: ${topic}`,
        host_replica_id: null, // Podcasts don't have a specific replica host
        participants: [],
        status: 'live', // Show podcasts as live after creation
        start_time: new Date().toISOString(),
        duration: formData.duration,
        type: 'podcast',
        visibility: 'public', // Podcasts are always public
        max_participants: 0, // Podcasts don't have live participants
        room_url: `/neurovia?tab=podcasts`
      });

      if (error) {
        console.error('Error creating podcast event:', error);
        // Don't fail the whole process if event creation fails
      } else if (podcastEvent) {
        setEvents(prev => [podcastEvent, ...prev]);
      }

      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        hostReplicaId: '',
        type: '',
        visibility: 'public',
        maxParticipants: 50,
        duration: 60,
        podcastTopic: '',
        customTopic: '',
        host1Voice: DEFAULT_PODCAST_VOICES.host1.id,
        host2Voice: DEFAULT_PODCAST_VOICES.host2.id,
        quality: 'standard',
        enableMerging: true
      });

    } catch (error) {
      console.error('Error creating podcast:', error);
      toast({
        title: "Podcast Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create podcast',
        variant: "destructive",
      });
    } finally {
      setIsCreatingPodcast(false);
    }
  };
  const startEvent = async (event: LiveEvent) => {
    try {
      // Update event status to live in the database
      const { error } = await updateEventStatus(event.id, 'live');
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to start event: " + error,
          variant: "destructive",
        });
        return;
      }

      setActiveEvent(event);
      setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, status: 'live' } : e
      ));
      
      toast({
        title: "Event Started",
        description: `"${event.title}" is now live and visible to all users!`,
      });
    } catch (error) {
      console.error('Error starting event:', error);
      toast({
        title: "Error",
        description: "Failed to start event",
        variant: "destructive",
      });
    }
  };

  const endEvent = async () => {
    if (activeEvent) {
      try {
        // Update event status to ended in the database
        const { error } = await updateEventStatus(activeEvent.id, 'ended');
        
        if (error) {
          toast({
            title: "Error",
            description: "Failed to end event: " + error,
            variant: "destructive",
          });
          return;
        }

        setEvents(prev => prev.map(e => 
          e.id === activeEvent.id ? { ...e, status: 'ended' } : e
        ));
        setActiveEvent(null);
        
        toast({
          title: "Event Ended",
          description: `"${activeEvent.title}" has ended and is now visible in previous conversations.`,
        });
      } catch (error) {
        console.error('Error ending event:', error);
        toast({
          title: "Error",
          description: "Failed to end event",
          variant: "destructive",
        });
      }
    }
  };

  const shareEvent = (event: LiveEvent) => {
    navigator.clipboard.writeText(event.room_url || '');
    toast({
      title: "Link Copied",
      description: "Event link has been copied to clipboard.",
    });
  };

  if (activeEvent) {
    return (
      <div className="space-y-6">
        {/* Live Event Interface */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <Play className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-green-800">{activeEvent.title}</CardTitle>
                  <p className="text-sm text-green-600">
                    Hosted by {replicas.find(r => r.id === activeEvent.host_replica_id)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">LIVE</span>
                <span className="text-sm text-green-600">
                  {activeEvent.participants.length} / {activeEvent.max_participants} participants
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Host Controls</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Mic className="h-4 w-4 mr-2" />
                      Mute/Unmute
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Video className="h-4 w-4 mr-2" />
                      Camera Toggle
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Share className="h-4 w-4 mr-2" />
                      Share Screen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Participants</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Host (You)</span>
                    </div>
                    {/* Mock participants */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Anonymous User 1</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Anonymous User 2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Chat</h4>
                  <div className="space-y-2">
                    <div className="text-xs bg-gray-100 p-2 rounded">
                      <span className="font-medium">User1:</span> Great presentation!
                    </div>
                    <div className="text-xs bg-gray-100 p-2 rounded">
                      <span className="font-medium">User2:</span> Can you share the slides?
                    </div>
                  </div>
                  <Input placeholder="Type a message..." className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* End Event */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => shareEvent(activeEvent)}>
                <Share className="h-4 w-4 mr-2" />
                Share Link
              </Button>
              <Button variant="destructive" onClick={endEvent}>
                <Square className="h-4 w-4 mr-2" />
                End Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Host Events & Podcasts
            </h2>
            <p className="text-muted-foreground">
              Create live interactive spaces where your personas can host events
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up a live event where your persona can interact with participants
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <Input
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>              {/* Only show Host Persona for non-podcast events */}
              {formData.type !== 'podcast' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host Persona</label>
                  <Select 
                    value={formData.hostReplicaId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hostReplicaId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select host persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {replicas.filter(r => r.status === 'active').map((replica) => (
                        <SelectItem key={replica.id} value={replica.id}>
                          {replica.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Only show Visibility for non-podcast events */}
              {formData.type !== 'podcast' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <Select 
                    value={formData.visibility} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Unlisted
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}{/* Conditional fields based on event type */}
              {formData.type !== 'podcast' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Participants</label>
                    <Input
                      type="number"
                      min="2"
                      max="1000"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                    />
                  </div>
                </>
              )}

              {formData.type === 'podcast' && (
                <>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Podcast Topic</label>
                    <Select 
                      value={formData.podcastTopic} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, podcastTopic: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {PODCAST_TOPICS.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Custom Topic (Optional)</label>
                    <Input
                      placeholder="Enter a custom topic"
                      value={formData.customTopic}
                      onChange={(e) => setFormData(prev => ({ ...prev, customTopic: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Host 1 Voice</label>
                    <Select 
                      value={formData.host1Voice} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, host1Voice: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_PODCAST_VOICES.host1.id}>
                          {DEFAULT_PODCAST_VOICES.host1.name} (Default)
                        </SelectItem>
                        {/* Add more voice options here if available */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Host 2 Voice</label>
                    <Select 
                      value={formData.host2Voice} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, host2Voice: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_PODCAST_VOICES.host2.id}>
                          {DEFAULT_PODCAST_VOICES.host2.name} (Default)
                        </SelectItem>
                        {/* Add more voice options here if available */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality</label>
                    <Select 
                      value={formData.quality} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, quality: value as 'draft' | 'standard' | 'high' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  min={formData.type === 'podcast' ? "3" : "15"}
                  max={formData.type === 'podcast' ? "30" : "480"}
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {formData.type !== 'podcast' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this event is about..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            )}            <div className="flex gap-2">
              <Button onClick={createEvent} disabled={isCreatingPodcast}>
                {isCreatingPodcast ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Podcast...
                  </>
                ) : (
                  <>
                    {formData.type === 'podcast' ? (
                      <Headphones className="h-4 w-4 mr-2" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    {formData.type === 'podcast' ? 'Create Podcast' : 'Create Event'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isCreatingPodcast}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your upcoming and past events
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">              {events.map((event) => {
                const replica = event.type === 'podcast' ? null : replicas.find(r => r.id === event.host_replica_id);
                const eventType = eventTypes.find(t => t.value === event.type);
                
                return (
                  <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                      {eventType?.icon || <Calendar className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.type === 'podcast' ? (
                          `AI Podcast • ${eventType?.label}`
                        ) : (
                          `Hosted by ${replica?.name} • ${eventType?.label}`
                        )}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'live' 
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.duration} min
                        </span>
                        {event.type !== 'podcast' && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.participants.length} / {event.max_participants}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.status === 'upcoming' && event.type !== 'podcast' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => shareEvent(event)}>
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => startEvent(event)}>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        </>
                      )}
                      {event.status === 'live' && (
                        <Button variant="outline" size="sm" onClick={() => {
                          if (event.type === 'podcast') {
                            window.location.href = event.room_url || '/neurovia?tab=podcasts';
                          } else {
                            setActiveEvent(event);
                          }
                        }}>
                          {event.type === 'podcast' ? (
                            <>
                              <Headphones className="h-4 w-4 mr-1" />
                              Listen
                            </>
                          ) : (
                            <>
                              <Monitor className="h-4 w-4 mr-1" />
                              Join
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Hosting Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Video className="h-6 w-6 text-green-500" />
              </div>
              <h4 className="font-semibold mb-2">Live Video/Audio</h4>
              <p className="text-sm text-gray-600">
                Host live events with real-time video and audio interaction
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-semibold mb-2">Multi-Participant</h4>
              <p className="text-sm text-gray-600">
                Support multiple participants in conversations and Q&As
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-semibold mb-2">Interactive Chat</h4>
              <p className="text-sm text-gray-600">
                Real-time chat alongside video for enhanced engagement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
