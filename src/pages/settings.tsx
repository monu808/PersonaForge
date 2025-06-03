import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Moon, Shield, Sun, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/auth";
import { updateUserSettings, getUserProfile } from "@/lib/api";

export default function SettingsPage() {
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("private");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile, error } = await getUserProfile(user.id);
      if (error) throw error;

      if (profile?.settings) {
        setProfileVisibility(profile.settings.profile_visibility);
        setEmailNotifications(profile.settings.email_notifications);
        setTheme(profile.settings.theme);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const settings = {
        profile_visibility: profileVisibility,
        email_notifications: emailNotifications,
        theme: theme,
      };

      const { error } = await updateUserSettings(user.id, settings);
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Visibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-600" />
                  Profile Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={profileVisibility === "public" ? "default" : "outline"}
                    onClick={() => setProfileVisibility("public")}
                  >
                    Public
                  </Button>
                  <Button
                    variant={profileVisibility === "private" ? "default" : "outline"}
                    onClick={() => setProfileVisibility("private")}
                  >
                    Private
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary-600" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={emailNotifications ? "default" : "outline"}
                    onClick={() => setEmailNotifications(true)}
                  >
                    Enabled
                  </Button>
                  <Button
                    variant={!emailNotifications ? "default" : "outline"}
                    onClick={() => setEmailNotifications(false)}
                  >
                    Disabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 mr-2 text-primary-600" />
                  ) : (
                    <Sun className="h-5 w-5 mr-2 text-primary-600" />
                  )}
                  Theme Preferences
                </CardTitle>
                <CardDescription>
                  Choose your preferred theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                  >
                    System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Changes */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={loadUserSettings}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}