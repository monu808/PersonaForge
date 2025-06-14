import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Settings, 
  Video, 
  Mic, 
  MoreVertical,
  Plus,
  ExternalLink,
  Edit,
  Trash
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Replica {
  id: string;
  name: string;
  status: 'active' | 'training' | 'error';
  type: 'personal' | 'business';
  created_at?: string;
  thumbnail_url?: string;
}

interface PersonaDashboardProps {
  replicas: Replica[];
  loading: boolean;
  onReload: () => void;
}

export default function PersonaDashboard({ replicas, loading, onReload }: PersonaDashboardProps) {
  const launchPersona = (replica: Replica) => {
    toast({
      title: "Launching Persona",
      description: `${replica.name} is coming online...`,
    });
    // TODO: Implement persona launch logic
  };

  const editPersona = (replica: Replica) => {
    toast({
      title: "Edit Persona",
      description: `Opening editor for ${replica.name}`,
    });
    // TODO: Implement persona editing
  };

  const deletePersona = (replica: Replica) => {
    toast({
      title: "Delete Persona",
      description: `Are you sure you want to delete ${replica.name}?`,
      variant: "destructive"
    });
    // TODO: Implement persona deletion with confirmation
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
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Video className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Video</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Mic className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">Voice</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Play className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">Live</p>
                  </div>
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

                {/* Quick Actions */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Quick Launch:</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Chat
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Video Call
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Event
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions Section */}
      {replicas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Common actions you can take with your personas
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Video className="h-6 w-6 mb-2 text-blue-500" />
                <span className="text-sm">Create Video</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Mic className="h-6 w-6 mb-2 text-green-500" />
                <span className="text-sm">Record Audio</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Play className="h-6 w-6 mb-2 text-purple-500" />
                <span className="text-sm">Start Event</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <ExternalLink className="h-6 w-6 mb-2 text-orange-500" />
                <span className="text-sm">Share Link</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
