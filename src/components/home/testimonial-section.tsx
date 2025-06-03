import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    content:
      "PersonaForge has transformed how we handle customer support. Our AI personas provide consistent, personalized assistance 24/7.",
    author: {
      name: "Sarah Johnson",
      role: "Customer Experience Director",
      company: "TechNova Solutions",
      imageUrl: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  },
  {
    content:
      "The level of customization available is incredible. We've created specialized medical advisors that feel genuinely human in their interactions.",
    author: {
      name: "Dr. Michael Chen",
      role: "Chief Innovation Officer",
      company: "HealthLink Technologies",
      imageUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  },
  {
    content:
      "As a content creator, PersonaForge has given me a new way to engage with my audience. My personal AI assistant reflects my personality perfectly.",
    author: {
      name: "Alex Rivera",
      role: "Digital Content Creator",
      company: "CreativeMind Studios",
      imageUrl: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  },
];

export function TestimonialSection() {
  return (
    <div className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Testimonials
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What our customers are saying
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.figure
              key={index}
              className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Quote className="h-8 w-8 text-primary-300" />
              <blockquote className="mt-4 text-base font-medium leading-7 text-gray-900">
                <p>"{testimonial.content}"</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <img
                  className="h-12 w-12 rounded-full bg-gray-50 object-cover"
                  src={testimonial.author.imageUrl}
                  alt={testimonial.author.name}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.author.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.author.role}, {testimonial.author.company}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </div>
  );
}