import React from "react";
import { Link } from "react-router-dom";
import { BrainCircuitIcon, GithubIcon, TwitterIcon, InstagramIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <Link to="/" className="flex items-center">
                <BrainCircuitIcon className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">PersonaForge</span>
              </Link>
              <p className="mt-4 text-base text-gray-600 max-w-md">
                Create, customize, and monetize AI personas with PersonaForge - the all-in-one platform for AI persona development.
              </p>
              <div className="mt-6 flex space-x-4">
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary-600 transition"
                >
                  <TwitterIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary-600 transition"
                >
                  <GithubIcon className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary-600 transition"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Templates
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Marketplace
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-gray-500">
              &copy; {new Date().getFullYear()} PersonaForge. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 transition">
                Privacy Policy
              </Link>
              <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 transition">
                Terms of Service
              </Link>
              <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 transition">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}