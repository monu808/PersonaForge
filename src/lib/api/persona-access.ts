/**
 * Persona Access Management
 * Handles checking and managing user access to persona features
 */

export interface PersonaAccess {
  id: string;
  user_id: string;
  persona_id: string;
  service_id: string;
  service_type: 'consultation' | 'content_creation' | 'voice_message' | 'video_call' | 'custom';
  access_type: 'full' | 'limited' | 'expired';
  access_granted_at: string;
  max_usage?: number;
  usage_count?: number;
  expires_at?: string;
}

/**
 * Check if user has access to a specific persona for a service type
 */
export async function checkPersonaAccess(
  personaId: string, 
  serviceType: string,
  userWallet?: string
): Promise<{ hasAccess: boolean; access?: PersonaAccess }> {
  try {
    // For demo purposes, check localStorage
    const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
    
    const access = existingAccess.find((access: any) => 
      access.persona_id === personaId && 
      access.service_type === serviceType &&
      (userWallet ? access.user_id === userWallet : true)
    );

    if (!access) {
      return { hasAccess: false };
    }

    // Check if access has expired
    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      return { hasAccess: false, access: { ...access, access_type: 'expired' } };
    }

    // Check if usage limit has been reached
    if (access.max_usage && access.usage_count >= access.max_usage) {
      return { hasAccess: false, access: { ...access, access_type: 'limited' } };
    }

    return { hasAccess: true, access };
  } catch (error) {
    console.error('Error checking persona access:', error);
    return { hasAccess: false };
  }
}

/**
 * Record usage of a persona service
 */
export async function recordPersonaUsage(
  personaId: string,
  serviceType: string,
  userWallet?: string
): Promise<boolean> {
  try {
    const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
    
    const accessIndex = existingAccess.findIndex((access: any) => 
      access.persona_id === personaId && 
      access.service_type === serviceType &&
      (userWallet ? access.user_id === userWallet : true)
    );

    if (accessIndex >= 0) {
      existingAccess[accessIndex].usage_count = (existingAccess[accessIndex].usage_count || 0) + 1;
      localStorage.setItem('userPersonaAccess', JSON.stringify(existingAccess));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error recording persona usage:', error);
    return false;
  }
}

/**
 * Get all persona access for a user
 */
export async function getUserPersonaAccess(userWallet?: string): Promise<PersonaAccess[]> {
  try {
    const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
    
    if (userWallet) {
      return existingAccess.filter((access: any) => access.user_id === userWallet);
    }
    
    return existingAccess;
  } catch (error) {
    console.error('Error getting user persona access:', error);
    return [];
  }
}

/**
 * Grant access to persona features (used after service purchase)
 */
export async function grantPersonaAccess(
  personaId: string,
  serviceId: string,
  serviceType: string,
  userWallet: string,
  options: {
    maxUsage?: number;
    expiresInDays?: number;
  } = {}
): Promise<boolean> {
  try {
    const accessData: PersonaAccess = {
      id: crypto.randomUUID(),
      user_id: userWallet,
      persona_id: personaId,
      service_id: serviceId,
      service_type: serviceType as any,
      access_type: 'full',
      access_granted_at: new Date().toISOString(),
      max_usage: options.maxUsage,
      usage_count: 0,
      expires_at: options.expiresInDays ? 
        new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : 
        undefined
    };

    const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
    existingAccess.push(accessData);
    localStorage.setItem('userPersonaAccess', JSON.stringify(existingAccess));
    
    return true;
  } catch (error) {
    console.error('Error granting persona access:', error);
    return false;
  }
}
