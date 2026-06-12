import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addLocalNotification: (content: string, link?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/auth/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/auth/notifications/${id}`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/auth/notifications');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  // Local utility to add system feedback alerts (like hand raising or chat notifications)
  const addLocalNotification = (content: string, link: string = '') => {
    const localNotif: Notification = {
      _id: `local-${Date.now()}-${Math.random()}`,
      recipientId: user?.id || '',
      senderId: 'system',
      content,
      isRead: false,
      link,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotifications(prev => [localNotif, ...prev]);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clean up socket on logout
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      return;
    }

    // Connect to server socket
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:5000`;
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    setSocket(socketInstance);
    fetchNotifications();

    // Register user details for private routing
    socketInstance.emit('register-user', user.id);

    // Listen to real-time notification pushes (e.g. task assignments)
    socketInstance.on('new-notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      
      // Try to play alert sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (err) {
        // ignore audio play errors (due to browser policy)
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addLocalNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
export default SocketContext;
