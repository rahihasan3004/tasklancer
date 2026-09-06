import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType =
  | "daily_claim"
  | "ad_reward"
  | "task"
  | "referral"
  | "withdrawal";

export interface ITransaction extends Document {
  telegramId: string;
  type: TransactionType;
  amount: number;
  title: string;
  txId?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    telegramId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["daily_claim", "ad_reward", "task", "referral", "withdrawal"],
    },
    amount: { type: Number, required: true },
    title: { type: String, required: true },
    txId: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);