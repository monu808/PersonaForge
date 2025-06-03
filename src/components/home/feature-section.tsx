import React from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  CpuIcon, 
  Fingerprint, 
  Layers, 
  Shield, 
  Sparkles 
} from "lucide-react";

const features = [
  {
    name: "Personality Customization",
    description:
      "Design personas with unique personality traits, from friendly and empathetic to analytical and professional.",
    icon: Brain,
  },
  {
    name: "Voice & Behavior Settings",
    description:
      "Customize voice characteristics and behavioral responses to create natural, consistent interactions.",
    icon: Sparkles,
  },
  {
    name: "Knowledge Integration",
    description:
      "Connect your personas to specialized knowledge bases and data sources for industry-specific expertise.",
    icon: CpuIcon,
  },
  {
    name: "Multi-platform Deployment",
    description:
      "Deploy your personas across websites, mobile apps, customer service platforms, and more.",
    icon: Layers,
  },
  {
    name: "Secure Development",
    description:
      "Enterprise-grade security with data encryption and privacy-first design principles.",
    icon: Shield,
  },
  {
    name: "Authentication & Verification",
    description:
      "Built-in authentication and verification systems to protect your personas and your users.",
    icon: Fingerprint,
  },
];

export function FeatureSection() {
  return (
    <div className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Powerful Capabilities
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to create exceptional AI personas
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our comprehensive platform provides all the tools to design, develop, and deploy sophisticated AI personas for any use case.
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