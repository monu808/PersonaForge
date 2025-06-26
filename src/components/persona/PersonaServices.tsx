import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  MessageSquare,
  Video,
  FileText,
  Mic,
  Settings,
  ShoppingBag,
  CreditCard,
  Wallet,
  CheckCircle,
  Upload,
  Link,
  File,
  X,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { 
  createPersonaService, 
  getPersonaServices, 
  updatePersonaService, 
  deletePersonaService,
  getUserPurchases,
  getUserPurchasedServices,
  getAllPersonaServices
} from '@/lib/api/persona-services';
import { 
  connectWallet, 
  disconnectWallet, 
  getAccountBalance,
  payForService,
  initializeWalletFromDatabase
} from '@/lib/api/algorand';
import type { PersonaService } from '@/lib/api/algorand';

interface PersonaServicesProps {
  persona: any;
  isOwner: boolean;
  onServicePurchased?: (service: PersonaService) => void;
  showAllServices?: boolean; // New prop for marketplace view
  selectedServiceId?: string; // New prop to highlight a specific service
}

interface CreateServiceFormData {
  service_name: string;
  description: string;
  price_algo: number;
  price_usd: number;
  service_type: 'consultation' | 'content_creation' | 'voice_message' | 'video_call' | 'custom';
  duration_minutes?: number;
  delivery_content?: string; // For text content or instructions
  delivery_url?: string; // For video/image URLs
  file_type?: string; // File type for media services
  auto_delivery?: boolean; // Whether content is delivered automatically
  uploaded_file?: File | null; // For file uploads
}

const SERVICE_TYPE_ICONS = {
  consultation: MessageSquare,
  content_creation: Video,
  voice_message: Mic,
  video_call: Video,
  custom: Settings
};

const SERVICE_TYPE_LABELS = {
  consultation: 'Consultation',
  content_creation: 'Content Creation',
  voice_message: 'Voice Message',
  video_call: 'Video Call',
  custom: 'Custom Service'
};

