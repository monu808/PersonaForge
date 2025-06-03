import React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Link } from 'react-router-dom';
import { BrainCircuitIcon } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center">
            <BrainCircuitIcon className="h-10 w-10 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">PersonaForge</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/auth/sign-in" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your account
          </Link>
        </p>
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}