'use client';

import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

const HomePageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login');
    } else {
      // Authenticated, redirect to dashboard
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading spinner while checking authentication
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );
};

const HomePage = () => {
  return (
    <SessionProvider>
      <HomePageContent />
    </SessionProvider>
  );
};

export default HomePage;
