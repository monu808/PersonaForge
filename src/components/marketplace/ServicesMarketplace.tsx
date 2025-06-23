import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MessageSquare,
  Video,
  Mic,
  Settings,
  Edit3,
  Clock,
  CreditCard,
  Wallet,  Star,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { PersonaServices } from '@/components/persona/PersonaServices';
import { 
  getAllPersonaServices 
} from '@/lib/api/persona-services';
import { 
  connectWallet, 
  disconnectWallet, 
  getConnectedWallet, 
  isWalletConnected,
  getAccountBalance,
  initializeWalletFromDatabase
} from '@/lib/api/algorand';
import type { PersonaService } from '@/lib/api/algorand';

const SERVICE_TYPE_ICONS = {
  consultation: MessageSquare,
  content_creation: Edit3,
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

const SERVICE_TYPE_FILTERS = [
  { value: 'all', label: 'All Services' },
  { value: 'consultation', label: 'Consultations' },
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'voice_message', label: 'Voice Messages' },
  { value: 'video_call', label: 'Video Calls' },
  { value: 'custom', label: 'Custom Services' }
];

interface ServiceWithPersona extends PersonaService {
  persona_name?: string;
  persona_image?: string;
  persona_type?: string;
}

export function ServicesMarketplace() {
  const [services, setServices] = useState<ServiceWithPersona[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest' | 'popular'>('newest');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<ServiceWithPersona | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    loadServices();
    initializeWallet();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, searchQuery, selectedFilter, sortBy]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllPersonaServices();
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      setServices(data || []);
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

  const filterAndSortServices = () => {
    let filtered = [...services];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.service_name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.persona_name?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(service => service.service_type === selectedFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price_algo - b.price_algo);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price_algo - a.price_algo);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        // For now, just sort by newest. In production, you'd have popularity metrics
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredServices(filtered);
  };

  const openServiceModal = (service: ServiceWithPersona) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setSelectedService(null);
    setShowServiceModal(false);
  };

  const modalStyles = `
    .service-modal-container * {
      position: relative !important;
    }
    .service-modal-container .fixed,
    .service-modal-container .absolute {
      position: relative !important;
    }
  `;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading marketplace...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <style>{modalStyles}</style>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <ShoppingBag className="h-8 w-8 mr-4 text-blue-400" />
            Services Marketplace
          </h2>
          <p className="text-white/60">
            Discover and purchase services from AI personas using Algorand
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
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-white/10">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search services or personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter by type */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/60" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
            >
              {SERVICE_TYPE_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">
            {searchQuery || selectedFilter !== 'all' ? 'No Services Found' : 'No Services Available'}
          </h4>
          <p className="text-white/60 max-w-md mx-auto">
            {searchQuery || selectedFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Personas have not created any services yet'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const IconComponent = SERVICE_TYPE_ICONS[service.service_type];
            
            return (
              <motion.div
                key={service.id}
                className="bg-slate-800/30 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                onClick={() => openServiceModal(service)}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                      <IconComponent className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white line-clamp-1">{service.service_name}</h4>
                      <p className="text-xs text-blue-300">{SERVICE_TYPE_LABELS[service.service_type]}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {service.price_algo} ALGO
                    </div>
                    <div className="text-xs text-white/60">
                      ≈ ${service.price_usd.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Persona Info */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                    {service.persona_image ? (
                      <img 
                        src={service.persona_image} 
                        alt={service.persona_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <User className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{service.persona_name || 'Unknown Persona'}</div>
                    <div className="text-xs text-white/60">{service.persona_type || 'AI Persona'}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Service Details */}
                <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration_minutes || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>4.8</span> {/* Mock rating */}
                  </div>
                </div>

                {/* Purchase Button */}
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openServiceModal(service);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase Service
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}      {/* Service Detail Modal - Rendered as Portal */}
      {showServiceModal && selectedService && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          style={{ zIndex: 1000 }}
        >
          <motion.div
            className="bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-white/20"
            style={{ 
              height: '80vh', 
              minHeight: '600px', 
              maxHeight: '90vh',
              zIndex: 1001
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Fixed Header */}
            <div className="p-6 border-b border-white/20 bg-slate-800 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Service Details</h3>
                <button
                  onClick={closeServiceModal}
                  className="text-white/60 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-slate-800 rounded-b-2xl" style={{ height: 'calc(80vh - 100px)' }}>
              <div className="h-full overflow-y-auto p-6">
                <PersonaServices 
                  persona={{ 
                    id: selectedService.persona_id, 
                    name: selectedService.persona_name || 'AI Persona',
                    replica_type: selectedService.persona_type || 'AI'
                  }} 
                  isOwner={false}
                  onServicePurchased={() => {
                    closeServiceModal();
                    loadServices(); // Refresh the services list
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
