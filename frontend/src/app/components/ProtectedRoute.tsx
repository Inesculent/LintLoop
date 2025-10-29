'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/signin');
      return;
    }

    // Verify token with backend
    const verifyAuth = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
        const response = await fetch(`${apiBase}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        if (data) {
          setIsAuthorized(true);
        } else {
          throw new Error('No user data');
        }
      } catch (error) {
        localStorage.removeItem('token');
        router.replace('/signin');
      }
    };

    verifyAuth();
  }, [router]);

  if (!isAuthorized) {
    return null; // or loading spinner
  }

  return <>{children}</>;
}