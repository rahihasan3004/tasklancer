import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyTelegramInitData, extractUserFromInitData } from "@/lib/telegramAuth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Withdrawal } from "@/models/Withdrawal";
import type { WithdrawalMethod } from "@/models/Withdrawal";

const MIN_WITHDRAWAL = 3000;
const VALID_METHODS: WithdrawalMethod[] = ["bkash", "nagad", "usdt_bsc"];
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, amount, method, accountNumber } = body as {
      initData?: string;
      amount?: number;
      method?: string;
      accountNumber?: string;
    };

    if (!initData || typeof initData !== "string") {
      return Response.json({ error: "initData is required" }, { status: 400 });
    }

    if (!BOT_TOKEN) {
      return Response.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const verification = verifyTelegramInitData(initData, BOT_TOKEN);
    if (!verification.isValid) {
      return Response.json({ error: "Invalid Telegram authentication data" }, { status: 401 });
    }

    const userData = extractUserFromInitData(initData, verification);
    if (!userData) {
      return Response.json({ error: "User data not found in initData" }, { status: 400 });
    }

    const telegramId = String(userData.id);

    if (!amount || typeof amount !== "number" || amount < MIN_WITHDRAWAL) {
      return Response.json({
        error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} PTS ($${(MIN_WITHDRAWAL / 1000).toFixed(2)} USD)`,
        minimumAmount: MIN_WITHDRAWAL,
      }, { status: 400 });
    }

    if (!method || !VALID_METHODS.includes(method as WithdrawalMethod)) {
      return Response.json({ error: "Invalid withdrawal method. Use: bkash, nagad, or usdt_bsc" }, { status: 400 });
    }

    if (!accountNumber || typeof accountNumber !== "string" || !accountNumber.trim()) {
      return Response.json({ error: "Account number is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ telegramId });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const referralCount = await User.countDocuments({ referredBy: user.telegramId });
    if (referralCount < 3) {
      return Response.json({
        error: `Withdrawal locked: You must invite at least 3 friends before cashing out. Current referrals: ${referralCount}/3`,
      }, { status: 400 });
    }

    if (user.balance < amount) {
      return Response.json({
        error: "Insufficient balance",
        balance: user.balance,
        requested: amount,
      }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { telegramId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!updatedUser) {
      return Response.json({ error: "Insufficient balance or concurrent update conflict" }, { status: 409 });
    }

    const withdrawal = await Withdrawal.create({
      telegramId,
      amount,
      method: method as WithdrawalMethod,
      accountNumber: accountNumber.trim(),
      status: "pending",
    });

    await Transaction.create({
      telegramId,
      type: "withdrawal",
      amount: -amount,
      title: `Withdrawal of ${amount} PTS via ${method}`,
    });

    return Response.json({
      success: true,
      balance: updatedUser.balance,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        accountNumber: withdrawal.accountNumber,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}