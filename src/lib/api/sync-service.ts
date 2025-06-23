// Centralized sync service for keeping data consistent across all components
import { supabase } from '../auth';
import { getPersonas } from './personas';

// Event emitter for real-time sync
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

export const syncEvents = new EventEmitter();

// Sync service class
export class SyncService {
  private static instance: SyncService;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Start sync service
  startSync() {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncAllData();
    }, 30000);

    // Initial sync
    this.syncAllData();
  }

  // Stop sync service
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  // Sync all data
  async syncAllData() {
    try {
      // Check if user is authenticated before syncing
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // User not authenticated, skip sync
        return;
      }

      await Promise.all([
        this.syncPersonas(),
        this.syncVoices(),
        this.syncVideos(),
        this.syncActivities()
      ]);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  // Sync personas between create page and neurovia
  async syncPersonas() {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data: personas, error } = await getPersonas();
      if (error) throw error;

      // Emit sync event for all listening components
      syncEvents.emit('personas:updated', personas);
      
      return personas;
    } catch (error) {
      console.error('Error syncing personas:', error);
      return [];
    }
  }

  // Sync voice clones and audio content
  async syncVoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all voice content from persona_content table
      const { data: voiceContent, error } = await supabase
        .from('persona_content')
        .select(`
          *,
          personas (
            id,
            name,
            description,
            attributes
          )
        `)
        .eq('content_type', 'audio')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Emit sync event
      syncEvents.emit('voices:updated', voiceContent);
      
      return voiceContent;
    } catch (error) {
      console.error('Error syncing voices:', error);
      return [];
    }
  }

  // Sync video content and replicas
  async syncVideos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all video content
      const { data: videoContent, error } = await supabase
        .from('persona_content')
        .select(`
          *,
          personas (
            id,
            name,
            description,
            attributes
          )
        `)
        .eq('content_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Emit sync event
      syncEvents.emit('videos:updated', videoContent);
      
      return videoContent;
    } catch (error) {
      console.error('Error syncing videos:', error);
      return [];
    }
  }

  // Sync user activities for Coruscant
  async syncActivities() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user activities (persona creation, voice generation, etc.)
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code !== 'PGRST116') { // Ignore if table doesn't exist
        throw error;
      }

      // Emit sync event
      syncEvents.emit('activities:updated', activities || []);
      
      return activities || [];
    } catch (error) {
      console.error('Error syncing activities:', error);
      return [];
    }
  }

  // Log user activity
  async logActivity(type: string, description: string, metadata?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: type,
          description,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        });

      // Don't throw error if table doesn't exist yet
      if (error && error.code !== 'PGRST116') {
        console.error('Error logging activity:', error);
      }

      // Emit activity event
      syncEvents.emit('activity:logged', { type, description, metadata });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Sync persona with Neurovia when created/updated
  async syncPersonaToNeurovia(persona: any) {
    try {
      // Update persona data for Neurovia display
      syncEvents.emit('neurovia:persona:updated', persona);
      
      // Log activity
      await this.logActivity(
        'persona_created', 
        `Created persona: ${persona.name}`,
        { persona_id: persona.id, persona_name: persona.name }
      );
    } catch (error) {
      console.error('Error syncing persona to Neurovia:', error);
    }
  }

  // Sync Coruscant actions with Neurovia
  async syncCoruscantAction(action: string, data: any) {
    try {
      // Emit action to Neurovia
      syncEvents.emit('neurovia:coruscant:action', { action, data });
      
      // Log activity
      await this.logActivity(
        `coruscant_${action}`, 
        `Performed action: ${action}`,
        data
      );
    } catch (error) {
      console.error('Error syncing Coruscant action:', error);
    }
  }

  // Update persona stats in real-time
  async updatePersonaStats(personaId: string, stats: any) {
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          metadata: stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId);

      if (error) throw error;

      // Emit stats update
      syncEvents.emit('persona:stats:updated', { personaId, stats });
    } catch (error) {
      console.error('Error updating persona stats:', error);
    }
  }
}

export const syncService = SyncService.getInstance();
