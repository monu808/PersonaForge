import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause,
  Settings,
  Repeat,
  MessageCircle,
  Video,
  Music,
  Share,
  Edit,
  Trash,
  Plus
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Replica {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface PersonaSchedulerProps {
  replicas: Replica[];
}

interface ScheduledAction {
  id: string;
  title: string;
  description: string;
  replica_id: string;
  action_type: 'post' | 'video' | 'song' | 'event' | 'message';
  scheduled_time: string;
  repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  content: string;
  metadata?: any;
}

const actionTypes = [
  { value: 'post', label: 'Social Media Post', icon: <Share className="h-4 w-4" /> },
  { value: 'video', label: 'Video Message', icon: <Video className="h-4 w-4" /> },
  { value: 'song', label: 'Song Release', icon: <Music className="h-4 w-4" /> },
  { value: 'event', label: 'Live Event', icon: <Calendar className="h-4 w-4" /> },
  { value: 'message', label: 'Direct Message', icon: <MessageCircle className="h-4 w-4" /> }
];

const repeatOptions = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export default function PersonaScheduler({ replicas }: PersonaSchedulerProps) {
  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAction, setEditingAction] = useState<ScheduledAction | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    replicaId: '',
    actionType: '',
    scheduledTime: '',
    repeatPattern: 'none',
    content: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      replicaId: '',
      actionType: '',
      scheduledTime: '',
      repeatPattern: 'none',
      content: ''
    });
    setEditingAction(null);
  };

  const createOrUpdateAction = () => {
    if (!formData.title || !formData.replicaId || !formData.actionType || !formData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const actionData: ScheduledAction = {
      id: editingAction?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      replica_id: formData.replicaId,
      action_type: formData.actionType as any,
      scheduled_time: formData.scheduledTime,
      repeat_pattern: formData.repeatPattern as any,
      status: 'pending',
      content: formData.content
    };

    if (editingAction) {
      setScheduledActions(prev => prev.map(action => 
        action.id === editingAction.id ? actionData : action
      ));
      toast({
        title: "Action Updated",
        description: `"${formData.title}" has been updated successfully.`,
      });
    } else {
      setScheduledActions(prev => [actionData, ...prev]);
      toast({
        title: "Action Scheduled",
        description: `"${formData.title}" has been scheduled successfully.`,
      });
    }

    setShowCreateForm(false);
    resetForm();
  };

  const editAction = (action: ScheduledAction) => {
    setEditingAction(action);
    setFormData({
      title: action.title,
      description: action.description,
      replicaId: action.replica_id,
      actionType: action.action_type,
      scheduledTime: action.scheduled_time,
      repeatPattern: action.repeat_pattern,
      content: action.content
    });
    setShowCreateForm(true);
  };

  const deleteAction = (actionId: string) => {
    setScheduledActions(prev => prev.filter(action => action.id !== actionId));
    toast({
      title: "Action Deleted",
      description: "Scheduled action has been deleted.",
    });
  };

  const pauseResumeAction = (actionId: string) => {
    setScheduledActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status: action.status === 'pending' ? 'cancelled' : 'pending' }
        : action
    ));
  };

  const executeNow = (action: ScheduledAction) => {
    setScheduledActions(prev => prev.map(a => 
      a.id === action.id ? { ...a, status: 'completed' } : a
    ));
    
    toast({
      title: "Action Executed",
      description: `"${action.title}" has been executed immediately.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Schedule Persona Actions
            </h2>
            <p className="text-muted-foreground">
              Automate your personas' activities and interactions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Action
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{scheduledActions.filter(a => a.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{scheduledActions.filter(a => a.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{scheduledActions.filter(a => a.repeat_pattern !== 'none').length}</p>
                <p className="text-xs text-muted-foreground">Recurring</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{scheduledActions.filter(a => a.status === 'cancelled').length}</p>
                <p className="text-xs text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAction ? 'Edit Action' : 'Schedule New Action'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up automated actions for your personas to perform
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Title</label>
                <Input
                  placeholder="Enter action title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Persona</label>
                <Select 
                  value={formData.replicaId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, replicaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {replicas.filter(r => r.status === 'active').map((replica) => (
                      <SelectItem key={replica.id} value={replica.id}>
                        {replica.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select 
                  value={formData.actionType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Time</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Repeat Pattern</label>
                <Select 
                  value={formData.repeatPattern} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, repeatPattern: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repeatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of the action"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Content for the action (text for posts, script for videos, etc.)"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createOrUpdateAction}>
                <Calendar className="h-4 w-4 mr-2" />
                {editingAction ? 'Update Action' : 'Schedule Action'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Actions List */}
      {scheduledActions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your automated persona activities
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledActions.map((action) => {
                const replica = replicas.find(r => r.id === action.replica_id);
                const actionType = actionTypes.find(t => t.value === action.action_type);
                const repeatOption = repeatOptions.find(r => r.value === action.repeat_pattern);
                
                return (
                  <div key={action.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                      {actionType?.icon || <Calendar className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {replica?.name} • {actionType?.label}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          action.status === 'pending' 
                            ? 'bg-blue-100 text-blue-800'
                            : action.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : action.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {action.status}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(action.scheduled_time).toLocaleString()}
                        </span>
                        {action.repeat_pattern !== 'none' && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {repeatOption?.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {action.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => executeNow(action)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => pauseResumeAction(action.id)}
                      >
                        {action.status === 'pending' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => editAction(action)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteAction(action.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Scheduled Actions</h3>
              <p className="text-muted-foreground">
                Create your first scheduled action to automate your persona's activities
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Action
            </Button>
          </div>
        </Card>
      )}

      {/* Automation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Automation Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Share className="h-4 w-4 text-blue-500" />
                Daily Social Posts
              </h4>
              <p className="text-sm text-gray-600">
                Schedule your persona to post daily updates, quotes, or thoughts on social media
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-4 w-4 text-green-500" />
                Weekly Video Messages
              </h4>
              <p className="text-sm text-gray-600">
                Automatically create and post weekly video updates using Tavus
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                Song Releases
              </h4>
              <p className="text-sm text-gray-600">
                Schedule new song releases using ElevenLabs voice synthesis
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                Live Events
              </h4>
              <p className="text-sm text-gray-600">
                Automatically start scheduled live events and podcasts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
