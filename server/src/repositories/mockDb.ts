import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { IUser } from '../models/User';
import { IMeeting } from '../models/Meeting';
import { ITask } from '../models/Task';
import { INotification } from '../models/Notification';

const storeFilePath = path.join(__dirname, '..', 'config', 'mock-db-store.json');

export type DbUser = IUser & { _id: string };
export type DbMeeting = IMeeting & { _id: string };
export type DbTask = ITask & { _id: string };
export type DbNotification = INotification & { _id: string };

interface IMockStore {
  users: DbUser[];
  meetings: DbMeeting[];
  tasks: DbTask[];
  notifications: DbNotification[];
}

let store: IMockStore = {
  users: [],
  meetings: [],
  tasks: [],
  notifications: []
};

// Load store from disk if exists
export const loadMockStore = () => {
  try {
    if (fs.existsSync(storeFilePath)) {
      const fileData = fs.readFileSync(storeFilePath, 'utf8');
      store = JSON.parse(fileData);
      logger.info('Mock DB store loaded from disk.');
    } else {
      saveMockStore();
    }
  } catch (error) {
    logger.error('Error loading Mock DB store from disk, resetting database.', error);
  }
};

// Save store to disk
export const saveMockStore = () => {
  try {
    const parentDir = path.dirname(storeFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(storeFilePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    logger.error('Error saving Mock DB store to disk', error);
  }
};

// Helper to generate custom ids
export const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const mockDb = {
  getUsers: () => store.users,
  getMeetings: () => store.meetings,
  getTasks: () => store.tasks,
  getNotifications: () => store.notifications,
  
  saveUser: (user: DbUser) => {
    const index = store.users.findIndex(u => u._id === user._id || u.email === user.email);
    if (index !== -1) {
      store.users[index] = { ...store.users[index], ...user };
    } else {
      store.users.push(user);
    }
    saveMockStore();
    return user;
  },

  saveMeeting: (meeting: DbMeeting) => {
    const index = store.meetings.findIndex(m => m._id === meeting._id || m.roomCode === meeting.roomCode);
    if (index !== -1) {
      store.meetings[index] = { ...store.meetings[index], ...meeting };
    } else {
      store.meetings.push(meeting);
    }
    saveMockStore();
    return meeting;
  },

  saveTask: (task: DbTask) => {
    const index = store.tasks.findIndex(t => t._id === task._id);
    if (index !== -1) {
      store.tasks[index] = { ...store.tasks[index], ...task };
    } else {
      store.tasks.push(task);
    }
    saveMockStore();
    return task;
  },

  saveNotification: (notification: DbNotification) => {
    const index = store.notifications.findIndex(n => n._id === notification._id);
    if (index !== -1) {
      store.notifications[index] = { ...store.notifications[index], ...notification };
    } else {
      store.notifications.push(notification);
    }
    saveMockStore();
    return notification;
  },

  deleteTask: (taskId: string) => {
    const initialLen = store.tasks.length;
    store.tasks = store.tasks.filter(t => t._id !== taskId);
    saveMockStore();
    return store.tasks.length < initialLen;
  }
};

// Run initial load
loadMockStore();
