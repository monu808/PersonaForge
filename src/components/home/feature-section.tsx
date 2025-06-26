import { motion } from "framer-motion";
import { 
  Video, 
  Mic, 
  MessageSquare, 
  Users, 
  CreditCard, 
  RefreshCw
} from "lucide-react";

const features = [
  {
    name: "AI Video Generation",
    description:
      "Create stunning videos with digital replicas using Tavus integration. Record training videos and generate content with AI-powered avatars.",
    icon: Video,
  },
  {
    name: "Voice Synthesis & Cloning",
    description:
      "Advanced text-to-speech and voice cloning with ElevenLabs. Create custom voices, convert speech-to-speech, and generate singing voices.",
    icon: Mic,
  },
  {
    name: "Real-time AI Conversations",
    description:
      "Engage in natural conversations with AI personas powered by Google Gemini. Context-aware responses based on personality traits.",
    icon: MessageSquare,
  },
  {
    name: "Persona Management",
    description:
      "Comprehensive persona builder with visual interface, personality traits, voice configuration, and behavioral customization.",
    icon: Users,
  },
  {
    name: "Subscription & Billing",
    description:
      "Integrated Stripe payment processing with tiered plans, usage-based billing, and RevenueCat analytics for cross-platform insights.",
    icon: CreditCard,
  },
  {
    name: "Real-time Synchronization",
    description:
      "Cross-platform data sync between Coruscant and Neurovia with live activity tracking and event-driven architecture.",
    icon: RefreshCw,
  },
];

export function FeatureSection() {
  return (
    <div className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Complete AI Platform
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for AI persona development
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From video generation and voice synthesis to real-time conversations and subscription management - 
            PersonaForge provides the complete toolkit for professional AI persona creation.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}