/*
  Socket Context — Socket.io connection management
  Automatically connects when authenticated, disconnects on logout.
  Listens for video processing events and shares state.
*/
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  // keep separate progress info for each video
  const [processingStatus, setProcessingStatus] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    // establish socket connection if user is authenticated
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // video processing progress — updates progress bar
    socket.on('video:processing', (data) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: data.progress,
          step: data.step,
          status: 'processing'
        }
      }));
    });

    // video processing completed
    socket.on('video:processed', (data) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 100,
          step: 'Completed',
          status: 'ready',
          sensitivityStatus: data.sensitivityStatus
        }
      }));
    });

    // video processing error
    socket.on('video:failed', (data) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 0,
          step: 'Error occurred',
          status: 'failed',
          error: data.error
        }
      }));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // clear processing status — when leaving video page
  const clearProcessingStatus = useCallback((videoId) => {
    setProcessingStatus((prev) => {
      const updated = { ...prev };
      delete updated[videoId];
      return updated;
    });
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    processingStatus,
    clearProcessingStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
