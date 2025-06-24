/**
 * Database Cleanup Utilities
 * Helps fix corrupted data and timeout issues
 */

import { supabase } from '../auth';

export interface CleanupResult {
  success: boolean;
  message: string;
  affectedRows?: number;
}

/**
 * Delete podcasts with corrupted data that cause JSON parsing errors
 */
export async function cleanupCorruptedPodcasts(): Promise<CleanupResult> {
  try {
    console.log('Starting corrupted podcast cleanup...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, message: 'User not authenticated' };
    }

    // First, try to identify podcasts that can't be parsed
    // by attempting to fetch each one individually
    const { data: podcastIds, error: idsError } = await supabase
      .from('podcasts')
      .select('id')
      .eq('user_id', session.user.id);

    if (idsError) {
      console.error('Failed to get podcast IDs:', idsError);
      return { success: false, message: `Failed to get podcast IDs: ${idsError.message}` };
    }

    if (!podcastIds || podcastIds.length === 0) {
      return { success: true, message: 'No podcasts found to clean up' };
    }

    console.log(`Found ${podcastIds.length} podcasts to check`);

    let corruptedCount = 0;
    const corruptedIds: string[] = [];

    // Check each podcast individually
    for (const podcast of podcastIds) {
      try {
        const { error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('id', podcast.id)
          .single();

        if (error) {
          console.log(`Podcast ${podcast.id} appears corrupted:`, error.message);
          if (error.message.includes('JSON') || error.message.includes('Unterminated string')) {
            corruptedIds.push(podcast.id);
            corruptedCount++;
          }
        }
      } catch (e) {
        console.log(`Podcast ${podcast.id} failed to load:`, e);
        corruptedIds.push(podcast.id);
        corruptedCount++;
      }
    }

    if (corruptedCount === 0) {
      return { success: true, message: 'No corrupted podcasts found' };
    }

    console.log(`Found ${corruptedCount} corrupted podcasts, attempting to delete...`);

    // Delete corrupted podcasts
    const { error: deleteError } = await supabase
      .from('podcasts')
      .delete()
      .in('id', corruptedIds);

    if (deleteError) {
      console.error('Failed to delete corrupted podcasts:', deleteError);
      return { success: false, message: `Failed to delete corrupted podcasts: ${deleteError.message}` };
    }

    return {
      success: true,
      message: `Successfully cleaned up ${corruptedCount} corrupted podcasts`,
      affectedRows: corruptedCount
    };

  } catch (error) {
    console.error('Cleanup failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown cleanup error'
    };
  }
}

/**
 * Reset all podcasts to have minimal valid data
 */
export async function resetAllPodcasts(): Promise<CleanupResult> {
  try {
    console.log('Starting podcast reset...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Delete all user's podcasts (this is a drastic reset)
    const { error: deleteError, count } = await supabase
      .from('podcasts')
      .delete()
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Failed to reset podcasts:', deleteError);
      return { success: false, message: `Failed to reset podcasts: ${deleteError.message}` };
    }

    return {
      success: true,
      message: `Successfully reset all podcasts (deleted ${count || 0} rows)`,
      affectedRows: count || 0
    };

  } catch (error) {
    console.error('Reset failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown reset error'
    };
  }
}

/**
 * Get database health information
 */
export async function getDatabaseHealth(): Promise<{
  totalPodcasts: number;
  accessiblePodcasts: number;
  corruptedPodcasts: number;
  lastError?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { totalPodcasts: 0, accessiblePodcasts: 0, corruptedPodcasts: 0, lastError: 'Not authenticated' };
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('podcasts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (countError) {
      return { totalPodcasts: 0, accessiblePodcasts: 0, corruptedPodcasts: 0, lastError: countError.message };
    }

    const totalPodcasts = totalCount || 0;

    // Try to access all podcasts
    const { data, error: accessError } = await supabase
      .from('podcasts')
      .select('id')
      .eq('user_id', session.user.id);

    if (accessError) {
      return { 
        totalPodcasts, 
        accessiblePodcasts: 0, 
        corruptedPodcasts: totalPodcasts, 
        lastError: accessError.message 
      };
    }

    const accessiblePodcasts = data?.length || 0;
    const corruptedPodcasts = Math.max(0, totalPodcasts - accessiblePodcasts);

    return {
      totalPodcasts,
      accessiblePodcasts,
      corruptedPodcasts,
      lastError: corruptedPodcasts > 0 ? 'Some podcasts may be corrupted' : undefined
    };

  } catch (error) {
    return { 
      totalPodcasts: 0, 
      accessiblePodcasts: 0, 
      corruptedPodcasts: 0, 
      lastError: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
