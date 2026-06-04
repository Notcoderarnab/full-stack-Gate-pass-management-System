import mongoose, { Document, Schema } from 'mongoose';

export type UserRole =
  'GUEST'
  | 'HOST'
  | 'GUARD'
  | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['GUEST', 'HOST', 'GUARD', 'ADMIN'], default: 'GUEST' },
    phone:        { type: String },
    department:   { type: String },  // Only for HOST
    avatarUrl:    { type: String },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
