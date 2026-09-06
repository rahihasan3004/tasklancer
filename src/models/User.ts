import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  telegramId: string;
  firstName: string;
  username?: string;
  balance: number;
  dailyStreak: number;
  lastClaimDate?: Date;
  adsWatchedToday: number;
  lastAdWatchDate?: Date;
  lastAdTimestamp?: Date;
  completedTasks: string[];
  referredBy?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    username: { type: String },
    balance: { type: Number, default: 0, min: 0 },
    dailyStreak: { type: Number, default: 0 },
    lastClaimDate: { type: Date },
    adsWatchedToday: { type: Number, default: 0 },
    lastAdWatchDate: { type: Date },
    lastAdTimestamp: { type: Date },
    completedTasks: { type: [String], default: [] },
    referredBy: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);