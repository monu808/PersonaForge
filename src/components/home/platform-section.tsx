import { motion } from "framer-motion";
import { ArrowRight, Users, ShoppingBag } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export function PlatformSection() {
  return (
    <div className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Dual Platform Experience
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Two Powerful Platforms, One Ecosystem
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            PersonaForge consists of two specialized platforms designed to serve creators and users seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Coruscant */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Coruscant</h3>
                  <p className="text-blue-600 font-medium">Creator Dashboard</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                The main control center for creators. Coruscant serves as your comprehensive dashboard 
                where you create, manage, and customize your AI personas. Build your digital replicas, 
                generate content, and control all aspects of your AI creations.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Create and manage AI personas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Generate videos and voice content</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Analytics and performance tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Subscription and billing management</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link to="/coruscant">
                  Enter Coruscant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Neurovia */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#48E59E20' }}
                >
                  <ShoppingBag className="h-6 w-6" style={{ color: '#48E59E' }} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Neurovia</h3>
                  <p className="font-medium" style={{ color: '#48E59E' }}>AI Marketplace</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                The public marketplace where all AI personas and products are showcased. Users can 
                discover, interact with, and experience AI personas created by the community. 
                A vibrant ecosystem for AI interactions and experiences.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#48E59E' }}></div>
                  <span className="text-sm text-gray-700">Discover AI personas and products</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#48E59E' }}></div>
                  <span className="text-sm text-gray-700">Interactive AI experiences</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#48E59E' }}></div>
                  <span className="text-sm text-gray-700">Live events and podcasts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#48E59E' }}></div>
                  <span className="text-sm text-gray-700">Neural interaction experiences</span>
                </div>
              </div>

              <Button 
                asChild 
                className="w-full text-black font-semibold hover:opacity-90"
                style={{ backgroundColor: '#48E59E' }}
              >
                <Link to="/neurovia">
                  Explore Neurovia ⚡
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Connection Visual */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-6 py-3 shadow-lg border">
            <span className="text-sm font-medium text-gray-700">Create in</span>
            <span className="font-bold text-blue-600">Coruscant</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Showcase in</span>
            <span className="font-bold" style={{ color: '#48E59E' }}>Neurovia</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
