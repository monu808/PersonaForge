import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  Heart,
  Radio,
  Headphones,
  MessageSquare,
  Users,
  Play,
  Star,
  Clock,
  Music,
  Brain,
  Crown,
  ChevronDown
} from 'lucide-react';
import { PersonaChat } from '@/components/chat/PersonaChat';
import { getPersonas } from '@/lib/api/personas';
import { toast } from '@/components/ui/use-toast';

export default function Neurovia() {
  const { user } = useAuth();  const [activeTab, setActiveTab] = useState('liveevents');
  const [personas, setPersonas] = useState<any[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);  useEffect(() => {
    // Initialize sync service and load data
    if (user) {
      initializeNeurovia();
    }
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPersonaDropdown(false);
      }
    };

    if (showPersonaDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPersonaDropdown]);
  const initializeNeurovia = async () => {
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
  };

  const loadPersonas = async () => {
    try {
      setPersonasLoading(true);
      const { data } = await getPersonas();
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setPersonasLoading(false);
    }
  };

  const openPersonaChat = (persona: any) => {
    setSelectedPersona(persona);
    setShowChat(true);
  };

  const closePersonaChat = () => {
    setShowChat(false);
    setSelectedPersona(null);
  };

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
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      {/* Enhanced Navigation Bar */}
      <nav className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <Brain className="h-6 w-6 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Neurovia
                </h1>
                <p className="text-white/60 text-sm">Neural Entertainment Platform</p>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: 'Live Events', icon: Radio, active: activeTab === 'liveevents' },
                { name: 'Podcasts', icon: Headphones, active: activeTab === 'podcasts' },
                { name: 'Personas', icon: Users, active: activeTab === 'personas' },
                { name: 'Memorial', icon: Heart, active: activeTab === 'memorial' },
                { name: 'Entertainment', icon: Music, active: activeTab === 'entertainment' }
              ].map((item) => (
                <motion.button
                  key={item.name}
                  className={`flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${
                    item.active ? 'text-cyan-400' : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(item.name.toLowerCase().replace(' ', '').replace('events', 'liveevents'))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.active && (
                    <motion.div
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.button
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown className="h-4 w-4" />
                <span>Premium</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 relative z-10">
        
        {/* Enhanced Content Grid - Conditional Tab-based Rendering */}        {activeTab === 'personas' ? (
          /* Dropdown-based Personas Selection with Single Chat Button */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Users className="h-8 w-8 mr-4 text-blue-400" />
                Your AI Personas ({personas.length})
              </h2>
              
              {personasLoading ? (
                <div className="text-center py-20">
                  <motion.div
                    className="text-6xl mb-6"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🔄
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">Loading Your Personas...</h3>
                  <p className="text-white/80 text-lg max-w-2xl mx-auto">
                    Preparing your AI companions for conversation.
                  </p>
                </div>
              ) : personas.length === 0 ? (
                <div className="text-center py-20">
                  <motion.div
                    className="text-6xl mb-6"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🤖
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">No Personas Yet</h3>
                  <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                    Create your first AI persona to start having meaningful conversations powered by advanced AI technology.
                  </p>
                  <motion.button
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Your First Persona
                  </motion.button>
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
                            <>
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-sm">
                                {selectedPersona.attributes?.image_url ? (
                                  <img 
                                    src={selectedPersona.attributes.image_url} 
                                    alt={selectedPersona.name}
                                    className="w-full h-full object-cover rounded-lg"
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
                          <motion.div
                            className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {personas.map((persona) => {
                              const getPersonaEmoji = (type: string) => {
                                switch (type?.toLowerCase()) {
                                  case 'professional': return '💼';
                                  case 'creative': return '🎨';
                                  case 'personal': return '👤';
                                  case 'historical': return '📜';
                                  case 'celebrity': return '⭐';
                                  default: return '🤖';
                                }
                              };

                              return (
                                <motion.button
                                  key={persona.id}
                                  className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 ${
                                    selectedPersona?.id === persona.id ? 'bg-blue-500/20 border-l-4 border-blue-500' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedPersona(persona);
                                    setShowPersonaDropdown(false);
                                  }}
                                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
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
                                  </div>
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Selected Persona Details and Chat Button */}
                  {selectedPersona && (
                    <motion.div
                      className="max-w-2xl mx-auto bg-slate-800/30 rounded-2xl p-6 border border-white/10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl border-2 border-white/20 flex-shrink-0">
                          {selectedPersona.attributes?.image_url ? (
                            <img 
                              src={selectedPersona.attributes.image_url} 
                              alt={selectedPersona.name}
                              className="w-full h-full object-cover rounded-2xl"
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
                      
                      {/* Single Chat Button */}
                      <div className="text-center">
                        <motion.button
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 flex items-center space-x-3 font-semibold text-lg mx-auto shadow-lg shadow-blue-500/25"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openPersonaChat(selectedPersona)}
                        >
                          <MessageSquare className="h-6 w-6" />
                          <span>Start Conversation with {selectedPersona.name}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Personas Overview Grid (Read-only) */}
                  <div className="mt-12">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">All Your Personas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {personas.map((persona, index) => {
                        const getPersonaEmoji = (type: string) => {
                          switch (type?.toLowerCase()) {
                            case 'professional': return '💼';
                            case 'creative': return '🎨';
                            case 'personal': return '👤';
                            case 'historical': return '📜';
                            case 'celebrity': return '⭐';
                            default: return '🤖';
                          }
                        };

                        return (
                          <motion.div
                            key={persona.id}
                            className={`
                              bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 cursor-pointer
                              ${selectedPersona?.id === persona.id ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/20'}
                            `}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedPersona(persona)}
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <motion.button
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center space-x-2 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Users className="h-5 w-5" />
                  <span>Create New Persona</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'liveevents' ? (
          /* Live Events Only */
          <motion.div 
            className="w-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Radio className="h-8 w-8 mr-4 text-red-400" />
                Live Events
              </h2>

              {/* Featured Live Event - Enhanced */}
              <motion.div 
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl p-8 mb-8 border border-red-500/30 backdrop-blur-sm"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="aspect-video bg-gradient-to-br from-black/70 to-purple-900/50 rounded-xl mb-6 relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="text-8xl">🎼</div>
                  </motion.div>
                  
                  {/* Live indicators */}
                  <motion.div 
                    className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center"
                    animate={{ boxShadow: ["0 0 0 rgba(239,68,68,0.4)", "0 0 15px rgba(239,68,68,0.4)", "0 0 0 rgba(239,68,68,0.4)"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full mr-2"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    LIVE
                  </motion.div>
                  
                  <div className="absolute top-6 right-6 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                    <motion.span
                      key={Math.floor(Math.random() * 1000)}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      2,847 viewers
                    </motion.span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">AI Concert: Virtual Symphony</h3>
                <p className="text-white/80 mb-6 text-lg">
                  Experience an unprecedented AI-generated symphonic performance with virtual musicians playing classical and modern compositions
                </p>
                
                <div className="flex gap-4">
                  <motion.button
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Join Live Event
                  </motion.button>
                  <motion.button
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-xl hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Heart className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Upcoming Events - Enhanced */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-cyan-400" />
                  Upcoming Events
                </h3>
                {[
                  { title: "Meditation with AI Guru Deepak", time: "In 30 mins", viewers: "1,247 waiting", category: "Wellness", color: "from-green-500 to-emerald-500" },
                  { title: "Cooking Masterclass with Chef Antoine", time: "In 2 hours", viewers: "856 waiting", category: "Culinary", color: "from-orange-500 to-red-500" },
                  { title: "Tech Talk: Future of Consciousness", time: "Tomorrow 8PM", viewers: "3,429 interested", category: "Technology", color: "from-blue-500 to-purple-500" }
                ].map((event, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/10 backdrop-blur-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`w-3 h-3 bg-gradient-to-r ${event.color} rounded-full mr-3`} />
                          <span className="text-white/60 text-sm font-medium">{event.category}</span>
                        </div>
                        <h4 className="text-white font-semibold text-lg mb-1">{event.title}</h4>
                        <p className="text-white/70">{event.time}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-400 font-medium">{event.viewers}</div>
                        <motion.button
                          className="mt-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Remind Me
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'podcasts' ? (
          /* Podcasts Full Width View */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Headphones className="h-8 w-8 mr-4 text-purple-400" />
                Featured Podcasts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "AI Consciousness Talks", host: "Dr. Sarah Chen", episodes: 42, rating: 4.9, color: "from-purple-500 to-pink-500", listeners: "125K" },
                  { title: "Future Humanity", host: "Marcus Tech", episodes: 38, rating: 4.8, color: "from-blue-500 to-cyan-500", listeners: "89K" },
                  { title: "Neural Stories", host: "AI Narrator", episodes: 156, rating: 4.7, color: "from-green-500 to-emerald-500", listeners: "203K" },
                  { title: "Digital Philosophy", host: "Prof. Alice Walker", episodes: 67, rating: 4.6, color: "from-orange-500 to-red-500", listeners: "74K" },
                  { title: "Mind Upload Chronicles", host: "Dr. Ray Tech", episodes: 89, rating: 4.8, color: "from-indigo-500 to-purple-500", listeners: "156K" },
                  { title: "Quantum Conversations", host: "AI Research Team", episodes: 134, rating: 4.9, color: "from-teal-500 to-cyan-500", listeners: "234K" }
                ].map((podcast, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-r ${podcast.color}/20 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 cursor-pointer`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{podcast.title}</h3>
                        <p className="text-white/60 text-sm">{podcast.host}</p>
                      </div>
                      <motion.div
                        className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Play className="h-5 w-5 text-white" />
                      </motion.div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-white/70">{podcast.episodes} episodes</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-white/80">{podcast.rating}</span>
                        </div>
                      </div>
                      <span className="text-cyan-400 font-medium">{podcast.listeners}</span>
                    </div>
                    <motion.button
                      className={`w-full bg-gradient-to-r ${podcast.color} text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-medium`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Listen Now
                    </motion.button>
                  </motion.div>
                ))}
              </div>
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
        )}
      </AnimatePresence>
    </div>
  );
}
