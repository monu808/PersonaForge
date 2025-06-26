import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white z-0" />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div 
          className="absolute top-20 right-[10%] h-24 w-24 rounded-full bg-primary-300/20 blur-xl"
          animate={{ y: [0, 15, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-[15%] h-32 w-32 rounded-full bg-secondary-300/30 blur-xl"
          animate={{ y: [0, -20, 0], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-40 left-[30%] h-16 w-16 rounded-full bg-accent-300/20 blur-xl"
          animate={{ y: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center space-x-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20 mb-8">
                  <Sparkles className="h-4 w-4" />
                  <span>Introducing PersonaForge</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="block">Comprehensive AI</span>
                <span className="block mt-2 bg-gradient-to-r from-primary-600 via-purple-500 to-secondary-600 bg-clip-text text-transparent">
                  Persona Platform
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 max-w-xl text-lg text-gray-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Create, manage, and interact with AI personas through video generation, voice synthesis, 
                and real-time conversations. The all-in-one platform for professional AI persona development.
              </motion.p>

              {/* Special Neurovia Highlight */}
              <motion.div
                className="mt-8 p-4 rounded-xl border-2 bg-gradient-to-r from-[#48E59E]/10 to-[#FF7A45]/10"
                style={{ borderColor: '#48E59E' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#48E59E' }}
                  >
                    <Sparkles className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#121212' }}>
                      Neurovia
                    </h3>
                    <p className="text-sm text-gray-600">
                      AI persona marketplace - discover, explore, and interact with AI personas from creators worldwide
                    </p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-black font-semibold hover:opacity-90 transition-all transform hover:scale-105"
                  style={{ backgroundColor: '#48E59E' }}
                  asChild
                >
                  <Link to="/neurovia">
                    Enter Neurovia ⚡
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                className="mt-6 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button size="lg" asChild>
                  <Link to="/create">
                    Create Your Persona <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/templates">
                    Explore Templates
                  </Link>
                </Button>
              </motion.div>
            </div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.pexels.com/photos/8369520/pexels-photo-8369520.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="AI Persona Creation"
                  className="w-full h-auto object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent rounded-2xl"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-semibold text-white">
                    Professional Assistant Persona
                  </h3>
                  <p className="mt-2 text-white/80">
                    Reliable, responsive, and knowledgeable AI assistant for business tasks
                  </p>
                </div>
              </div>

              {/* Floating feature cards */}
              <motion.div 
                className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Customizable</p>
                  <p className="text-xs text-gray-500">50+ personality traits</p>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Multi-lingual</p>
                  <p className="text-xs text-gray-500">20+ languages</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}