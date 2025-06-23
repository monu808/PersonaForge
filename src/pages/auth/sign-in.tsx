import { AuthForm } from '@/components/auth/auth-form';
import { Link } from 'react-router-dom';
import { BrainCircuitIcon } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center group">
            <BrainCircuitIcon className="h-10 w-10 text-primary-600 group-hover:text-primary-700 transition-colors" />
            <span className="ml-3 text-2xl font-bold text-gray-900">PersonaForge</span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link 
            to="/auth/sign-up" 
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            create a new account
          </Link>
        </p>
      </div>
      
      <AuthForm mode="signin" />
    </div>
  );
}