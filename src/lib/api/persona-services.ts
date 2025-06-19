import { supabase } from '../auth';
import { PersonaService } from './algorand';

const DEMO_SERVICES_KEY = 'persona_forge_demo_services';

// Demo services for when database is not available
function getDemoServices(): PersonaService[] {
  try {
    const stored = localStorage.getItem(DEMO_SERVICES_KEY);
    const services = stored ? JSON.parse(stored) : [];
    console.log('📂 Retrieved from localStorage:', services.length, 'services');
    return services;
  } catch {
    console.log('❌ Failed to retrieve from localStorage');
    return [];
  }
}

function saveDemoServices(services: PersonaService[]): void {
  try {
    localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(services));
    console.log('💾 Saved to localStorage:', services.length, 'services');
  } catch (error) {
    console.error('❌ Failed to save demo services:', error);
  }
}

function addDemoService(service: PersonaService): void {
  const services = getDemoServices();
  services.unshift(service);
  saveDemoServices(services);
  console.log('➕ Added service to localStorage. Total services:', services.length);
}

function updateDemoService(id: string, updates: Partial<PersonaService>): void {
  const services = getDemoServices();
  const index = services.findIndex(s => s.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...updates };
    saveDemoServices(services);
  }
}

function removeDemoService(id: string): void {
  const services = getDemoServices();
  const filtered = services.filter(s => s.id !== id);
  saveDemoServices(filtered);
}

/**
 * Create a new persona service
 */
