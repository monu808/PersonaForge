import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { PERSONA_TEMPLATES } from "@/lib/constants";

export function TemplateSection() {
  return (
    <div className="py-24 bg-gray-50 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Ready-to-Use Templates
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Start with pre-built persona templates
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose from our library of professionally designed persona templates and customize them to fit your specific needs.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {PERSONA_TEMPLATES.map((template, index) => (
            <motion.article
              key={template.id}
              className="flex flex-col items-start bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative w-full">
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="aspect-[16/9] w-full object-cover sm:aspect-[3/2]"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 text-xs font-medium">
                  <Star className="h-3.5 w-3.5 text-accent-500" />
                  <span>{template.popularity}% Rating</span>
                </div>
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs">
                  <span className="capitalize relative z-10 rounded-full bg-primary-50 px-3 py-1.5 font-medium text-primary-600">
                    {template.category}
                  </span>
                  <span className="text-gray-500">
                    {template.traits.length} traits
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-primary-600">
                    <Link to={`/templates/${template.id}`}>
                      <span className="absolute inset-0" />
                      {template.name}
                    </Link>
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {template.description}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/templates/${template.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Use this template
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/templates"
            className="inline-flex items-center text-base font-medium text-primary-600 hover:text-primary-700"
          >
            View all templates
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}