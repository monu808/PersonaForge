import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Settings, 
  Video, 
  Mic, 
  MoreVertical,
  Plus,
  Edit,
  Trash
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { deletePersona as deletePersonaAPI } from '@/lib/api/personas';
import { useNavigate } from 'react-router-dom';

interface Replica {
  id: string;
  name: string;
  status: 'active' | 'training' | 'error';
  type: string; // Changed from 'personal' | 'business' to string to match persona replica_type
  created_at?: string;
  thumbnail_url?: string;
  description?: string;
  attributes?: any;
}

interface PersonaDashboardProps {
  replicas: Replica[];
  loading: boolean;
  onReload: () => void;
  onPersonaDeleted?: () => void; // Add callback for when persona is deleted
  onTabChange?: (tab: string) => void; // Add callback for tab changes
}

export default function PersonaDashboard({ replicas, loading, onReload, onPersonaDeleted, onTabChange }: PersonaDashboardProps) {
  const navigate = useNavigate();
  
  const launchPersona = (replica: Replica) => {
    // Navigate to monetize section in Coruscant
    if (onTabChange) {
      onTabChange('monetize');
    }
    toast({
      title: "Launching Persona",
      description: `${replica.name} is being launched for monetization...`,
    });
  };

  const editPersona = (replica: Replica) => {
    toast({
      title: "Edit Persona",
      description: `Opening editor for ${replica.name}`,
    });
    // TODO: Implement persona editing
  };

  // New functions for quick action buttons
  const handleVideoAction = () => {
    navigate('/tavus-features');
  };

  const handleVoiceAction = () => {
    navigate('/elevenlabs');
  };

  const handleLiveAction = () => {
    navigate('/tavus-features');
  };  const deletePersona = async (replica: Replica) => {
    try {
      const { error } = await deletePersonaAPI(replica.id);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Persona Deleted",
        description: `${replica.name} has been permanently deleted.`,
      });

      // Reload the data to reflect changes
      onReload();
      
      // Call the callback if provided
      if (onPersonaDeleted) {
        onPersonaDeleted();
      }
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        title: "Error",
        description: "Failed to delete persona. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Personas</h2>
          <p className="text-muted-foreground">
            Manage and launch your AI replicas into the interaction world
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReload}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/create'}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Replicas Grid */}
      {replicas.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Personas Yet</h3>
              <p className="text-muted-foreground">
                Create your first AI replica to get started with Coruscant
              </p>
            </div>
            <Button onClick={() => window.location.href = '/create'}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Persona
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {replicas.map((replica) => (
            <Card key={replica.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {replica.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{replica.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          replica.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : replica.status === 'training'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {replica.status}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {replica.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Capabilities */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <button 
                    className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={handleVideoAction}
                  >
                    <Video className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Video</p>
                  </button>
                  <button 
                    className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={handleVoiceAction}
                  >
                    <Mic className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">Voice</p>
                  </button>
                  <button 
                    className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={handleLiveAction}
                  >
                    <Play className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">Live</p>
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => launchPersona(replica)}
                    disabled={replica.status !== 'active'}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Launch
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => editPersona(replica)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => deletePersona(replica)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
