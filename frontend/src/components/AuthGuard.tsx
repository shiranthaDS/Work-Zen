'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // If no token and not on login page, redirect to login
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
    
    // If has token and on login page, redirect to home
    if (token && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
