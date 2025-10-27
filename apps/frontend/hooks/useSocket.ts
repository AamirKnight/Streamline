import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_DOCUMENT_URL || 'http://localhost:3003';

export const useSocket = (documentId?: string) => {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Connect to Socket.io
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);

      // Join document room if documentId provided
      if (documentId) {
        socket.emit('document:join', { documentId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('document:users', (users) => {
      setUsers(users);
    });

    socket.on('document:user-joined', (data) => {
      console.log('User joined:', data.username);
      setUsers(prev => [...prev, data]);
    });

    socket.on('document:user-left', (data) => {
      console.log('User left:', data.username);
      setUsers(prev => prev.filter(u => u.socketId !== data.socketId));
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (documentId && socket.connected) {
        socket.emit('document:leave', { documentId });
      }
      socket.disconnect();
    };
  }, [documentId]);

  const emitChange = (content: string, version: number) => {
    if (socketRef.current && documentId) {
      socketRef.current.emit('document:change', {
        documentId,
        content,
        version,
      });
    }
  };

  const emitCursorUpdate = (position: number) => {
    if (socketRef.current && documentId) {
      socketRef.current.emit('cursor:update', {
        documentId,
        position,
      });
    }
  };

  const onDocumentChange = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('document:change', callback);
    }
  };

  return {
    connected,
    users,
    socket: socketRef.current,
    emitChange,
    emitCursorUpdate,
    onDocumentChange,
  };
};