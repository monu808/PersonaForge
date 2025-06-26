import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  Heart,
  Radio,
  Headphones,
  MessageSquare,
  Users,
  Clock,
  Music,
  Brain,
  Crown,
  ChevronDown,
  Trash2,
  Edit,
  ShoppingBag
} from 'lucide-react';
import { PersonaChat } from '@/components/chat/PersonaChat';
import { getPersonas, deletePersona } from '@/lib/api/personas';
import { PodcastList } from '@/components/podcast/PodcastList';
import { LiveEvents } from '@/components/coruscant/LiveEvents';
import { PersonaServices } from '@/components/persona/PersonaServices';
import { ServicesMarketplace } from '@/components/marketplace/ServicesMarketplace';
import { toast } from '@/components/ui/use-toast';

// Memoized PersonaCard component for better performance
const PersonaCard = memo(({ 
  persona, 
  isSelected, 
  onClick, 
  getPersonaEmoji 
}: { 
  persona: any; 
  isSelected: boolean; 
  onClick: () => void; 
  getPersonaEmoji: (type: string) => string; 
}) => (
  <div
    className={`
      bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl p-4 border transition-colors duration-200 cursor-pointer hover:border-white/20
      ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10'}
    `}
    onClick={onClick}
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-lg">
        {persona.attributes?.image_url ? (
          <img 
            src={persona.attributes.image_url} 
            alt={persona.name}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          getPersonaEmoji(persona.replica_type)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm truncate">{persona.name}</h4>
        <p className="text-xs text-blue-300">{persona.replica_type}</p>
      </div>
    </div>
    <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
      {persona.description}
    </p>
  </div>
));

PersonaCard.displayName = 'PersonaCard';

export default function Neurovia() {
  const { user } = useAuth();  const [activeTab, setActiveTab] = useState('liveevents');
  const [personas, setPersonas] = useState<any[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);  const [personaToDelete, setPersonaToDelete] = useState<any>(null);
  // const [podcastRefresh, setPodcastRefresh] = useState<number>(0); // Removed - podcasts now created in Coruscant
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadPersonas = useCallback(async () => {
    try {
      setPersonasLoading(true);
      const { data } = await getPersonas();
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setPersonasLoading(false);
    }
  }, []);

  const initializeNeurovia = useCallback(async () => {
    try {
      // Load initial data
      await loadPersonas();
    } catch (error) {
      console.error('Failed to initialize Neurovia:', error);
      toast({
        title: "Error",
        description: "Failed to load Neurovia data. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [loadPersonas]);

  useEffect(() => {
    // Initialize sync service and load data
    if (user) {
      initializeNeurovia();
    }
  }, [user, initializeNeurovia]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPersonaDropdown(false);
      }
    };    if (showPersonaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPersonaDropdown]);

  const openPersonaChat = useCallback((persona: any) => {
    setSelectedPersona(persona);
    setShowChat(true);
  }, []);
  
  const closePersonaChat = useCallback(() => {
    setShowChat(false);
    setSelectedPersona(null);
  }, []);

  const handleDeletePersona = useCallback((persona: any) => {
    setPersonaToDelete(persona);
    setShowDeleteConfirm(true);
  }, []);
  const confirmDeletePersona = useCallback(async () => {
    if (!personaToDelete) return;

    try {
      const { error } = await deletePersona(personaToDelete.id);
      
      if (error) {
        throw error;
      }

      // Remove from local state
      setPersonas(prev => prev.filter(p => p.id !== personaToDelete.id));
      
      // Clear selection if deleted persona was selected
      if (selectedPersona?.id === personaToDelete.id) {
        setSelectedPersona(null);
      }

      toast({
        title: "Persona Deleted",
        description: `${personaToDelete.name} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        title: "Error",
        description: "Failed to delete persona. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteConfirm(false);
      setPersonaToDelete(null);
    }  }, [personaToDelete, selectedPersona]);

  const cancelDeletePersona = useCallback(() => {
    setShowDeleteConfirm(false);
    setPersonaToDelete(null);
  }, []);

  // Memoized values
  const personaCount = useMemo(() => personas.length, [personas.length]);
    const navItems = useMemo(() => [
    { name: 'Live Events', icon: Radio, active: activeTab === 'liveevents' },
    { name: 'Podcasts', icon: Headphones, active: activeTab === 'podcasts' },
    { name: 'Services', icon: ShoppingBag, active: activeTab === 'services' },
    { name: 'Personas', icon: Users, active: activeTab === 'personas' },
    { name: 'Memorial', icon: Heart, active: activeTab === 'memorial' },
    { name: 'Entertainment', icon: Music, active: activeTab === 'entertainment' }
  ], [activeTab]);

  const getPersonaEmoji = useCallback((type: string) => {
    switch (type?.toLowerCase()) {
      case 'professional': return '💼';
      case 'creative': return '🎨';
      case 'personal': return '👤';
      case 'historical': return '📜';
      case 'celebrity': return '⭐';
      default: return '🤖';
    }
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center p-8 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Neurovia</h1>
          <p className="text-white/70 mb-6">Neural Content Platform - Please sign in to continue</p>
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
            <Link to="/auth/sign-in">Sign In to Enter Neurovia</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Simplified Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl opacity-30" />
      </div>      {/* Navigation Bar */}
      <nav className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Neurovia
                </h1>
                <p className="text-white/60 text-sm">Neural Entertainment Platform</p>
              </div>
            </div>
              <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${
                    item.active ? 'text-cyan-400' : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => handleTabChange(item.name.toLowerCase().replace(' ', '').replace('events', 'liveevents'))}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.active && (
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>            <div className="flex items-center space-x-4">
              {/* Removed Premium badge */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 relative z-10">
          {/* Enhanced Content Grid - Conditional Tab-based Rendering */}
        {activeTab === 'personas' ? (
          /* Dropdown-based Personas Selection with Single Chat Button */
          <div className="w-full">
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Users className="h-8 w-8 mr-4 text-blue-400" />
                Your AI Personas ({personaCount})
              </h2>
                {personasLoading ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-6">🔄</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Loading Your Personas...</h3>
                  <p className="text-white/80 text-lg max-w-2xl mx-auto">
                    Preparing your AI companions for conversation.
                  </p>
                </div>
              ) : personas.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-6">🤖</div>
                  <h3 className="text-2xl font-bold text-white mb-4">No Personas Yet</h3>
                  <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                    Create your first AI persona to start having meaningful conversations powered by advanced AI technology.
                  </p>
                  <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg">
                    Create Your First Persona
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Persona Selection Dropdown */}
                  <div className="max-w-md mx-auto">
                    <label className="block text-white/80 text-lg font-medium mb-4">Select a Persona to Chat With:</label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        className="w-full bg-slate-800/50 border border-white/20 rounded-xl px-4 py-4 text-left text-white hover:border-blue-400/50 transition-colors flex items-center justify-between backdrop-blur-sm"
                        onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                      >
                        <div className="flex items-center space-x-3">
                          {selectedPersona ? (
                            <>                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-sm">
                                {selectedPersona.attributes?.image_url ? (
                                  <img 
                                    src={selectedPersona.attributes.image_url} 
                                    alt={selectedPersona.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  getPersonaEmoji(selectedPersona.replica_type)
                                )}
                              </div>
                              <div>
                                <div className="font-semibold">{selectedPersona.name}</div>
                                <div className="text-sm text-white/60">{selectedPersona.replica_type}</div>
                              </div>
                            </>
                          ) : (
                            <span className="text-white/60">Choose a persona...</span>
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-white/60 transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
                      </button>
                        <AnimatePresence>
                        {showPersonaDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">{personas.map((persona) => (
                              <button
                                key={persona.id}
                                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 ${
                                  selectedPersona?.id === persona.id ? 'bg-blue-500/20 border-l-4 border-blue-500' : ''
                                }`}
                                onClick={() => {
                                  setSelectedPersona(persona);
                                  setShowPersonaDropdown(false);
                                }}
                              >                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                                    {persona.attributes?.image_url ? (
                                      <img 
                                        src={persona.attributes.image_url} 
                                        alt={persona.name}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      getPersonaEmoji(persona.replica_type)
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white truncate">{persona.name}</div>
                                    <div className="text-sm text-white/60 truncate">{persona.description}</div>
                                    <div className="text-xs text-blue-300 mt-1">{persona.replica_type}</div>
                                  </div>                                </button>
                              ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>                  {/* Selected Persona Details and Chat Button */}
                  {selectedPersona && (
                    <div className="space-y-8">
                      <div className="max-w-2xl mx-auto bg-slate-800/30 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-start space-x-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl border-2 border-white/20 flex-shrink-0">
                            {selectedPersona.attributes?.image_url ? (
                              <img 
                                src={selectedPersona.attributes.image_url} 
                                alt={selectedPersona.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              getPersonaEmoji(selectedPersona.replica_type)
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-2xl font-bold text-white">{selectedPersona.name}</h3>
                              <span className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                                {selectedPersona.replica_type}
                              </span>
                            </div>
                            <p className="text-white/70 text-base leading-relaxed mb-4">
                              {selectedPersona.description}
                            </p>
                            
                            {selectedPersona.attributes?.traits && selectedPersona.attributes.traits.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {selectedPersona.attributes.traits.map((trait: any, index: number) => (
                                  <span key={index} className="px-3 py-1 text-sm bg-white/10 text-white/80 rounded-lg border border-white/20">
                                    {typeof trait === 'string' ? trait : trait.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Chat and Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <button
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center space-x-3 font-semibold text-lg shadow-lg shadow-blue-500/25 flex-1 sm:flex-none"
                            onClick={() => openPersonaChat(selectedPersona)}
                          >
                            <MessageSquare className="h-6 w-6" />
                            <span>Start Conversation</span>
                          </button>
                          
                          <div className="flex gap-3">
                            <button
                              className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-2 border border-white/10"
                              onClick={() => {
                                toast({
                                  title: "Edit Persona",
                                  description: "Edit functionality coming soon!",
                                });
                              }}
                            >
                              <Edit className="h-5 w-5" />
                              <span>Edit</span>
                            </button>
                            
                            <button
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-2 border border-red-500/30"
                              onClick={() => handleDeletePersona(selectedPersona)}
                            >
                              <Trash2 className="h-5 w-5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Persona Services Section */}
                      <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/10">
                        <PersonaServices 
                          persona={selectedPersona} 
                          isOwner={true} 
                          onServicePurchased={(service) => {
                            toast({
                              title: "Service Purchased",
                              description: `Successfully purchased ${service.service_name}`,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}{/* Personas Overview Grid (Read-only) */}
                  <div className="mt-12">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">All Your Personas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {personas.map((persona) => (
                        <PersonaCard 
                          key={persona.id}
                          persona={persona}
                          isSelected={selectedPersona?.id === persona.id}
                          onClick={() => setSelectedPersona(persona)}
                          getPersonaEmoji={getPersonaEmoji}
                        />
                      ))}
                    </div>
                  </div>                </div>
              )}
              
              <div className="mt-8 text-center">
                <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center space-x-2 mx-auto">
                  <Users className="h-5 w-5" />
                  <span>Create New Persona</span>                </button>
              </div>
            </div>
          </div>        ) : activeTab === 'liveevents' ? (
          /* Live Events - Real Data */
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LiveEvents />
          </motion.div>        ) : activeTab === 'podcasts' ? (
          /* Podcasts Full Width View */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >            <div className="space-y-8">
              {/* Podcast List Section */}
              <div className="bg-black/40 rounded-2xl p-8 border border-white/10 backdrop-blur-xl">
                <PodcastList />
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'services' ? (
          /* Services Marketplace */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 rounded-2xl p-8 border border-white/10 backdrop-blur-xl">
              <ServicesMarketplace />
            </div>
          </motion.div>
        ) : activeTab === 'memorial' ? (
          /* Memorial Full Width View */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl p-8 border border-amber-500/30 backdrop-blur-xl min-h-[600px]">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Heart className="h-8 w-8 mr-4 text-amber-400" />
                Memorial Connections
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                  {
                    emoji: '👨‍👩‍👧‍👦',
                    title: 'Family Memories',
                    description: 'Connect with cherished family members and preserve their stories for future generations',
                    gradient: 'from-amber-500 to-orange-500',
                    bgGradient: 'from-amber-500/20 to-orange-500/20'
                  },
                  {
                    emoji: '🤝',
                    title: 'Dear Friends',
                    description: 'Reconnect with beloved friends and continue the conversations that mattered most',
                    gradient: 'from-rose-500 to-pink-500',
                    bgGradient: 'from-rose-500/20 to-pink-500/20'
                  },
                  {
                    emoji: '🌟',
                    title: 'Mentors & Guides',
                    description: 'Seek wisdom from those who shaped your journey and continue learning from their guidance',
                    gradient: 'from-blue-500 to-purple-500',
                    bgGradient: 'from-blue-500/20 to-purple-500/20'
                  }
                ].map((category, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-r ${category.bgGradient} rounded-xl p-6 border border-amber-500/30 backdrop-blur-sm hover:border-amber-500/50 transition-all duration-300 cursor-pointer group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="text-4xl mb-4 text-center"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {category.emoji}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-100 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-white/80 mb-6 leading-relaxed text-sm">
                      {category.description}
                    </p>
                    <motion.button
                      className={`w-full bg-gradient-to-r ${category.gradient} text-white py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Create Memorial Chat
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  💝
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">Connect with Cherished Memories</h3>
                <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                  Experience meaningful conversations with AI recreations of loved ones, preserving their essence and wisdom for generations to come.
                </p>
                <motion.button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Memorial Experience
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'entertainment' ? (
          /* Entertainment Hub */
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 rounded-3xl p-8 border border-purple-500/30 backdrop-blur-xl">
              <motion.div 
                className="text-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <motion.div
                    className="text-6xl mr-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    🎭
                  </motion.div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                    Virtual Entertainment Hub
                  </h2>
                </div>
                <p className="text-white/80 text-xl max-w-3xl mx-auto">
                  Immerse yourself in AI-powered entertainment experiences that blur the line between reality and imagination
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    emoji: '🎤',
                    title: 'Karaoke Night',
                    description: 'Sing along with AI backup vocals and harmonies',
                    gradient: 'from-pink-500 to-rose-500',
                    bgGradient: 'from-pink-500/20 to-rose-500/20',
                    participants: '234 singing now'
                  },
                  {
                    emoji: '🎸',
                    title: 'AI Band',
                    description: 'Create music collaboratively with AI musicians',
                    gradient: 'from-purple-500 to-violet-500',
                    bgGradient: 'from-purple-500/20 to-violet-500/20',
                    participants: '189 jamming'
                  },
                  {
                    emoji: '🎬',
                    title: 'Virtual Theater',
                    description: 'Participate in interactive AI-generated dramas',
                    gradient: 'from-blue-500 to-cyan-500',
                    bgGradient: 'from-blue-500/20 to-cyan-500/20',
                    participants: '67 performing'
                  },
                  {
                    emoji: '🎨',
                    title: 'Art Studio',
                    description: 'Collaborate with AI artists on digital masterpieces',
                    gradient: 'from-green-500 to-emerald-500',
                    bgGradient: 'from-green-500/20 to-emerald-500/20',
                    participants: '123 creating'
                  }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-r ${activity.bgGradient} rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 cursor-pointer group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="text-4xl mb-4 text-center"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activity.emoji}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-pink-100 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-white/80 mb-6 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="text-sm text-cyan-300 mb-6 font-medium">
                      {activity.participants}
                    </div>
                    <motion.button
                      className={`w-full bg-gradient-to-r ${activity.gradient} text-white py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg shadow-lg`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {index === 0 ? 'Join Session' : 
                       index === 1 ? 'Start Jamming' : 
                       index === 2 ? 'Audition Now' : 'Start Creating'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Stats Section */}
        <motion.div 
          className="mt-12 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {[
            { label: 'Active Users', value: '12.5K', icon: Users, color: 'text-cyan-400' },
            { label: 'Live Events', value: '127', icon: Radio, color: 'text-red-400' },
            { label: 'AI Personas', value: '1,847', icon: Brain, color: 'text-purple-400' },
            { label: 'Hours Streamed', value: '45.2K', icon: Clock, color: 'text-green-400' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>      {/* Floating Chat Overlay */}
      <AnimatePresence>
        {showChat && selectedPersona && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closePersonaChat()}
          >
            <motion.div
              className="w-full max-w-2xl h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                      {selectedPersona.attributes?.image_url ? (
                        <img 
                          src={selectedPersona.attributes.image_url} 
                          alt={selectedPersona.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        (() => {
                          switch (selectedPersona.replica_type?.toLowerCase()) {
                            case 'professional': return '💼';
                            case 'creative': return '🎨';
                            case 'personal': return '👤';
                            case 'historical': return '📜';
                            case 'celebrity': return '⭐';
                            default: return '🤖';
                          }
                        })()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedPersona.name}</h3>
                      <p className="text-white/80 text-sm">{selectedPersona.replica_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Online</span>
                    <motion.button
                      className="ml-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closePersonaChat}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Chat Content */}
              <div className="h-[calc(600px-80px)]">
                <PersonaChat 
                  persona={selectedPersona} 
                  onClose={closePersonaChat}
                />
              </div>
            </motion.div>
          </motion.div>
        )}      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && personaToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Delete Persona</h3>
                <p className="text-white/70 mb-2">
                  Are you sure you want to delete <strong>{personaToDelete.name}</strong>?
                </p>
                <p className="text-white/60 text-sm mb-6">
                  This action cannot be undone. All associated data, conversations, and content will be permanently removed.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <motion.button
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDeletePersona}
                  >
                    <span>Cancel</span>
                  </motion.button>
                  
                  <motion.button
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDeletePersona}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Persona</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
