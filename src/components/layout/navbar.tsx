import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuitIcon, Menu, X, ChevronDown, LogOut, User, Settings, Bell, Film } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { getUserProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/context/auth-context';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      if (user) {
        const { data: profile } = await getUserProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      // Close menus
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      
      // Navigate to login page
      navigate('/auth/sign-in', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BrainCircuitIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PersonaForge</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Dashboard
            </Link>
            <Link
              to="/#features"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              Features
            </Link>
            <Link
              to="/about"
              className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors rounded-md"
            >
              About
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Authenticated user actions
              <>
                {/* Notifications */}
                <button className="hidden md:flex text-gray-600 hover:text-primary-600 p-2 rounded-full transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

                {/* User menu */}
                <div className="relative hidden md:block">
                  <div>
                    <button
                      type="button"
                      className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={toggleUserMenu}
                    >
                      <Avatar>
                        <AvatarImage 
                          src={userProfile?.avatar_url} 
                          alt={userProfile?.full_name || 'User'} 
                        />
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {userProfile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-700 font-medium hidden lg:block">{userProfile?.full_name}</span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  {/* User dropdown menu */}
                  <div className={`absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-opacity duration-150 ${isUserMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Your Profile
                    </Link>
                    <Link
                      to="/dashboard/videos"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Film className="mr-2 h-4 w-4" />
                      Videos
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
                </div>
              </>
            ) : (
              // Non-authenticated user actions (sign in/up buttons)
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="outline" asChild>
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/sign-up">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-1.5 rounded-md text-gray-600 hover:text-primary-600"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6\" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6\" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel with smooth transition */}
      <div className={`md:hidden transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard/videos"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Videos
            </Link>
            <Link
              to="/#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            
            {!user ? (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  to="/auth/sign-in"
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/sign-up"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md py-2 px-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}