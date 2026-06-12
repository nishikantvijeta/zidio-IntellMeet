import UserModel, { IUser } from '../models/User';
import { isMockDb } from '../config/db';
import { mockDb, generateId, DbUser } from './mockDb';

export class UserRepository {
  static async findByEmail(email: string): Promise<DbUser | null> {
    if (isMockDb) {
      const u = mockDb.getUsers().find(user => user.email.toLowerCase() === email.toLowerCase());
      return u ? { ...u } : null;
    }
    const userDoc = await UserModel.findOne({ email: email.toLowerCase() });
    return userDoc ? (userDoc.toObject() as any as DbUser) : null;
  }

  static async findById(id: string): Promise<DbUser | null> {
    if (isMockDb) {
      const u = mockDb.getUsers().find(user => user._id === id);
      return u ? { ...u } : null;
    }
    const userDoc = await UserModel.findById(id);
    return userDoc ? (userDoc.toObject() as any as DbUser) : null;
  }

  static async findByVerificationToken(token: string): Promise<DbUser | null> {
    if (isMockDb) {
      const u = mockDb.getUsers().find(user => user.verificationToken === token);
      return u ? { ...u } : null;
    }
    const userDoc = await UserModel.findOne({ verificationToken: token });
    return userDoc ? (userDoc.toObject() as any as DbUser) : null;
  }

  static async findByResetPasswordToken(token: string): Promise<DbUser | null> {
    if (isMockDb) {
      const u = mockDb.getUsers().find(user => user.resetPasswordToken === token && user.resetPasswordExpires && new Date(user.resetPasswordExpires) > new Date());
      return u ? { ...u } : null;
    }
    const userDoc = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    return userDoc ? (userDoc.toObject() as any as DbUser) : null;
  }

  static async create(userData: Partial<IUser>): Promise<DbUser> {
    if (isMockDb) {
      const newUser: DbUser = {
        _id: generateId(),
        username: userData.username || '',
        email: userData.email || '',
        password: userData.password,
        isVerified: userData.isVerified || false,
        verificationToken: userData.verificationToken,
        avatarUrl: userData.avatarUrl || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return mockDb.saveUser(newUser);
    }
    const userDoc = await UserModel.create(userData);
    return userDoc.toObject() as any as DbUser;
  }

  static async update(id: string, updates: Partial<IUser>): Promise<DbUser | null> {
    if (isMockDb) {
      const existing = mockDb.getUsers().find(u => u._id === id);
      if (!existing) return null;
      const updatedUser: DbUser = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };
      return mockDb.saveUser(updatedUser);
    }
    const userDoc = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return userDoc ? (userDoc.toObject() as any as DbUser) : null;
  }

  static async listAll(): Promise<DbUser[]> {
    if (isMockDb) {
      return mockDb.getUsers().map(u => ({ ...u }));
    }
    const users = await UserModel.find({});
    return users.map(u => u.toObject() as any as DbUser);
  }
}
