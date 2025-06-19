import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  Calendar, 
  Video, 
  Mic, 
  MessageCircle,
  Radio,
  User,
  Play,
  Loader2
} from 'lucide-react';
import { LiveEvent, getPublicLiveEvents } from '@/lib/api/events';
import { toast } from '@/components/ui/use-toast';

export function LiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveEvents();
    
    // Set up polling to refresh live events every 30 seconds
    const interval = setInterval(loadLiveEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveEvents = async () => {
    try {
      const { data, error } = await getPublicLiveEvents();
      
      if (error) {
        console.error('Error loading live events:', error);
        toast({
          title: "Error",
          description: "Failed to load live events: " + error,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading live events:', error);
      toast({
        title: "Error",
        description: "Failed to load live events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleJoinEvent = async (event: LiveEvent) => {
    if (event.type === 'podcast') {
      // For podcasts, just navigate to the podcast page
      window.location.href = '/neurovia?tab=podcasts';
      return;
    }

    // For live conversations, navigate directly to the conversation URL
    if (event.room_url) {
      window.open(event.room_url, '_blank');
    } else {
      toast({
        title: "Unable to Join",
        description: "Conversation link not available",
        variant: "destructive",
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'video_call':
        return <Video className="h-5 w-5" />;
      case 'voice_call':
        return <Mic className="h-5 w-5" />;
      case 'chat':
        return <MessageCircle className="h-5 w-5" />;
      case 'podcast':
        return <Radio className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-ping"></div>
            LIVE
          </div>
        );
      case 'upcoming':
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Upcoming</div>;
      case 'ended':
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">Previous</div>;
      default:
        return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">{status}</div>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <span className="ml-2 text-white">Loading live events...</span>
        </div>
      </div>
    );
  }

  const liveEvents = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'ended');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Live Events</h2>
            <p className="text-purple-200/80">Join live conversations and events</p>
          </div>
        </div>
        <Button
          onClick={loadLiveEvents}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30 hover:border-purple-400"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <Card className="bg-black/40 border-red-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              Live Now ({liveEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{event.title}</h4>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Hosted by {event.host_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.duration} min
                      </span>
                      {event.type !== 'podcast' && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.participants.length} / {event.max_participants}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Started {formatTimeAgo(event.start_time)}
                      </span>
                    </div>
                  </div>                  <Button
                    onClick={() => handleJoinEvent(event)}
                    disabled={event.type !== 'podcast' && event.participants.length >= event.max_participants}
                    className="bg-red-600/20 border-red-500/50 text-red-200 hover:bg-red-600/30 hover:border-red-400"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {event.type === 'podcast' ? 'Listen' : 'Join'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-blue-300">Upcoming Events ({upcomingEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 border border-blue-500/20 rounded-lg bg-blue-500/5">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{event.title}</h4>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Hosted by {event.host_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.duration} min
                      </span>
                      {event.type !== 'podcast' && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.participants.length} / {event.max_participants}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Starts {formatTimeAgo(event.start_time)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white/80">Previous Conversations ({pastEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 border border-white/10 rounded-lg bg-white/5">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white/80">{event.title}</h4>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Hosted by {event.host_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.duration} min
                      </span>
                      {event.end_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Ended {formatTimeAgo(event.end_time)}
                        </span>
                      )}
                    </div>
                  </div>

                  {event.type === 'podcast' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/neurovia?tab=podcasts'}
                      className="text-white/60 border-white/20 hover:text-white hover:border-white/40"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Listen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <Radio className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/60 mb-2">No live events yet</h3>
          <p className="text-white/40">Check back later for live conversations and events!</p>
        </div>
      )}
    </div>
  );
}
