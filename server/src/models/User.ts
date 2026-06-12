import { Schema, model } from 'mongoose';

export interface IUser {
  username: string;
  email: string;
  password?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatarUrl?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    avatarUrl: { type: String, default: '' },
    refreshToken: { type: String }
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', userSchema);
export default UserModel;
