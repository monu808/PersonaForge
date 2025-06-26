import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Calendar, 
  Mic, 
  DollarSign, 
  Users, 
  Zap,
  Music,
  Shield
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { syncService } from '@/lib/api/sync-service';
import { getPersonas } from '@/lib/api/personas';

// Import persona interaction components
import PersonaDashboard from '@/components/coruscant/PersonaDashboard';
import EmergencyPersonas from '@/components/coruscant/EmergencyPersonas';
import PersonaSinger from '@/components/coruscant/PersonaSinger';
import EventHost from '@/components/coruscant/EventHost';
import PersonaScheduler from '@/components/coruscant/PersonaScheduler';
import PersonaMonetization from '@/components/coruscant/PersonaMonetization';

export default function Coruscant() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userReplicas, setUserReplicas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserReplicas();
  }, []);  const loadUserReplicas = async () => {
    try {
      setLoading(true);
      
      // Load actual personas from the database
      const { data, error } = await getPersonas();
      
      if (error) {
        throw error;
      }
      
      // Convert personas to the format expected by Coruscant components
      const replicas = (data || []).map((persona: any) => ({
        id: persona.id,
        name: persona.name,
        status: 'active', // All personas are considered active
        type: persona.replica_type || 'personal',
        created_at: persona.created_at,
        thumbnail_url: persona.attributes?.image_url,
        description: persona.description,
        attributes: persona.attributes
      }));
      
      setUserReplicas(replicas);

      // Sync action with Neurovia
      await syncService.syncCoruscantAction('replicas_loaded', {
        replica_count: replicas.length,
        replicas: replicas
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your personas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced action handler that syncs with Neurovia
  const handleCoruscantAction = async (action: string, data: any) => {
    try {
      // Sync action with Neurovia
      await syncService.syncCoruscantAction(action, data);
      
      toast({
        title: "Action Performed",
        description: `${action} completed successfully`,
      });
    } catch (error) {
      console.error('Error performing Coruscant action:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to Coruscant</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to access your Persona Interaction World
            </p>
            <Button onClick={() => window.location.href = '/auth/sign-in'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Coruscant
              </h1>
              <p className="text-muted-foreground">Your Persona Interaction World</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{userReplicas.length}</p>
                    <p className="text-xs text-muted-foreground">Active Personas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Live Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Scheduled Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">$0</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span>
            </TabsTrigger>
            <TabsTrigger value="singer" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Singer</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Host Events</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="monetize" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Monetize</span>
            </TabsTrigger>
          </TabsList>          <TabsContent value="dashboard">
            <PersonaDashboard 
              replicas={userReplicas} 
              loading={loading} 
              onReload={loadUserReplicas}              onPersonaDeleted={loadUserReplicas}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyPersonas />
          </TabsContent>

          <TabsContent value="singer">
            <PersonaSinger 
              replicas={userReplicas} 
            />
          </TabsContent>

          <TabsContent value="events">
            <EventHost 
              replicas={userReplicas} 
            />
          </TabsContent>

          <TabsContent value="schedule">
            <PersonaScheduler 
              replicas={userReplicas} 
            />
          </TabsContent>

          <TabsContent value="monetize">
            <PersonaMonetization 
              replicas={userReplicas} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
