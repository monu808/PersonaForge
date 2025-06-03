import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BrainCircuitIcon, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User,
  Settings,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NAV_ITEMS } from "@/lib/constants";
import { signOut } from "@/lib/auth";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      // Close menus
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      
      // Navigate to login page
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userName = "Narendra Singh Chouhan";
  const userInitials = "NSC";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BrainCircuitIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PersonaForge</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-600 hover:text-primary-600 px-2 py-1 text-sm font-medium transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="hidden md:flex text-gray-600 hover:text-primary-600 p-1.5 rounded-full">
              <Bell className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative hidden md:block">
              <div>
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <Avatar>
                    <AvatarImage src="https://images.pexels.com/photos/8090137/pexels-photo-8090137.jpeg?auto=compress&cs=tinysrgb&w=400" alt={userName} />
                    <AvatarFallback className="bg-primary-100 text-primary-700">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-gray-700 font-medium hidden lg:block">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-1.5 rounded-md text-gray-600 hover:text-primary-600"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                  {item.title}
                </div>
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}