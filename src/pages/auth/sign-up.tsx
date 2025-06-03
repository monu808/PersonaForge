import React from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AuthForm mode="signup" />
    </div>
  );
}