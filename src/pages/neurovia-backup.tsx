import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Heart,
  Radio,
  Headphones,
  MessageSquare,
  Calendar,
  Users,
  Play,
  Star,
  Clock,
  Music,
  Zap,
  Brain,
  Crown
} from 'lucide-react';
import { PersonaChat } from '@/components/chat/PersonaChat';
import { ActivePersonas } from '@/components/persona/ActivePersonas';
import { syncService, syncEvents } from '@/lib/api/sync-service';
import { getPersonas } from '@/lib/api/personas';
import { toast } from '@/components/ui/use-toast';

export default function Neurovia() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('liveevents');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [voiceContent, setVoiceContent] = useState<any[]>([]);
  const [videoContent, setVideoContent] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize sync service and load data
  useEffect(() => {
    if (user) {
      initializeNeurovia();
      setupSyncListeners();
      
      // Start sync service
      syncService.startSync();
      
      return () => {
        syncService.stopSync();
        cleanupSyncListeners();
      };
    }
  }, [user]);

  const initializeNeurovia = async () => {
    try {
      // Load initial data
      await loadPersonas();
      await syncService.syncAllData();
    } catch (error) {
      console.error('Error initializing Neurovia:', error);
    }
  };

  const loadPersonas = async () => {
    try {
      const { data, error } = await getPersonas();
      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  const setupSyncListeners = () => {
    // Listen for persona updates
    syncEvents.on('personas:updated', (updatedPersonas: any) => {
      setPersonas(updatedPersonas || []);
    });

    // Listen for voice content updates
    syncEvents.on('voices:updated', (updatedVoices: any) => {
      setVoiceContent(updatedVoices || []);
    });

    // Listen for video content updates
    syncEvents.on('videos:updated', (updatedVideos: any) => {
      setVideoContent(updatedVideos || []);
    });

    // Listen for activity updates
    syncEvents.on('activities:updated', (updatedActivities: any) => {
      setActivities(updatedActivities || []);
    });

    // Listen for Coruscant actions
    syncEvents.on('neurovia:coruscant:action', (actionData: any) => {
      toast({
        title: "Coruscant Action",
        description: `Action: ${actionData.action}`,
      });
    });
  };

  const cleanupSyncListeners = () => {
    syncEvents.off('personas:updated', () => {});
    syncEvents.off('voices:updated', () => {});
    syncEvents.off('videos:updated', () => {});
    syncEvents.off('activities:updated', () => {});
    syncEvents.off('neurovia:coruscant:action', () => {});
  };
  const closePersonaChat = () => {
    setShowChat(false);
    setSelectedPersona(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center max-w-md"
        >
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-white mb-4">Neurovia</h1>
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
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
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
                  whileTap={{ scale: 0.95 }}
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
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Neurovia
                </div>
                <div className="text-white/50 text-xs">Neural Content Platform</div>
              </div>
            </motion.div>
              <div className="hidden md:flex items-center space-x-8">              {[
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
                  }`}                  onClick={() => setActiveTab(item.name.toLowerCase().replace(' ', '').replace('events', 'liveevents'))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.active && (
                    <motion.div
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      layoutId="activeTab"
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
              <div className="text-white/60 text-sm">
                {currentTime.toLocaleTimeString()}
              </div>
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
      </nav>      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 relative z-10">
        
        {/* Enhanced Memorial Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-3xl p-8 border border-amber-500/30 backdrop-blur-xl overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20"
                animate={{
                  background: [
                    "linear-gradient(45deg, rgba(245,158,11,0.2) 0%, rgba(251,146,60,0.2) 100%)",
                    "linear-gradient(45deg, rgba(251,146,60,0.2) 0%, rgba(239,68,68,0.2) 100%)",
                    "linear-gradient(45deg, rgba(245,158,11,0.2) 0%, rgba(251,146,60,0.2) 100%)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
            
            <div className="relative z-10">
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <motion.div
                    className="text-5xl mr-3"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💝
                  </motion.div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                    Eternal Connections
                  </h2>
                </div>
                <p className="text-amber-100 text-xl max-w-2xl mx-auto">
                  Reconnect with loved ones who are no longer with us through our advanced AI technology
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    emoji: '👨‍👩‍👧‍👦',
                    title: 'Talk to Parents',
                    description: 'Have heartfelt conversations with your late parents using AI recreation of their personality and memories',
                    gradient: 'from-amber-500 to-orange-500',
                    bgGradient: 'from-amber-500/20 to-orange-500/20'
                  },
                  {
                    emoji: '💫',
                    title: 'Beloved Friends',
                    description: 'Reconnect with friends who passed away and share precious memories together once again',
                    gradient: 'from-orange-500 to-red-500',
                    bgGradient: 'from-orange-500/20 to-red-500/20'
                  },
                  {
                    emoji: '🌟',
                    title: 'Create Memorial',
                    description: 'Build an AI persona of someone special using their photos, videos, and cherished memories',
                    gradient: 'from-red-500 to-pink-500',
                    bgGradient: 'from-red-500/20 to-pink-500/20'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-br ${item.bgGradient} rounded-2xl p-8 border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 cursor-pointer group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(245,158,11,0.2)"
                    }}
                  >
                    <motion.div 
                      className="text-6xl mb-6 text-center"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.emoji}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-amber-100 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-center mb-6 leading-relaxed">
                      {item.description}
                    </p>
                    <motion.button
                      className={`w-full bg-gradient-to-r ${item.gradient} text-white py-4 rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg shadow-lg`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {index === 0 ? 'Start Conversation' : index === 1 ? 'Connect Now' : 'Create Memorial'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>        {/* Enhanced Content Grid - Conditional Tab-based Rendering */}
        {activeTab === 'personas' ? (
          /* Active Personas Full Width View */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-lg h-[calc(100vh-300px)] min-h-[650px]">
              <ActivePersonas className="h-full" />
            </div>
          </motion.div>
        ) : activeTab === 'liveevents' || activeTab === 'home' ? (
          /* Default Home Tab Content with Grid Layout */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Live Events Section - Enhanced */}
            <motion.div 
              className="xl:col-span-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <motion.div
                    className="w-4 h-4 bg-red-500 rounded-full mr-4"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  Live Events
                </h2>
                <motion.div
                  className="bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2"
                  animate={{ boxShadow: ["0 0 0 rgba(239,68,68,0.4)", "0 0 20px rgba(239,68,68,0.4)", "0 0 0 rgba(239,68,68,0.4)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-red-400 text-sm font-bold">3 LIVE NOW</span>
                </motion.div>
              </div>
              
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
          </motion.div>          {/* Sidebar - Enhanced */}
          <motion.div 
            className="xl:col-span-4 space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            
            {/* Podcasts Section - Enhanced */}
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Headphones className="h-6 w-6 mr-3 text-purple-400" />
                Featured Podcasts
              </h2>
              <div className="space-y-4">
                {[
                  { title: "AI Consciousness Talks", host: "Dr. Sarah Chen", episodes: 42, rating: 4.9, color: "from-purple-500 to-pink-500", listeners: "125K" },
                  { title: "Future Humanity", host: "Marcus Tech", episodes: 38, rating: 4.8, color: "from-blue-500 to-cyan-500", listeners: "89K" },
                  { title: "Neural Stories", host: "AI Narrator", episodes: 156, rating: 4.7, color: "from-green-500 to-emerald-500", listeners: "203K" }
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
                    <div className="flex items-center justify-between text-sm">
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
                      className={`w-full mt-4 bg-gradient-to-r ${podcast.color} text-white py-2 rounded-lg hover:opacity-90 transition-opacity font-medium`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Listen Now
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions - Enhanced */}
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Zap className="h-5 w-5 mr-3 text-yellow-400" />
                Quick Actions
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Music, label: "Join Singing Session", gradient: "from-green-500 to-emerald-500", emoji: "🎵" },
                  { icon: MessageSquare, label: "Chat with Persona", gradient: "from-blue-500 to-cyan-500", emoji: "💬" },
                  { icon: Calendar, label: "Browse Events", gradient: "from-pink-500 to-rose-500", emoji: "🎪" },
                  { icon: Heart, label: "Memorial Chat", gradient: "from-amber-500 to-orange-500", emoji: "💝" }
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    className={`w-full bg-gradient-to-r ${action.gradient} text-white py-4 rounded-xl hover:opacity-90 transition-all duration-300 flex items-center justify-center font-semibold group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">{action.emoji}</span>
                    <action.icon className="h-5 w-5 mr-2" />
                    {action.label}
                  </motion.button>                ))}
              </div>
            </div>          </motion.div>
          </div>
        ) : activeTab === 'podcasts' ? (
          /* Podcasts Full Width View */
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-black/40 rounded-3xl p-8 border border-white/10 backdrop-blur-xl min-h-[600px]">
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Headphones className="h-8 w-8 mr-4 text-purple-400" />
                Featured Podcasts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "AI Consciousness Talks", host: "Dr. Sarah Chen", episodes: 42, rating: 4.9, color: "from-purple-500 to-pink-500", listeners: "125K" },
                  { title: "Future Humanity", host: "Marcus Tech", episodes: 38, rating: 4.8, color: "from-blue-500 to-cyan-500", listeners: "89K" },
                  { title: "Neural Stories", host: "AI Narrator", episodes: 156, rating: 4.7, color: "from-green-500 to-emerald-500", listeners: "203K" },
                  { title: "Digital Dreams", host: "Luna AI", episodes: 67, rating: 4.9, color: "from-pink-500 to-rose-500", listeners: "178K" },
                  { title: "Tech Futures", host: "Alex Core", episodes: 89, rating: 4.6, color: "from-orange-500 to-red-500", listeners: "92K" },
                  { title: "Mind Merge", host: "Dr. Neural", episodes: 134, rating: 4.8, color: "from-indigo-500 to-purple-500", listeners: "156K" }
                ].map((podcast, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-r ${podcast.color}/20 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 cursor-pointer`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">{podcast.title}</h3>
                        <p className="text-white/60">{podcast.host}</p>
                      </div>
                      <motion.div
                        className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Play className="h-6 w-6 text-white" />
                      </motion.div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center space-x-4">
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
              <div className="text-center py-20">
                <motion.div
                  className="text-8xl mb-6"
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
                  Create Memorial Chat
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}{/* Enhanced Entertainment Hub */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl p-10 border border-pink-500/30 backdrop-blur-xl relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl"
                animate={{ 
                  x: [0, 100, 0],
                  y: [0, 50, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 10, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-3xl"
                animate={{ 
                  x: [0, -100, 0],
                  y: [0, -50, 0],
                  scale: [1.2, 1, 1.2]
                }}
                transition={{ duration: 12, repeat: Infinity }}
              />
            </div>
            
            <div className="relative z-10">
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
                    emoji: '🎭',
                    title: 'Drama Club',
                    description: 'Act in immersive scenes with AI characters',
                    gradient: 'from-indigo-500 to-blue-500',
                    bgGradient: 'from-indigo-500/20 to-blue-500/20',
                    participants: '76 performing'
                  },
                  {
                    emoji: '🎨',
                    title: 'Art Gallery',
                    description: 'Create stunning visual art with AI assistance',
                    gradient: 'from-cyan-500 to-teal-500',
                    bgGradient: 'from-cyan-500/20 to-teal-500/20',
                    participants: '312 creating'
                  }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className={`bg-gradient-to-br ${activity.bgGradient} rounded-2xl p-8 text-center backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                    }}
                  >
                    <motion.div 
                      className="text-6xl mb-6"
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
          </div>
        </motion.div>        {/* Stats Section */}
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
          ))}        </motion.div>
      </div>

      {/* Floating Chat Overlay */}
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
              className="w-full max-w-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PersonaChat 
                persona={selectedPersona} 
                onClose={closePersonaChat}
              />
            </motion.div>          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
