import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  CreditCard, 
  Star,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  Video,
  MessageCircle,
  Shield,
  Plus,
  Settings,
  Eye,
  Download,
  BarChart3,
  Upload,
  Link,
  File,
  X,
  CheckCircle,
  FileText,
  Image,
  Mic
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  createPersonaService, 
  getPersonaServices, 
  updatePersonaService,
  deletePersonaService 
} from '@/lib/api/persona-services';
import { 
  connectWallet, 
  getConnectedWallet, 
  isWalletConnected,
  initializeWalletFromDatabase
} from '@/lib/api/algorand';
import type { PersonaService } from '@/lib/api/algorand';
import EnhancedAnalyticsDashboard from '@/components/analytics/EnhancedAnalyticsDashboard';
import UsageGate from '@/components/subscription/usage-gate';

interface Replica {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface PersonaMonetizationProps {  replicas: Replica[];
}

interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  active_subscribers: number;
  nft_sales: number;
  event_attendees: number;
}

const productTypes = [
  { value: 'consultation', label: 'AI Consultation', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'content_creation', label: 'Content Creation', icon: <Video className="h-4 w-4" /> },
  { value: 'voice_message', label: 'Voice Message', icon: <Mic className="h-4 w-4" /> },
  { value: 'video_call', label: 'Video Call', icon: <Calendar className="h-4 w-4" /> },
  { value: 'custom', label: 'Custom Service', icon: <Settings className="h-4 w-4" /> }
];

