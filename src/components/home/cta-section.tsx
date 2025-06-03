import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <div className="relative overflow-hidden bg-primary-600 py-16 sm:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-0 top-0 h-full w-full"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="pattern-circles"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
              patternTransform="scale(1.5)"
            >
              <circle cx="10" cy="10" r="1.5" fill="rgba(255, 255, 255, 0.1)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern-circles)" />
        </svg>
      </div>

      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Ready to create your own AI persona?
            </motion.h2>
            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Join thousands of creators, businesses, and professionals who are building
              the next generation of AI experiences with PersonaForge.
            </motion.p>
            <motion.div
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-white text-primary-700 hover:bg-primary-50"
                asChild
              >
                <Link to="/create">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link
                to="/templates"
                className="text-sm font-semibold leading-6 text-white hover:text-primary-100"
              >
                Explore templates <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}