export function PersonaServices({ persona, isOwner, onServicePurchased, showAllServices = false, selectedServiceId }: PersonaServicesProps) {  const [services, setServices] = useState<PersonaService[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasedServices, setPurchasedServices] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<PersonaService | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'services' | 'purchases' | 'my-services'>('services');
  const [purchasingService, setPurchasingService] = useState<string | null>(null);const [formData, setFormData] = useState<CreateServiceFormData>({
    service_name: '',
    description: '',
    price_algo: 1,
    price_usd: 0,
    service_type: 'consultation',
    duration_minutes: 30,
    delivery_content: '',
    delivery_url: '',    file_type: '',
    auto_delivery: false,
    uploaded_file: null
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState<number | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  // Listen for service updates from other components (like Coruscant)
  useEffect(() => {
    const handleServiceUpdate = () => {
      loadData();
    };

    // Listen for custom events
    window.addEventListener('personaServiceCreated', handleServiceUpdate);
    window.addEventListener('personaServiceUpdated', handleServiceUpdate);
    window.addEventListener('personaServiceDeleted', handleServiceUpdate);

    return () => {
      window.removeEventListener('personaServiceCreated', handleServiceUpdate);
      window.removeEventListener('personaServiceUpdated', handleServiceUpdate);
      window.removeEventListener('personaServiceDeleted', handleServiceUpdate);
    };
  }, []);

  useEffect(() => {
    loadData();
    initializeWallet();
  }, [persona.id]);
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load services - use getAllPersonaServices for marketplace view
      if (showAllServices) {
        const { data: servicesData } = await getAllPersonaServices();
        setServices(servicesData || []);
      } else {
        const { data: servicesData } = await getPersonaServices(persona.id);
        setServices(servicesData || []);
      }

      // Load purchases if not owner
      if (!isOwner) {
        const { data: purchasesData } = await getUserPurchases();
        setPurchases(purchasesData || []);        // Load purchased services with access details
        const { data: purchasedServicesData } = await getUserPurchasedServices();
        setPurchasedServices(purchasedServicesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load services data",
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
        
        // Get balance for the wallet
        try {
          const { balance } = await getAccountBalance(dbWalletAddress);
          setWalletBalance(balance);
        } catch (error) {
          console.error('Error getting wallet balance:', error);
          setWalletBalance(0);
        }
      } else {
        console.log('No wallet found in database');
        setWalletAddress(null);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error initializing wallet from database:', error);
      setWalletAddress(null);
      setWalletBalance(0);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const result = await connectWallet();
      if (result.success && result.address) {
        setWalletAddress(result.address);
        const { balance } = await getAccountBalance(result.address);
        setWalletBalance(balance);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${result.address.slice(0, 8)}...${result.address.slice(-8)}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Error",
        description: "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      setWalletAddress(null);
      setWalletBalance(0);
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected wallet",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleCreateService = async () => {
    if (!formData.service_name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }    try {
      // Handle file upload first if there's a file
      let fileUrl = formData.delivery_url;
      if (formData.uploaded_file) {
        // For now, we'll just use the file name as a placeholder
        // In a real implementation, you'd upload to storage and get the URL
        fileUrl = `uploads/${formData.uploaded_file.name}`;
      }

      const serviceData = {
        persona_id: persona.id,
        service_name: formData.service_name,
        description: formData.description,
        price_algo: formData.price_algo,
        price_usd: formData.price_usd,
        service_type: formData.service_type,
        duration_minutes: formData.duration_minutes,
        delivery_content: formData.delivery_content,
        delivery_url: fileUrl,
        file_type: formData.file_type,
        auto_delivery: formData.auto_delivery,
        creator_wallet: walletAddress || '',
        is_active: true
      };

      const { data, error } = await createPersonaService(serviceData);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setServices(prev => [data, ...prev]);
        setShowCreateForm(false);
        resetForm();
          toast({
          title: "Service Created",
          description: "Your persona service has been created successfully",
        });
        
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('personaServiceCreated', {
          detail: { service: data, persona_id: persona.id }
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

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const { error } = await updatePersonaService(editingService.id, formData);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      setServices(prev => prev.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData }
          : s
      ));
      
      setEditingService(null);
      resetForm();
        toast({
        title: "Service Updated",
        description: "Service has been updated successfully",
      });
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('personaServiceUpdated', {
        detail: { serviceId: editingService.id, persona_id: persona.id }
      }));
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive"
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
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
        detail: { serviceId, persona_id: persona.id }
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
  const handlePurchaseService = async (service: PersonaService) => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to purchase services",
        variant: "destructive"
      });
      return;
    }

    if (walletBalance < service.price_algo) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${service.price_algo} ALGO to purchase this service. Current balance: ${walletBalance} ALGO`,
        variant: "destructive"
      });
      return;
    }

    setPurchasingService(service.id);
    
    // Show initial feedback
    toast({
      title: "Initiating Payment",
      description: "Please check your Pera Wallet to approve the transaction",
    });
    
    try {
      console.log('Starting payment for service:', service.service_name);
      console.log('Buyer wallet:', walletAddress);
      console.log('Amount:', service.price_algo, 'ALGO');
      
      const result = await payForService({
        service_id: service.id,
        buyer_wallet: walletAddress,
        amount_algo: service.price_algo,
        persona_name: persona.name,
        service_name: service.service_name
      });

      console.log('Payment result:', result);

      if (result.success) {
        // Grant access to persona features based on service type
        await grantPersonaAccess(service);
        
        toast({
          title: "Payment Successful",
          description: `Successfully purchased ${service.service_name}. You now have access to this persona's ${service.service_type.replace('_', ' ')} features.`,
        });
        
        // Refresh balance and purchases
        const { balance } = await getAccountBalance(walletAddress);
        setWalletBalance(balance);
        
        if (onServicePurchased) {
          onServicePurchased(service);
        }
        
        // Show quick access options for specific service types
        if (service.service_type === 'consultation') {
          setTimeout(() => {
            toast({
              title: "Quick Access",
              description: "Click 'Start Conversation' to begin your consultation session."
            });
          }, 2000);
        } else if (service.service_type === 'video_call') {
          setTimeout(() => {
            toast({
              title: "Video Call Access",
              description: "Your video call access is now active for 30 days. Contact the persona owner to schedule."
            });
          }, 2000);
        }
        
        // Refresh purchases data
        loadData();
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to process payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error purchasing service:', error);
      toast({
        title: "Error",
        description: "Failed to purchase service",
        variant: "destructive"
      });    } finally {
      setPurchasingService(null);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      price_algo: 1,
      price_usd: 0,
      service_type: 'consultation',
      duration_minutes: 30,
      delivery_content: '',
      delivery_url: '',
      file_type: '',
      auto_delivery: false,
      uploaded_file: null
    });
    setFileUploadProgress(null);
    setFileUploadError(null);
  };

  const grantPersonaAccess = async (service: PersonaService) => {
    try {
      // Import the function locally to avoid unused import error
      const { grantPersonaAccess: grantAccess } = await import('@/lib/api/persona-access');
      
      // Determine access parameters based on service type
      const options: { maxUsage?: number; expiresInDays?: number } = {};
      
      if (service.service_type === 'consultation') {
        options.maxUsage = 1; // Consultations are one-time use
      } else if (service.service_type === 'video_call') {
        options.expiresInDays = 30; // Video calls expire in 30 days
      }
      
      const success = await grantAccess(
        service.persona_id,
        service.id,
        service.service_type,
        walletAddress || '',
        options
      );
      
      if (success) {
        console.log('Successfully granted persona access');
      } else {
        console.error('Failed to grant persona access');
      }
    } catch (error) {
      console.error('Error granting persona access:', error);
    }
  };
  const startEdit = (service: PersonaService) => {    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      description: service.description,
      price_algo: service.price_algo,
      price_usd: service.price_usd,
      service_type: service.service_type,
      duration_minutes: service.duration_minutes,
      delivery_content: service.delivery_content || '',
      delivery_url: service.delivery_url || '',
      file_type: service.file_type || '',
      auto_delivery: service.auto_delivery || false,
      uploaded_file: null
    });
    setShowCreateForm(true);
  };

  const isPurchased = (serviceId: string) => {
    return purchases.some(p => p.service_id === serviceId);
  };
  const handleFileUpload = (file: File) => {
    // Basic file validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = {
      content_creation: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      voice_message: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
    };

    if (file.size > maxSize) {
      setFileUploadError('File size must be less than 50MB');
      return;
    }

    if (formData.service_type === 'content_creation' && !allowedTypes.content_creation.includes(file.type)) {
      setFileUploadError('Please upload a valid video or image file (MP4, MOV, AVI, JPEG, PNG, GIF, WebP)');
      return;
    }

    if (formData.service_type === 'voice_message' && !allowedTypes.voice_message.includes(file.type)) {
      setFileUploadError('Please upload a valid audio file (MP3, WAV, M4A, OGG)');
      return;
    }

    setFileUploadError(null);
    setFormData(prev => ({ 
      ...prev, 
      uploaded_file: file,
      file_type: file.type,
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
  const manualRefresh = () => {
    loadData();
    toast({
      title: "Refreshed",
      description: "Services have been refreshed",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {showAllServices 
              ? 'All Available Services' 
              : isOwner 
                ? 'Monetize Your Persona' 
                : `${persona.name} Services`
            }
          </h3>
          <p className="text-white/60">
            {showAllServices
              ? 'Browse and purchase services from all AI personas'
              : isOwner 
                ? 'Create and manage services for your persona' 
                : 'Purchase services from this persona using Algorand'
            }
          </p>
        </div>

        {/* Wallet Section */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-white/60">Wallet</div>
                <div className="text-white font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                </div>
                <div className="text-green-400 text-xs">
                  {walletBalance.toFixed(3)} ALGO
                </div>
              </div>
              <Button
                onClick={handleDisconnectWallet}
                variant="outline"
                size="sm"
                className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnectWallet}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <ShoppingBag className="h-4 w-4 mr-2 inline" />
          Services
        </button>
        {!isOwner && (
          <>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'purchases'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2 inline" />
              My Purchases
            </button>
            <button
              onClick={() => setActiveTab('my-services')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-services'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2 inline" />
              My Content
            </button>
          </>
        )}
      </div>

      {activeTab === 'services' && (
        <div className="space-y-6">          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={manualRefresh}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Refresh Services
            </Button>
            
            {/* Create Service Button (Owner Only) */}
            {isOwner && !showAllServices && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Service
              </Button>
            )}
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">
                {showAllServices 
                  ? 'No Services Available' 
                  : isOwner 
                    ? 'No Services Created' 
                    : 'No Services Available'
                }
              </h4>
              <p className="text-white/60 max-w-md mx-auto">
                {showAllServices
                  ? 'No services have been created yet across all personas'
                  : isOwner 
                    ? 'Start monetizing your persona by creating your first service'
                    : 'This persona has not created any services yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const IconComponent = SERVICE_TYPE_ICONS[service.service_type];
                const purchased = isPurchased(service.id);
                const isSelected = selectedServiceId === service.id;
                
                return (
                  <motion.div
                    key={service.id}
                    className={`bg-slate-800/30 rounded-xl p-6 border transition-colors ${
                      isSelected 
                        ? 'border-blue-500/60 bg-blue-500/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                          <IconComponent className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{service.service_name}</h4>
                          <p className="text-xs text-blue-300">{SERVICE_TYPE_LABELS[service.service_type]}</p>
                          {showAllServices && (service as any).persona_name && (
                            <p className="text-xs text-green-300">by {(service as any).persona_name}</p>
                          )}
                        </div>
                      </div>
                      
                      {isOwner && !showAllServices && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(service)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30"
                          >
                            <Edit3 className="h-3 w-3 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-white/70 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-white/60">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration_minutes || 'N/A'} minutes</span>
                        </div>
                        {purchased && (
                          <div className="flex items-center space-x-1 text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Purchased</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {service.price_algo} ALGO
                          </div>
                          <div className="text-sm text-white/60">
                            ≈ ${service.price_usd.toFixed(2)} USD
                          </div>
                        </div>

                        {!isOwner && !purchased && (
                          <Button
                            onClick={() => handlePurchaseService(service)}
                            disabled={purchasingService === service.id || !walletAddress}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 text-sm"
                          >
                            {purchasingService === service.id ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Purchase
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'purchases' && !isOwner && (
        <div className="space-y-6">
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">No Purchases Yet</h4>
              <p className="text-white/60 max-w-md mx-auto">
                Purchase services from personas to see your transaction history here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-slate-800/30 rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{purchase.service_name}</h4>
                      <p className="text-white/60 text-sm">{purchase.persona_name}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {purchase.amount_algo} ALGO
                      </div>
                      <div className="text-green-400 text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>      )}      {activeTab === 'my-services' && !isOwner && (
        <div className="space-y-6">
          {/* Service Deliveries Section */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">My Purchased Content</h4>
            {(() => {
              // Filter purchased services that have content (non-consultation services with delivery content or URLs)
              const contentServices = purchasedServices.filter(service => 
                service.service_type !== 'consultation' && 
                (service.delivery_content || service.delivery_url || service.file_type)
              );
              
              return contentServices.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">No Content Available</h4>
                  <p className="text-white/60 max-w-md mx-auto">
                    Purchase services with digital content to access them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentServices.map((service) => {
                    const serviceType = service.service_type as keyof typeof SERVICE_TYPE_ICONS || 'custom';
                    const IconComponent = SERVICE_TYPE_ICONS[serviceType] || FileText;
                    
                    return (
                      <motion.div
                        key={service.id}
                        className="bg-slate-800/30 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                              <IconComponent className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-white">{service.service_name}</h5>
                              <p className="text-xs text-green-300">{SERVICE_TYPE_LABELS[serviceType]}</p>
                              <p className="text-xs text-white/60">Purchased Service</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              Available
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {service.delivery_content && (
                            <div className="bg-slate-700/30 rounded-lg p-3">
                              <h6 className="text-white/90 text-sm font-medium mb-1">Content:</h6>
                              <p className="text-white/80 text-sm">
                                {service.delivery_content}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            {service.delivery_url && (
                              <Button
                                onClick={() => window.open(service.delivery_url, '_blank')}
                                size="sm"
                                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Content
                              </Button>
                            )}
                            
                            {service.delivery_url && (
                              <Button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = service.delivery_url;
                                  link.download = service.service_name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                          
                          {service.file_type && (
                            <div className="text-xs text-white/60">
                              Format: {service.file_type.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );                  })}
                </div>
              );
            })()}
          </div>

          {/* Purchased Services Access */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Service Access</h4>
            {purchasedServices.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">
                  No purchased services yet. Buy services to access personas and their content.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">                {purchasedServices.map((access) => {
                  const service = access.persona_services;
                  const persona = service?.personas;
                  const serviceType = service?.service_type as keyof typeof SERVICE_TYPE_ICONS || 'custom';
                  const IconComponent = SERVICE_TYPE_ICONS[serviceType] || Settings;
                  
                  return (
                    <div
                      key={access.id}
                      className="bg-slate-800/30 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                          <IconComponent className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <h6 className="font-medium text-white text-sm">{service?.service_name}</h6>
                          <p className="text-xs text-white/60">{persona?.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          access.access_type === 'full'
                            ? 'bg-green-500/20 text-green-400'
                            : access.access_type === 'limited'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {access.access_type} access
                        </span>
                        
                        <p className="text-xs text-white/60">
                          Used: {access.usage_count || 0}{access.max_usage ? `/${access.max_usage}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Service Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowCreateForm(false);
              setEditingService(null);
              resetForm();
            }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-white/10 max-h-[85vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="p-6 pb-4 border-b border-white/10 shrink-0">
                <h3 className="text-xl font-bold text-white">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h3>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white/90">Basic Information</h4>
                    
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={formData.service_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                        className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g., Personal Consultation"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Describe what your service includes..."
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Service Type
                      </label>
                      <select
                        value={formData.service_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value as any }))}
                        className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing and Duration */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white/90">Pricing & Duration</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Price (ALGO)
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={formData.price_algo}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            price_algo: parseFloat(e.target.value) || 0,
                            price_usd: (parseFloat(e.target.value) || 0) * 0.20 // Rough conversion
                          }))}
                          className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
                          placeholder="1.0"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || undefined }))}
                          className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Delivery Section */}
                  {(formData.service_type === 'content_creation' || formData.service_type === 'voice_message') && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white/90">Content Delivery</h4>
                      
                      <div className="border border-white/10 rounded-lg p-4 bg-slate-800/30">
                        {/* File Upload Option */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              <Upload className="inline w-4 h-4 mr-1" />
                              Upload {formData.service_type === 'voice_message' ? 'Audio' : 'Video/Image'} File
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
                                  formData.service_type === 'content_creation' ? 'video/*,image/*' :
                                  formData.service_type === 'voice_message' ? 'audio/*' : '*'
                                }
                              />
                              <div className="w-full bg-slate-700/50 border-2 border-dashed border-white/20 rounded-lg px-6 py-8 text-center hover:border-blue-400/50 transition-colors">
                                {formData.uploaded_file ? (
                                  <div className="space-y-2">
                                    <File className="h-12 w-12 text-green-400 mx-auto" />
                                    <div className="text-white font-medium">{formData.uploaded_file.name}</div>
                                    <div className="text-white/60 text-sm">{formatFileSize(formData.uploaded_file.size)}</div>
                                    {fileUploadProgress !== null && fileUploadProgress < 100 && (
                                      <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div 
                                          className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${fileUploadProgress}%` }}
                                        />
                                      </div>
                                    )}
                                    {fileUploadProgress === 100 && (
                                      <div className="flex items-center justify-center text-green-400 text-sm">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Upload complete
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={removeFile}
                                      className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-sm transition-colors"
                                    >
                                      <X className="inline h-3 w-3 mr-1" />
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Upload className="h-12 w-12 text-white/40 mx-auto" />
                                    <div className="text-white/60">
                                      Click to upload {formData.service_type === 'voice_message' ? 'audio' : 'video/image'} file
                                    </div>
                                    <div className="text-white/40 text-xs">
                                      Max file size: 50MB
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {fileUploadError && (
                              <div className="mt-2 text-red-400 text-sm flex items-center">
                                <X className="h-4 w-4 mr-1" />
                                {fileUploadError}
                              </div>
                            )}
                          </div>

                          {/* OR divider */}
                          <div className="flex items-center">
                            <div className="flex-1 border-t border-white/10"></div>
                            <span className="px-3 text-white/40 text-sm">OR</span>
                            <div className="flex-1 border-t border-white/10"></div>
                          </div>

                          {/* URL Option */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              <Link className="inline w-4 h-4 mr-1" />
                              Content URL
                            </label>
                            <input
                              type="url"
                              value={formData.delivery_url || ''}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                delivery_url: e.target.value,
                                uploaded_file: e.target.value ? null : prev.uploaded_file // Clear file if URL is entered
                              }))}
                              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
                              placeholder={`https://your-content-hosting.com/file.${formData.service_type === 'content_creation' ? 'mp4' : 'mp3'}`}
                              disabled={!!formData.uploaded_file}
                            />
                            <p className="text-white/60 text-xs mt-1">
                              Link to your {formData.service_type === 'voice_message' ? 'audio' : 'video/image'} content hosted on external platforms
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* File Type Selection */}
                      {!formData.uploaded_file && (
                        <div>
                          <label className="block text-white/80 text-sm font-medium mb-2">
                            File Type
                          </label>
                          <select
                            value={formData.file_type || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, file_type: e.target.value }))}
                            className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select file type</option>
                            {formData.service_type === 'content_creation' && (
                              <>
                                <option value="video/mp4">MP4 Video</option>
                                <option value="video/mov">MOV Video</option>
                                <option value="video/avi">AVI Video</option>
                                <option value="video/quicktime">QuickTime Video</option>
                                <option value="image/jpeg">JPEG Image</option>
                                <option value="image/png">PNG Image</option>
                                <option value="image/gif">GIF Image</option>
                                <option value="image/webp">WebP Image</option>
                              </>
                            )}
                            {formData.service_type === 'voice_message' && (
                              <>
                                <option value="audio/mp3">MP3 Audio</option>
                                <option value="audio/wav">WAV Audio</option>
                                <option value="audio/m4a">M4A Audio</option>
                                <option value="audio/ogg">OGG Audio</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Auto Delivery Setting */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto-delivery"
                          checked={formData.auto_delivery || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, auto_delivery: e.target.checked }))}
                          className="w-4 h-4 bg-slate-700/50 border border-white/20 rounded focus:ring-blue-400"
                        />
                        <label htmlFor="auto-delivery" className="text-white/80 text-sm">
                          Enable automatic delivery after purchase
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Additional Settings */}
                  {formData.service_type !== 'consultation' && !((formData.service_type === 'content_creation' || formData.service_type === 'voice_message')) && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white/90">Service Settings</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto-delivery-other"
                          checked={formData.auto_delivery || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, auto_delivery: e.target.checked }))}
                          className="w-4 h-4 bg-slate-700/50 border border-white/20 rounded focus:ring-blue-400"
                        />
                        <label htmlFor="auto-delivery-other" className="text-white/80 text-sm">
                          Enable automatic delivery after purchase
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <div className="p-6 pt-4 border-t border-white/10 shrink-0">
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingService(null);
                      resetForm();
                    }}
                    variant="outline"
                    className="flex-1 bg-slate-700/50 border-white/20 text-white hover:bg-slate-600/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingService ? handleUpdateService : handleCreateService}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                  >
                    {editingService ? 'Update' : 'Create'} Service
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