export async function createPersonaService(serviceData: Omit<PersonaService, 'id' | 'created_at'>): Promise<{ data: PersonaService | null; error: string | null }> {
  try {
    console.log('🔄 Creating persona service...', serviceData);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    console.log('👤 User authenticated:', !!user, user?.id);
    
    const newService: PersonaService = {
      ...serviceData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    console.log('📝 New service object:', newService);

    if (user) {
      try {
        console.log('💾 Attempting database insert...');
        const { data, error } = await supabase
          .from('persona_services')
          .insert(newService)
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }
        
        console.log('✅ Service saved to database:', data);
        return { data, error: null };
      } catch (dbError) {
        console.log('⚠️ Database not available, using demo mode:', dbError);
        addDemoService(newService);
        console.log('💿 Service saved to localStorage');
        return { data: newService, error: null };
      }
    } else {
      // Demo mode
      console.log('🔄 No user authenticated, using demo mode');
      addDemoService(newService);
      console.log('💿 Service saved to localStorage (demo mode)');
      return { data: newService, error: null };
    }
  } catch (error) {
    console.error('💥 Error creating service:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all services for a specific persona
 */
export async function getPersonaServices(personaId: string): Promise<{ data: PersonaService[] | null; error: string | null }> {
  try {
    console.log('🔍 Fetching services for persona:', personaId);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    console.log('👤 User authenticated for fetch:', !!user, user?.id);
    
    if (!user) {
      // Demo mode - return services from localStorage
      const demoServices = getDemoServices().filter(s => s.persona_id === personaId);
      console.log('💿 Fetching from localStorage (no user):', demoServices.length, 'services');
      return { data: demoServices, error: null };
    }

    try {
      console.log('💾 Attempting database fetch...');
      const { data: services, error } = await supabase
        .from('persona_services')
        .select('*')
        .eq('persona_id', personaId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database fetch error:', error);
        throw error;
      }
      
      console.log('✅ Services fetched from database:', services?.length || 0, 'services');
      return { data: services, error: null };
    } catch (dbError) {
      console.log('⚠️ Database not available for fetch, using demo mode:', dbError);
      const demoServices = getDemoServices().filter(s => s.persona_id === personaId);
      console.log('💿 Fetching from localStorage (fallback):', demoServices.length, 'services');
      return { data: demoServices, error: null };
    }
  } catch (error) {
    console.error('💥 Error fetching services:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all public services (marketplace view)
 */
export async function getAllPublicServices(): Promise<{ data: PersonaService[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return all services from localStorage
      return { data: getDemoServices(), error: null };
    }

    try {
      const { data: services, error } = await supabase
        .from('persona_services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: services, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return { data: getDemoServices(), error: null };
    }
  } catch (error) {
    console.error('Error fetching public services:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get a specific service by ID
 */
export async function getPersonaService(serviceId: string): Promise<{ data: PersonaService | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - find in localStorage
      const demoServices = getDemoServices();
      const service = demoServices.find(s => s.id === serviceId);
      return { data: service || null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('persona_services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      const demoServices = getDemoServices();
      const service = demoServices.find(s => s.id === serviceId);
      return { data: service || null, error: null };
    }
  } catch (error) {
    console.error('Error getting service:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Update a persona service
 */
export async function updatePersonaService(serviceId: string, updates: Partial<PersonaService>): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode
      updateDemoService(serviceId, updates);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('persona_services')
        .update(updates)
        .eq('id', serviceId);

      if (error) throw error;
      return { error: null };
    } catch (dbError) {
      console.log('Database not available, updating demo mode');
      updateDemoService(serviceId, updates);
      return { error: null };
    }
  } catch (error) {
    console.error('Error updating service:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Delete a persona service
 */
export async function deletePersonaService(serviceId: string): Promise<{ error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode
      removeDemoService(serviceId);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('persona_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      return { error: null };
    } catch (dbError) {
      console.log('Database not available, deleting from demo mode');
      removeDemoService(serviceId);
      return { error: null };
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all purchases for the current user
 */
export async function getUserPurchases(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return empty purchases for now
      return { data: [], error: null };
    }    try {      // Try the main query directly (buyer_id column should exist now)
      console.log('Attempting to fetch user purchases for user:', user.id);
      
      const { data, error } = await supabase
        .from('service_purchases')
        .select(`
          *,
          persona_services (
            service_name,
            personas (
              name
            )
          )
        `)        .eq('buyer_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Database query failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }
      
      console.log('Query successful, found purchases:', data?.length || 0);
      
      // Transform the data to flatten nested objects
      const purchases = data?.map(purchase => ({
        ...purchase,
        service_name: purchase.persona_services?.service_name,
        persona_name: purchase.persona_services?.personas?.name
      })) || [];
      
      return { data: purchases, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return { data: [], error: null };
    }
  } catch (error) {
    console.error('Error getting purchases:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all persona services across all personas (public marketplace)
 */
export async function getAllPersonaServices(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      // Demo mode - return demo services
      const demoServices = getDemoServices();
      return { data: demoServices, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('persona_services')
        .select(`
          *,
          personas (
            name,
            replica_type,
            attributes
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include persona info
      const servicesWithPersonaInfo = data?.map(service => ({
        ...service,
        persona_name: service.personas?.name,
        persona_type: service.personas?.replica_type,
        persona_image: service.personas?.attributes?.image_url
      })) || [];
      
      return { data: servicesWithPersonaInfo, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      const demoServices = getDemoServices();
      return { data: demoServices, error: null };
    }
  } catch (error) {
    console.error('Error getting all services:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get user's purchased services with access details
 */
export async function getUserPurchasedServices(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_persona_access')
        .select(`
          *,
          persona_services (
            *,
            personas (
              name,
              replica_type,
              attributes
            )
          ),
          service_deliveries (
            *
          )
        `)
        .eq('user_id', user.id)
        .order('access_granted_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      
      // Fallback to localStorage
      try {
        const existingAccess = JSON.parse(localStorage.getItem('userPersonaAccess') || '[]');
        const userAccess = existingAccess.filter((access: any) => access.user_id === user.id);
        
        // For each access, try to get the service details from localStorage
        const accessWithServices = userAccess.map((access: any) => {
          const allServices = JSON.parse(localStorage.getItem('personaServices') || '[]');
          const service = allServices.find((s: any) => s.id === access.service_id);
          
          return {
            ...access,
            persona_services: service || null
          };
        });
        
        return { data: accessWithServices, error: null };
      } catch (storageError) {
        console.error('Error reading from localStorage:', storageError);
        return { data: [], error: null };
      }
    }
  } catch (error) {
    console.error('Error getting purchased services:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get service deliveries for a user
 */
export async function getUserServiceDeliveries(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('service_deliveries')
        .select(`
          *,
          persona_services (
            service_name,
            service_type,
            personas (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return { data: [], error: null };
    }
  } catch (error) {
    console.error('Error getting service deliveries:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Download or access service content
 */
export async function accessServiceContent(deliveryId: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      // Get the delivery record
      const { data: delivery, error } = await supabase
        .from('service_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (!delivery) {
        return { data: null, error: 'Delivery not found' };
      }

      // Check if delivery is valid and not expired
      if (delivery.delivery_status !== 'delivered') {
        return { data: null, error: 'Content not available' };
      }

      if (delivery.expires_at && new Date(delivery.expires_at) < new Date()) {
        return { data: null, error: 'Content has expired' };
      }

      // Check download limits
      if (delivery.max_downloads && delivery.download_count >= delivery.max_downloads) {
        return { data: null, error: 'Download limit exceeded' };
      }

      // Increment download count
      await supabase
        .from('service_deliveries')
        .update({ download_count: (delivery.download_count || 0) + 1 })
        .eq('id', deliveryId);

      return { data: delivery, error: null };
    } catch (dbError) {
      console.log('Database not available, using demo mode');
      return { data: null, error: 'Service not available' };
    }
  } catch (error) {
    console.error('Error accessing service content:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Predefined service types with suggested pricing
export const SERVICE_TYPES = [
  {
    type: 'consultation' as const,
    label: 'AI Consultation',
    description: 'Get personalized advice and insights from your persona',
    icon: '💬',
    suggested_price_usd: 25,
    duration_minutes: 30
  },
  {
    type: 'content_creation' as const,
    label: 'Content Creation',
    description: 'Generate custom content in your persona\'s style',
    icon: '✍️',
    suggested_price_usd: 15,
  },
  {
    type: 'voice_message' as const,
    label: 'Voice Message',
    description: 'Receive a personalized voice message from your persona',
    icon: '🎙️',
    suggested_price_usd: 10,
    duration_minutes: 5
  },
  {
    type: 'video_call' as const,
    label: 'Live Video Call',
    description: 'Have a live video conversation with your persona',
    icon: '📹',
    suggested_price_usd: 50,
    duration_minutes: 60
  },
  {
    type: 'custom' as const,
    label: 'Custom Service',
    description: 'Create a unique service offering',
    icon: '⚡',
    suggested_price_usd: 20,
  }
];
