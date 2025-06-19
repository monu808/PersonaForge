import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  CheckCircle, 
  Download, 
  ExternalLink,
  FileText,
  Video,
  Image,
  MessageSquare,
  Mic,
  Settings,
  Clock,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  getUserPurchasedServices, 
  getUserServiceDeliveries, 
  accessServiceContent 
} from '@/lib/api/persona-services';

const SERVICE_TYPE_ICONS = {
  consultation: MessageSquare,
  video: Video,
  image: Image,
  text: FileText,
  voice_message: Mic,
  custom: Settings
};

const SERVICE_TYPE_LABELS = {
  consultation: 'Consultation',
  video: 'Video Content',
  image: 'Image Content', 
  text: 'Text Content',
  voice_message: 'Voice Message',
  custom: 'Custom Service'
};

export function PurchasedServices() {
  const [purchasedServices, setPurchasedServices] = useState<any[]>([]);
  const [serviceDeliveries, setServiceDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'access' | 'content'>('access');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load purchased services with access details
      const { data: purchasedData } = await getUserPurchasedServices();
      setPurchasedServices(purchasedData || []);

      // Load service deliveries
      const { data: deliveriesData } = await getUserServiceDeliveries();
      setServiceDeliveries(deliveriesData || []);
    } catch (error) {
      console.error('Error loading purchased services:', error);
      toast({
        title: "Error",
        description: "Failed to load your purchased services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccessContent = async (deliveryId: string) => {
    try {
      const { data, error } = await accessServiceContent(deliveryId);
      
      if (error) {
        toast({
          title: "Access Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        // If there's a URL, open it
        if (data.content_url) {
          window.open(data.content_url, '_blank');
        }
        
        // If there's text content, copy to clipboard
        if (data.content_text) {
          await navigator.clipboard.writeText(data.content_text);
          toast({
            title: "Content Copied",
            description: "Text content has been copied to your clipboard",
          });
        }

        toast({
          title: "Content Accessed",
          description: "Service content has been accessed successfully",
        });

        // Refresh data to update download counts
        loadData();
      }
    } catch (error) {
      console.error('Error accessing content:', error);
      toast({
        title: "Error",
        description: "Failed to access service content",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading your purchased services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">My Purchased Services</h2>
        <p className="text-white/60">
          Access and manage all the persona services you've purchased
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 max-w-md">
        <button
          onClick={() => setActiveTab('access')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'access'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <CheckCircle className="h-4 w-4 mr-2 inline" />
          Service Access
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Download className="h-4 w-4 mr-2 inline" />
          Digital Content
        </button>
      </div>

      {/* Service Access Tab */}
      {activeTab === 'access' && (
        <div>
          {purchasedServices.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-20 w-20 text-white/30 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">No Services Purchased</h3>
              <p className="text-white/60 max-w-md mx-auto">
                Start exploring personas and purchase services to access exclusive content and consultations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedServices.map((access) => {
                const service = access.persona_services;
                const persona = service?.personas;
                const serviceType = service?.service_type as keyof typeof SERVICE_TYPE_ICONS || 'custom';
                const IconComponent = SERVICE_TYPE_ICONS[serviceType];
                
                return (
                  <motion.div
                    key={access.id}
                    className="bg-slate-800/30 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <IconComponent className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{service?.service_name}</h4>
                        <p className="text-sm text-blue-300">{SERVICE_TYPE_LABELS[serviceType]}</p>
                        <p className="text-xs text-white/60">{persona?.name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-white/70 text-sm line-clamp-2">
                        {service?.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          access.access_type === 'full'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : access.access_type === 'limited'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {access.access_type} access
                        </span>
                        
                        {service?.duration_minutes && (
                          <div className="flex items-center text-xs text-white/60">
                            <Clock className="h-3 w-3 mr-1" />
                            {service.duration_minutes}min
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>
                          Usage: {access.usage_count || 0}{access.max_usage ? `/${access.max_usage}` : ''}
                        </span>
                        <span>
                          Purchased: {new Date(access.access_granted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Digital Content Tab */}
      {activeTab === 'content' && (
        <div>
          {serviceDeliveries.length === 0 ? (
            <div className="text-center py-16">
              <Download className="h-20 w-20 text-white/30 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">No Digital Content</h3>
              <p className="text-white/60 max-w-md mx-auto">
                Purchase video, image, or text services to access downloadable content here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceDeliveries.map((delivery) => {
                const serviceType = delivery.persona_services?.service_type as keyof typeof SERVICE_TYPE_ICONS || 'custom';
                const IconComponent = SERVICE_TYPE_ICONS[serviceType];
                
                return (
                  <motion.div
                    key={delivery.id}
                    className="bg-slate-800/30 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                          <IconComponent className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{delivery.persona_services?.service_name}</h4>
                          <p className="text-sm text-green-300">{SERVICE_TYPE_LABELS[serviceType]}</p>
                          <p className="text-xs text-white/60">{delivery.persona_services?.personas?.name}</p>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        delivery.delivery_status === 'delivered' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : delivery.delivery_status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {delivery.delivery_status}
                      </span>
                    </div>

                    {delivery.delivery_status === 'delivered' && (
                      <div className="space-y-4">
                        {delivery.content_text && (
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <p className="text-white/80 text-sm line-clamp-4">
                              {delivery.content_text}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {delivery.content_url && (
                            <Button
                              onClick={() => window.open(delivery.content_url, '_blank')}
                              size="sm"
                              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400"
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Open
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleAccessContent(delivery.id)}
                            size="sm"
                            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400"
                          >
                            {delivery.content_text ? (
                              <>
                                <Copy className="h-3 w-3 mr-2" />
                                Copy
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3 mr-2" />
                                Access
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/60">
                          {delivery.max_downloads && (
                            <span>
                              Downloads: {delivery.download_count || 0}/{delivery.max_downloads}
                            </span>
                          )}
                          <span>
                            Delivered: {new Date(delivery.delivered_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
