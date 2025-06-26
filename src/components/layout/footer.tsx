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
                The comprehensive AI-powered platform for creating, managing, and deploying AI personas 
                with video generation, voice synthesis, and real-time conversation capabilities.
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
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Platform</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/tavus-features" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Video Generation
                  </Link>
                </li>
                <li>
                  <Link to="/elevenlabs-features" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Voice Synthesis
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Create Persona
                  </Link>
                </li>
                <li>
                  <Link to="/coruscant" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Features</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/coruscant" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Coruscant
                  </Link>
                </li>
                <li>
                  <Link to="/neurovia" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Neurovia
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/integration-test" className="text-base text-gray-600 hover:text-primary-600 transition">
                    API Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/about" className="text-base text-gray-600 hover:text-primary-600 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/system-status" className="text-base text-gray-600 hover:text-primary-600 transition">
                    System Status
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-base text-gray-600 hover:text-primary-600 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-base text-gray-600 hover:text-primary-600 transition">
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