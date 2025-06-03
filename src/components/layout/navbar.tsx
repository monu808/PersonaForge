@@ .. @@
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
   const navigate = useNavigate();
-
   const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
   const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
 
   const handleSignOut = async () => {
     try {
       const { error } = await signOut();
       if (error) throw error;
-      
-      // Close menus
       setIsMobileMenuOpen(false);
       setIsUserMenuOpen(false);
-      
-      // Navigate to login page
-      navigate('/auth/login', { replace: true });
+      navigate('/auth/sign-in', { replace: true });
     } catch (error) {
       console.error('Error signing out:', error);
     }
   };
@@ .. @@
                     <Settings className="mr-2 h-4 w-4" />
                     Settings
                   </Link>
                   <div className="border-t border-gray-200 my-1"></div>
-                  <button
+                  <Link
+                    to="#"
                     onClick={handleSignOut}
                     className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                   >
                     <LogOut className="mr-2 h-4 w-4" />
                     Sign out
-                  </button>
+                  </Link>
                 </div>
               )}
             </div>
@@ .. @@
             ))}
             <div className="border-t border-gray-200 my-2"></div>
-            <button
+            <Link
+              to="#"
               onClick={handleSignOut}
               className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
             >
               <LogOut className="mr-3 h-5 w-5" />
               Sign out
-            </button>
+            </Link>