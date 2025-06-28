import { supabase } from '../auth';

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  host_replica_id: string | null;
  host_user_id: string;
  host_name: string;
  participants: string[];
  status: 'upcoming' | 'live' | 'ended';
  start_time: string;
  end_time?: string;
  duration: number;
  max_participants: number;
  type: string;
  visibility: 'public' | 'private' | 'unlisted';
  room_url?: string;
  created_at: string;
  updated_at: string;
}

const DEMO_EVENTS_KEY = 'persona_forge_demo_events';

// Demo events for when database is not available
function getDemoEvents(): LiveEvent[] {
  try {
    const stored = localStorage.getItem(DEMO_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDemoEvents(events: LiveEvent[]): void {
  try {
    localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save demo events:', error);
  }
}

function addDemoEvent(event: LiveEvent): void {
  const events = getDemoEvents();
  events.unshift(event);
  saveDemoEvents(events);
}

function updateDemoEvent(id: string, updates: Partial<LiveEvent>): void {
  const events = getDemoEvents();
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates, updated_at: new Date().toISOString() };
    saveDemoEvents(events);
  }
}

function removeDemoEvent(id: string): void {
  const events = getDemoEvents();
  const filtered = events.filter(e => e.id !== id);
  saveDemoEvents(filtered);
}

/**
 * Create a new live event
 */
export async function createLiveEvent(eventData: Omit<LiveEvent, 'id' | 'created_at' | 'updated_at' | 'host_user_id' | 'host_name'>): Promise<{ data: LiveEvent | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    // Try to get a better display name
    let displayName = 'Demo User';
    if (user) {
      // Try various name sources
      displayName = 
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.first_name ||
        (user.email ? user.email.split('@')[0] : 'User');
    }
    
    const newEvent: LiveEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      host_user_id: user?.id || 'demo-user',
      host_name: displayName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('live_events')
          .insert(newEvent)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } catch (dbError) {
        console.log('Database not available, using demo mode');
        addDemoEvent(newEvent);
        return { data: newEvent, error: null };
      }
    } else {
      // Demo mode
      addDemoEvent(newEvent);
      return { data: newEvent, error: null };
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all public live events (for live events tab)
 */
export async function getPublicLiveEvents(): Promise<{ data: LiveEvent[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return public events from localStorage
      const demoEvents = getDemoEvents().filter(e => e.visibility === 'public');
      return { data: demoEvents, error: null };
    }    try {
      const { data: events, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('visibility', 'public')
        .in('status', ['upcoming', 'live']) // Only show upcoming and live events
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: events, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      const demoEvents = getDemoEvents()
        .filter(e => e.visibility === 'public' && ['upcoming', 'live'].includes(e.status));
      return { data: demoEvents, error: null };
    }
  } catch (error) {
    console.error('Error fetching public events:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get user's own events
 */
export async function getUserEvents(): Promise<{ data: LiveEvent[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return all events from localStorage
      return { data: getDemoEvents(), error: null };
    }

    try {
      const { data: events, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('host_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: events, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return { data: getDemoEvents(), error: null };
    }
  } catch (error) {
    console.error('Error fetching user events:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Update event status
 */
export async function updateEventStatus(eventId: string, status: 'upcoming' | 'live' | 'ended', additionalData?: Partial<LiveEvent>): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    const updates = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'live' && { start_time: new Date().toISOString() }),
      ...(status === 'ended' && { end_time: new Date().toISOString() }),
      ...additionalData
    };

    if (user) {
      try {
        const { error } = await supabase
          .from('live_events')
          .update(updates)
          .eq('id', eventId)
          .eq('host_user_id', user.id);

        if (error) throw error;
        return { error: null };
      } catch (dbError) {
        console.log('Database not available, updating demo mode');
        updateDemoEvent(eventId, updates);
        return { error: null };
      }
    } else {
      // Demo mode
      updateDemoEvent(eventId, updates);
      return { error: null };
    }
  } catch (error) {
    console.error('Error updating event status:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Join an event (add participant)
 */
export async function joinEvent(eventId: string): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { error: 'Please sign in to join events' };
    }

    try {
      // First get the current event to check participants
      const { data: event, error: fetchError } = await supabase
        .from('live_events')
        .select('participants, max_participants')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const currentParticipants = event.participants || [];
      if (currentParticipants.includes(user.id)) {
        return { error: 'You are already participating in this event' };
      }

      if (currentParticipants.length >= event.max_participants) {
        return { error: 'This event is full' };
      }

      const updatedParticipants = [...currentParticipants, user.id];

      const { error } = await supabase
        .from('live_events')
        .update({ 
          participants: updatedParticipants,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      return { error: null };
    } catch (dbError) {
      console.log('Database not available for joining events');
      return { error: 'Unable to join event at this time' };
    }
  } catch (error) {
    console.error('Error joining event:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { error: 'Please sign in to delete events' };
    }

    try {
      const { error } = await supabase
        .from('live_events')
        .delete()
        .eq('id', eventId)
        .eq('host_user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      removeDemoEvent(eventId);
      return { error: null };
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
