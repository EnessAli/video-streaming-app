/*
  Socket Context — Socket.io baglantisi yonetimi
  Auth oldugunda otomatik baglanir, kullaniciyla birlikte kopar.
  Video processing eventlerini dinler ve state olarak paylaşir.
*/
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  // her video icin ayri progress bilgisi tut
  const [processingStatus, setProcessingStatus] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    // kullanici giris yapmissa socket baglantisi kur
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
      console.log('Socket baglandi');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket koptu');
      setConnected(false);
    });

    // video isleme ilerlemesi — progress bar guncellenir
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

    // video isleme tamamlandi
    socket.on('video:processed', (data) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 100,
          step: 'Tamamlandi',
          status: 'ready',
          sensitivityStatus: data.sensitivityStatus
        }
      }));
    });

    // video isleme hatasi
    socket.on('video:failed', (data) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 0,
          step: 'Hata olustu',
          status: 'failed',
          error: data.error
        }
      }));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket baglanti hatasi:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // processing durumunu temizle — video sayfasindan cikinca
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
