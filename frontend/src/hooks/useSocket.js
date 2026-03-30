/*
  Socket hook — SocketContext'e kolay erisim
*/
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket, SocketProvider icinden cagirilmali');
  }
  return context;
}
