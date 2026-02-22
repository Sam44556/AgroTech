'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * EXPLANATION: Interface for Socket.IO Context
 * This defines what data/functions are available when you use the socket.
 */
interface SocketContextType {
  socket: Socket | null;           // The Socket.IO connection object
  isConnected: boolean;             // Is the socket connected?
  onlineUsers: string[];            // List of user IDs currently online
}

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

/**
 * EXPLANATION: Custom Hook to use Socket.IO in any component
 * 
 * Usage in a component:
 * const { socket, isConnected } = useSocket();
 * 
 * Then you can do:
 * socket?.emit('send_message', { ... });
 * socket?.on('new_message', (data) => { ... });
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * EXPLANATION: Socket Provider Component
 * Wrap your app with this to enable Socket.IO everywhere.
 * 
 * @param children - Your React components
 * @param userId - The logged-in user's ID (from auth session)
 */
interface SocketProviderProps {
  children: ReactNode;
  userId?: string; // Optional - only connect if user is logged in
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // Only connect if we have a userId (user is logged in)
    if (!userId) {
      console.log('⏸️ Socket.IO: No userId, skipping connection');
      return;
    }

    console.log('🔌 Initializing Socket.IO connection for user:', userId);

    // Create a new Socket.IO connection
    const socketInstance = io('http://localhost:5000', {
      auth: {
        userId: userId, // Send userId to backend for authentication
      },
      transports: ['websocket', 'polling'], // Use WebSocket first, fallback to polling
      reconnection: true, // Auto-reconnect if connection drops
      reconnectionAttempts: 5, // Try to reconnect 5 times
      reconnectionDelay: 1000, // Wait 1 second between reconnection attempts
    });

    // EVENT: Connection successful
    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected! Socket ID:', socketInstance.id);
      setIsConnected(true);
    });

    // EVENT: Connection failed
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    // EVENT: Disconnected from server
    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    // EVENT: A user came online
    socketInstance.on('user_online', (data: { userId: string }) => {
      console.log('👤 User came online:', data.userId);
      setOnlineUsers((prev) => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    });

    // EVENT: A user went offline
    socketInstance.on('user_offline', (data: { userId: string }) => {
      console.log('👤 User went offline:', data.userId);
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // EVENT: Generic error from server
    socketInstance.on('error', (data: { message: string }) => {
      console.error('❌ Socket.IO error:', data.message);
      // You can show a toast notification here if you want
    });

    // Save the socket instance to state
    setSocket(socketInstance);

    // CLEANUP: Disconnect when component unmounts or userId changes
    return () => {
      console.log('🔌 Disconnecting Socket.IO...');
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [userId]); // Re-run effect if userId changes (login/logout)

  // Provide socket, connection status, and online users to all child components
  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}