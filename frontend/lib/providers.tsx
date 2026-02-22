'use client';

import { useEffect, useState } from 'react';
import { SocketProvider } from './socket-context';
import { authClient } from './auth-client';

/**
 * EXPLANATION: This component wraps your app and provides Socket.IO
 * It fetches the current user's session and passes the userId to SocketProvider
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the current user's session when the app loads
    async function fetchSession() {
      try {
        const session = await authClient.getSession();
        const sessionData = (session as any)?.data; // Adjust type as needed
        
        if (sessionData?.user?.id) {
          console.log('✅ User session found:', sessionData.user.id);
          setUserId(sessionData.user.id);
        } else {
          console.log('⏸️ No user session found');
          setUserId(undefined);
        }
      } catch (error) {
        console.error('❌ Error fetching session:', error);
        setUserId(undefined);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();

    // If your authClient supports auth state change events, add the correct implementation here.
    // Otherwise, remove this block or implement polling/session refresh as needed.

    // Example for unsupported method (no-op cleanup):
    return () => {};
  }, []);

  // Show loading state while fetching session
  if (loading) {
    return <div>Loading...</div>;
  }

  // Wrap children with SocketProvider
  return <SocketProvider userId={userId}>{children}</SocketProvider>;
}