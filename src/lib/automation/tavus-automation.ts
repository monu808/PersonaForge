/**
 * Background automation service for TAVUS integration workflow
 * Handles: Persona Creation → Replica Creation → Status Monitoring → TAVUS Persona Creation
 */

import { supabase } from '@/lib/auth';
import { checkTavusReplicaStatus, createTavusPersona, updateTavusPersonaWithReplica } from '@/lib/api/tavus';

interface AutomationConfig {
  personaId: string;
  replicaId: string; // Pass existing replica ID instead of creating new one
  replicaName: string;
}

interface AutomationStatus {
  personaId: string;
  status: 'pending' | 'replica_creating' | 'replica_training' | 'replica_ready' | 'tavus_persona_creating' | 'completed' | 'failed';
  replicaId?: string;
  tavusPersonaId?: string;
  error?: string;
  lastChecked: string;
  attempts: number;
}

class TavusAutomationService {
  private static instance: TavusAutomationService;
  private automationQueue: Map<string, AutomationStatus> = new Map();
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): TavusAutomationService {
    if (!TavusAutomationService.instance) {
      TavusAutomationService.instance = new TavusAutomationService();
    }
    return TavusAutomationService.instance;
  }

  /**
   * Start the automation workflow for a persona with existing replica
   */
  async startAutomation(config: AutomationConfig): Promise<void> {
    console.log(`🤖 [AUTOMATION] Starting workflow for persona: ${config.personaId} with replica: ${config.replicaId}`);
    
    const status: AutomationStatus = {
      personaId: config.personaId,
      status: 'replica_training', // Start with training status since replica already exists
      replicaId: config.replicaId,
      lastChecked: new Date().toISOString(),
      attempts: 0
    };

    this.automationQueue.set(config.personaId, status);
    
    // Update persona with replica ID immediately
    await this.updatePersonaWithReplicaId(config.personaId, config.replicaId);
    
    // Start the monitoring loop if not already running
    this.startMonitoring();
  }

  /**
   * Step 1: Monitor replica training status
   */
  private async checkReplicaStatus(personaId: string): Promise<void> {
    const status = this.automationQueue.get(personaId);
    if (!status || !status.replicaId) return;

    try {
      console.log(`🔍 [AUTOMATION] Checking replica status: ${status.replicaId}`);
      
      const replicaStatus = await checkTavusReplicaStatus(status.replicaId);
      
      if (replicaStatus.error) {
        console.warn(`⚠️ [AUTOMATION] Error checking replica status:`, replicaStatus.error);
        return;
      }

      status.lastChecked = new Date().toISOString();
      status.attempts += 1;

      console.log(`📊 [AUTOMATION] Replica ${status.replicaId} status: ${replicaStatus.status}`);

      if (replicaStatus.status === 'ready' || replicaStatus.status === 'completed') {
        console.log(`🎉 [AUTOMATION] Replica training completed! Starting TAVUS persona creation...`);
        status.status = 'replica_ready';
        await this.createTavusPersona(personaId);
      } else if (replicaStatus.status === 'failed' || replicaStatus.status === 'error') {
        console.error(`❌ [AUTOMATION] Replica training failed for ${status.replicaId}`);
        status.status = 'failed';
        status.error = replicaStatus.error || 'Replica training failed';
      }
      // If still training, continue monitoring

    } catch (error) {
      console.error(`❌ [AUTOMATION] Error checking replica status:`, error);
      // Don't fail the entire process for status check errors
    }
  }

  /**
   * Step 3: Create TAVUS Persona
   */
  private async createTavusPersona(personaId: string): Promise<void> {
    const status = this.automationQueue.get(personaId);
    if (!status || !status.replicaId) return;

    try {
      console.log(`🎭 [AUTOMATION] Creating TAVUS persona for: ${personaId}`);
      
      status.status = 'tavus_persona_creating';

      // Get persona data from database
      const { data: personaData, error: fetchError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (fetchError || !personaData) {
        throw new Error(`Failed to fetch persona data: ${fetchError?.message}`);
      }

      // Create TAVUS persona
      const tavusPersonaResponse = await createTavusPersona({
        persona_name: personaData.name,
        personality_layers: {
          llm: {
            model: 'gpt-4',
            system_prompt: personaData.attributes?.system_prompt || `You are ${personaData.name}. ${personaData.description}`,
            context: personaData.attributes?.context || `Persona type: ${personaData.replica_type}. ${personaData.description}`,
          },
          tts: {
            voice_settings: {
              speed: 'normal',
              emotion: ['neutral']
            }
          }
        }
      });

      if (!tavusPersonaResponse.persona_id) {
        throw new Error(tavusPersonaResponse.error || 'Failed to create TAVUS persona');
      }

      status.tavusPersonaId = tavusPersonaResponse.persona_id;
      
      console.log(`✅ [AUTOMATION] TAVUS persona created: ${tavusPersonaResponse.persona_id}`);

      // Try to associate replica with persona
      const updateResult = await updateTavusPersonaWithReplica(
        tavusPersonaResponse.persona_id, 
        status.replicaId
      );

      // Update persona in database with TAVUS data
      await this.updatePersonaWithTavusData(personaId, status.replicaId, tavusPersonaResponse.persona_id, updateResult);

      status.status = 'completed';
      console.log(`🎉 [AUTOMATION] Complete! Persona ${personaId} fully integrated with TAVUS`);

      // Remove from queue after successful completion
      this.automationQueue.delete(personaId);

    } catch (error) {
      console.error(`❌ [AUTOMATION] Failed to create TAVUS persona for ${personaId}:`, error);
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Update persona with replica ID
   */
  private async updatePersonaWithReplicaId(personaId: string, replicaId: string): Promise<void> {
    try {
      const { data: currentPersona } = await supabase
        .from('personas')
        .select('attributes')
        .eq('id', personaId)
        .single();

      const { error } = await supabase
        .from('personas')
        .update({
          attributes: {
            ...currentPersona?.attributes,
            default_replica_id: replicaId,
            automation_status: 'replica_created',
            automation_last_update: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId);

      if (error) {
        console.error(`❌ [AUTOMATION] Failed to update persona with replica ID:`, error);
      } else {
        console.log(`✅ [AUTOMATION] Updated persona ${personaId} with replica ID: ${replicaId}`);
      }
    } catch (error) {
      console.error(`❌ [AUTOMATION] Error updating persona:`, error);
    }
  }

  /**
   * Update persona with TAVUS data
   */
  private async updatePersonaWithTavusData(
    personaId: string, 
    replicaId: string, 
    tavusPersonaId: string, 
    updateResult: any
  ): Promise<void> {
    try {
      const { data: currentPersona } = await supabase
        .from('personas')
        .select('attributes')
        .eq('id', personaId)
        .single();

      const { error } = await supabase
        .from('personas')
        .update({
          attributes: {
            ...currentPersona?.attributes,
            default_replica_id: replicaId,
            tavus_persona_id: tavusPersonaId,
            tavus_integration_completed: true,
            tavus_integration_date: new Date().toISOString(),
            tavus_replica_association: updateResult.success ? 'success' : 'failed',
            tavus_replica_association_error: updateResult.error || null,
            automation_status: 'completed',
            automation_last_update: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId);

      if (error) {
        console.error(`❌ [AUTOMATION] Failed to update persona with TAVUS data:`, error);
      } else {
        console.log(`✅ [AUTOMATION] Updated persona ${personaId} with full TAVUS integration`);
      }
    } catch (error) {
      console.error(`❌ [AUTOMATION] Error updating persona with TAVUS data:`, error);
    }
  }

  /**
   * Start the monitoring loop
   */
  private startMonitoring(): void {
    if (this.intervalId) return; // Already running

    console.log(`🚀 [AUTOMATION] Starting background monitoring...`);
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        const trainingReplicas = Array.from(this.automationQueue.entries())
          .filter(([_, status]) => status.status === 'replica_training');

        if (trainingReplicas.length === 0) {
          // No replicas to monitor, stop the interval
          this.stopMonitoring();
          return;
        }

        console.log(`🔄 [AUTOMATION] Monitoring ${trainingReplicas.length} training replicas...`);

        for (const [personaId, status] of trainingReplicas) {
          // Skip if too many failed attempts
          if (status.attempts > 100) { // ~8 hours with 5-minute intervals
            console.warn(`⚠️ [AUTOMATION] Max attempts reached for persona ${personaId}, marking as failed`);
            status.status = 'failed';
            status.error = 'Max monitoring attempts reached';
            continue;
          }

          await this.checkReplicaStatus(personaId);
          
          // Small delay between checks to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [AUTOMATION] Error in monitoring loop:`, error);
      } finally {
        this.isProcessing = false;
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Stop the monitoring loop
   */
  private stopMonitoring(): void {
    if (this.intervalId) {
      console.log(`🛑 [AUTOMATION] Stopping background monitoring...`);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get current automation status for a persona
   */
  getAutomationStatus(personaId: string): AutomationStatus | null {
    return this.automationQueue.get(personaId) || null;
  }

  /**
   * Get all current automations
   */
  getAllAutomations(): AutomationStatus[] {
    return Array.from(this.automationQueue.values());
  }

  /**
   * Cancel automation for a persona
   */
  cancelAutomation(personaId: string): void {
    console.log(`🚫 [AUTOMATION] Cancelling automation for persona: ${personaId}`);
    this.automationQueue.delete(personaId);
    
    if (this.automationQueue.size === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Clean up completed or failed automations older than 1 hour
   */
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [personaId, status] of this.automationQueue.entries()) {
      if ((status.status === 'completed' || status.status === 'failed') && 
          new Date(status.lastChecked) < oneHourAgo) {
        console.log(`🧹 [AUTOMATION] Cleaning up old automation for persona: ${personaId}`);
        this.automationQueue.delete(personaId);
      }
    }
  }
}

// Export singleton instance
export const tavusAutomation = TavusAutomationService.getInstance();

// Helper function to start automation from components
export async function startTavusAutomation(config: AutomationConfig): Promise<void> {
  return tavusAutomation.startAutomation(config);
}

// Helper function to get status
export function getTavusAutomationStatus(personaId: string): AutomationStatus | null {
  return tavusAutomation.getAutomationStatus(personaId);
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    tavusAutomation.cleanup();
  });
}
