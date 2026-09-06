import mongoose, { Schema, Document, Model } from "mongoose";

export type WithdrawalMethod = "bkash" | "nagad" | "usdt_bsc";
export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface IWithdrawal extends Document {
  telegramId: string;
  amount: number;
  method: WithdrawalMethod;
  accountNumber: string;
  status: WithdrawalStatus;
  createdAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    telegramId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      required: true,
      enum: ["bkash", "nagad", "usdt_bsc"],
    },
    accountNumber: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Withdrawal: Model<IWithdrawal> =
  mongoose.models.Withdrawal ??
  mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);