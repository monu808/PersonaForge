// This file is deprecated. Use sign-in.tsx instead.
// Redirecting to the proper sign-in page...

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/auth/sign-in', { replace: true });
  }, [navigate]);

  return null;
}