export default function PersonaMonetization({ replicas }: PersonaMonetizationProps) {
  const [services, setServices] = useState<PersonaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Mock revenue stats
  const [revenueStats] = useState<RevenueStats>({
    total_revenue: 0,
    monthly_revenue: 0,
    active_subscribers: 0,
    nft_sales: 0,
    event_attendees: 0
  });
  // Form state
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    service_type: '',
    price_algo: 1,
    price_usd: 0.25,
    duration_minutes: 30,
    persona_id: '',
    delivery_content: '',
    delivery_url: '',
    file_type: '',
    auto_delivery: false,
    uploaded_file: null as File | null
  });
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState<number | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
    initializeWallet();
  }, [replicas]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const allServices: PersonaService[] = [];
      
      // Load services for all user's personas
      for (const replica of replicas) {
        const { data } = await getPersonaServices(replica.id);
        if (data) {
          allServices.push(...data);
        }
      }
      
      setServices(allServices);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };  const initializeWallet = async () => {
    try {
      // Get wallet from database
      const dbWalletAddress = await initializeWalletFromDatabase();
      
      if (dbWalletAddress) {
        console.log('Wallet loaded from database:', dbWalletAddress);
        setWalletAddress(dbWalletAddress);
      } else {
        console.log('No wallet found in database');
        setWalletAddress(null);
      }
    } catch (error) {
      console.error('Error initializing wallet from database:', error);
      setWalletAddress(null);
    }
  };

  const createProduct = async () => {
    if (!formData.service_name || !formData.service_type || !formData.persona_id || formData.price_algo <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Algorand wallet to create services.",
        variant: "destructive"
      });
      return;
    }

    try {      const serviceData = {
        persona_id: formData.persona_id,
        service_name: formData.service_name,
        description: formData.description,
        price_algo: formData.price_algo,
        price_usd: formData.price_usd,
        service_type: formData.service_type as 'consultation' | 'content_creation' | 'voice_message' | 'video_call' | 'custom',
        duration_minutes: formData.duration_minutes,
        creator_wallet: walletAddress,
        is_active: true,
        delivery_content: formData.delivery_content || undefined,
        delivery_url: formData.delivery_url || undefined,
        file_type: formData.file_type || undefined,
        auto_delivery: formData.auto_delivery || undefined
      };

      const { data, error } = await createPersonaService(serviceData);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }      if (data) {
        setServices(prev => [data, ...prev]);
        setShowCreateForm(false);
          // Reset form
        setFormData({
          service_name: '',
          description: '',
          service_type: '',
          price_algo: 1,
          price_usd: 0.25,
          duration_minutes: 30,
          persona_id: '',
          delivery_content: '',
          delivery_url: '',
          file_type: '',
          auto_delivery: false,
          uploaded_file: null
        });
        setFileUploadProgress(null);
        setFileUploadError(null);
          toast({
          title: "Service Created",
          description: `"${formData.service_name}" is now available for purchase in the Services marketplace.`,
        });
        
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('personaServiceCreated', {
          detail: { service: data, persona_id: formData.persona_id }
        }));
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive"
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const { error } = await updatePersonaService(serviceId, {
        is_active: !service.is_active
      });

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, is_active: !service.is_active }
          : service
      ));
        toast({
        title: "Status Updated",
        description: `Service ${service.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('personaServiceUpdated', {
        detail: { serviceId, is_active: !service.is_active }
      }));
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive"
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await deletePersonaService(serviceId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      setServices(prev => prev.filter(s => s.id !== serviceId));
        toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully",
      });
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('personaServiceDeleted', {
        detail: { serviceId }
      }));
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
    }
  };
  const viewAnalytics = (service: PersonaService) => {
    toast({
      title: "Analytics",
      description: `Viewing analytics for "${service.service_name}"`,
    });
  };
  // File upload handling functions
  const handleFileUpload = (file: File) => {
    // Basic file validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = {
      video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      voice_message: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
    };    if (file.size > maxSize) {
      setFileUploadError('File size must be less than 50MB');
      return;
    }

    // Validate file types based on service type and content type
    if (formData.service_type === 'content_creation') {
      if (formData.file_type === 'video' && !allowedTypes.video.includes(file.type)) {
        setFileUploadError('Please upload a valid video file (MP4, MOV, AVI)');
        return;
      }
      if (formData.file_type === 'image' && !allowedTypes.image.includes(file.type)) {
        setFileUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
    }

    if (formData.service_type === 'voice_message' && !allowedTypes.voice_message.includes(file.type)) {
      setFileUploadError('Please upload a valid audio file (MP3, WAV, M4A, OGG)');
      return;
    }

    setFileUploadError(null);
    setFormData(prev => ({ 
      ...prev, 
      uploaded_file: file,
      // Keep the existing file_type for content_creation or set it to file.type for voice_message
      file_type: formData.service_type === 'content_creation' ? prev.file_type : file.type,
      delivery_url: '' // Clear URL if file is uploaded
    }));

    // Simulate upload progress (in real app, this would be actual upload)
    setFileUploadProgress(0);
    const interval = setInterval(() => {
      setFileUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, uploaded_file: null, file_type: '' }));
    setFileUploadProgress(null);
    setFileUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return (
    <UsageGate action="monetizationEnabled">
      <div className="space-y-6">{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Monetize Your Personas
            </h2>
            <p className="text-muted-foreground">
              Generate revenue through subscriptions, NFTs, and premium services
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {walletAddress && (
            <Button variant="outline" onClick={() => setShowAnalytics(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${revenueStats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${revenueStats.monthly_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.active_subscribers}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.nft_sales}</p>
                <p className="text-xs text-muted-foreground">NFT Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
          <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{revenueStats.event_attendees}</p>
                <p className="text-xs text-muted-foreground">Event Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Service Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Persona Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up a new service offering for your persona
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Name</label>
                <Input
                  placeholder="Enter service name"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Persona</label>
                <Select 
                  value={formData.persona_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, persona_id: value }))}
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
                <label className="text-sm font-medium">Service Type</label>
                <Select 
                  value={formData.service_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div className="space-y-2">
                <label className="text-sm font-medium">Price in ALGO</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.price_algo}
                  onChange={(e) => {
                    const algoAmount = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      price_algo: algoAmount,
                      price_usd: algoAmount * 0.25 // Rough conversion
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  ≈ ${formData.price_usd.toFixed(2)} USD
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe what customers will receive..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>            {/* Content Delivery Fields */}
            {(formData.service_type === 'content_creation' || formData.service_type === 'voice_message') && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h4 className="font-medium mb-3">Content Delivery</h4>
                  
                  {/* Content Type Selection for Content Creation */}
                  {formData.service_type === 'content_creation' && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-medium">Content Type</label>
                      <Select
                        value={formData.file_type || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video Content
                            </div>
                          </SelectItem>
                          <SelectItem value="image">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              Image Content
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Show file upload only if content type is selected (for content_creation) or if voice_message */}
                  {((formData.service_type === 'content_creation' && formData.file_type) || formData.service_type === 'voice_message') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Upload className="inline w-4 h-4 mr-1" />
                          Upload {
                            formData.service_type === 'voice_message' ? 'Audio' : 
                            formData.file_type === 'video' ? 'Video' :
                            formData.file_type === 'image' ? 'Image' : 'Content'
                          } File
                        </label>
                        
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept={
                              formData.service_type === 'voice_message' ? 'audio/*' :
                              formData.file_type === 'video' ? 'video/*' :
                              formData.file_type === 'image' ? 'image/*' : 
                              'video/*,image/*'
                            }
                          />
                          <div className="w-full border-2 border-dashed border-gray-300 rounded-lg px-6 py-8 text-center hover:border-blue-400 transition-colors bg-white">
                            {formData.uploaded_file ? (
                              <div className="space-y-2">
                                <File className="h-12 w-12 text-green-500 mx-auto" />
                                <div className="font-medium">{formData.uploaded_file.name}</div>
                                <div className="text-gray-500 text-sm">{formatFileSize(formData.uploaded_file.size)}</div>
                                {fileUploadProgress !== null && fileUploadProgress < 100 && (
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${fileUploadProgress}%` }}
                                    />
                                  </div>
                                )}
                                {fileUploadProgress === 100 && (
                                  <div className="flex items-center justify-center text-green-500 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Upload complete
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  onClick={removeFile}
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                                <div className="text-gray-600">
                                  Click to upload {
                                    formData.service_type === 'voice_message' ? 'audio' : 
                                    formData.file_type === 'video' ? 'video' :
                                    formData.file_type === 'image' ? 'image' : 'content'
                                  } file
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Max file size: 50MB
                                  {formData.file_type === 'video' && ' • MP4, MOV, AVI supported'}
                                  {formData.file_type === 'image' && ' • JPEG, PNG, GIF, WebP supported'}
                                  {formData.service_type === 'voice_message' && ' • MP3, WAV, M4A, OGG supported'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {fileUploadError && (
                          <div className="mt-2 text-red-500 text-sm flex items-center">
                            <X className="h-4 w-4 mr-1" />
                            {fileUploadError}
                          </div>
                        )}
                      </div>

                      {/* OR divider */}
                      <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-3 text-gray-400 text-sm">OR</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                      </div>

                      {/* URL Option */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          <Link className="inline w-4 h-4 mr-1" />
                          Content URL
                        </label>
                        <Input
                          type="url"
                          value={formData.delivery_url || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            delivery_url: e.target.value,
                            uploaded_file: e.target.value ? null : prev.uploaded_file
                          }))}
                          placeholder={`https://your-content-hosting.com/file.${
                            formData.service_type === 'voice_message' ? 'mp3' :
                            formData.file_type === 'video' ? 'mp4' :
                            formData.file_type === 'image' ? 'jpg' : 
                            'mp4'
                          }`}
                          disabled={!!formData.uploaded_file}
                        />
                        <p className="text-gray-500 text-xs">
                          Link to your {
                            formData.service_type === 'voice_message' ? 'audio' : 
                            formData.file_type === 'video' ? 'video' :
                            formData.file_type === 'image' ? 'image' : 'content'
                          } hosted on external platforms (YouTube, Vimeo, Google Drive, etc.)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.service_type === 'text' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Text Content
                </label>
                <Textarea
                  value={formData.delivery_content || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_content: e.target.value }))}
                  rows={5}
                  placeholder="Enter the text content that will be delivered to purchasers..."
                />
              </div>
            )}

            {formData.service_type !== 'consultation' && formData.service_type && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-delivery"
                  checked={formData.auto_delivery || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, auto_delivery: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="auto-delivery" className="text-sm">
                  Enable automatic delivery after purchase
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={createProduct}>
                <DollarSign className="h-4 w-4 mr-2" />
                Create Product
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}      {/* Services List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          </CardContent>
        </Card>
      ) : services.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your persona services and monetization offerings
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => {
                const replica = replicas.find(r => r.id === service.persona_id);
                const serviceType = productTypes.find(t => t.value === service.service_type);
                
                return (
                  <div key={service.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
                      {serviceType?.icon || <DollarSign className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{service.service_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {replica?.name} • {serviceType?.label}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm font-semibold">
                          {service.price_algo} ALGO
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ≈ ${service.price_usd.toFixed(2)} USD
                        </span>
                        {service.duration_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {service.duration_minutes} min
                          </span>
                        )}
                      </div>                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewAnalytics(service)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleServiceStatus(service.id)}
                      >
                        {service.is_active ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteService(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Download className="h-4 w-4" />                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Products Yet</h3>
              <p className="text-muted-foreground">
                Create your first monetization product to start generating revenue
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Product
            </Button>
          </div>
        </Card>
      )}

      {/* Integration Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RevenueCat Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              RevenueCat Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Set up recurring subscriptions for premium persona access
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Basic Plan</span>
                <span className="font-semibold">$9.99/month</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Premium Plan</span>
                <span className="font-semibold">$19.99/month</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">VIP Plan</span>
                <span className="font-semibold">$49.99/month</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure RevenueCat
            </Button>
          </CardContent>
        </Card>

        {/* Algorand NFTs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Algorand NFT Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create and sell unique NFT collectibles of your personas
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Profile Picture NFTs</span>
                <span className="font-semibold">◎ 50 ALGO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Exclusive Videos</span>
                <span className="font-semibold">◎ 100 ALGO</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Limited Edition</span>
                <span className="font-semibold">◎ 500 ALGO</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Trophy className="h-4 w-4 mr-2" />
              Create NFT Collection
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monetization Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monetization Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                Exclusive Content
              </h4>
              <p className="text-sm text-gray-600">
                Premium videos, songs, and content only for subscribers
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                Personal Services
              </h4>
              <p className="text-sm text-gray-600">
                1-on-1 consultations, personalized messages, custom content
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Premium Events
              </h4>              <p className="text-sm text-gray-600">
                VIP access to live events, exclusive Q&As, private sessions
              </p>
            </div>
          </div>
        </CardContent>      </Card>

      {/* Enhanced Analytics Dashboard */}
      {showAnalytics && (
        <EnhancedAnalyticsDashboard 
          walletAddress={walletAddress}
          onClose={() => setShowAnalytics(false)}
        />      )}
    </div>
    </UsageGate>
  );
}