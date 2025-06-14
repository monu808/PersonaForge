import React from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, Sparkles } from 'lucide-react';
import { ActivePersonas } from '@/components/persona/ActivePersonas';

export default function PersonasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Your AI Personas
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interact with your custom AI personas powered by Google Gemini. 
            Each persona has unique traits, knowledge, and personality.
          </p>
        </motion.div>

        {/* Features Banner */}
        <motion.div
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Google Gemini Powered</h3>
                <p className="text-sm text-muted-foreground">Advanced AI conversations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Contextual Responses</h3>
                <p className="text-sm text-muted-foreground">Persona-aware interactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Real-time Chat</h3>
                <p className="text-sm text-muted-foreground">Instant conversations</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Personas Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ActivePersonas />
        </motion.div>
      </div>
    </div>
  );
}
