import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyTelegramInitData, extractUserFromInitData } from "@/lib/telegramAuth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

const STREAK_REWARDS = [10, 20, 30, 50, 75, 100, 150];
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body as { initData?: string };

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

    const db = await connectDB();
    if (!db) {
      return Response.json(
        { error: "Database connection failed", details: "MONGODB_URI is not configured or connection failed" },
        { status: 500 }
      );
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const lastClaim = user.lastClaimDate ? new Date(user.lastClaimDate) : null;

    if (lastClaim) {
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastClaim < 24) {
        const nextClaimMs = 24 * 60 * 60 * 1000 - (now.getTime() - lastClaim.getTime());
        const nextClaimHours = Math.ceil(nextClaimMs / (1000 * 60 * 60));
        return Response.json({
          error: `Already claimed today. Next claim available in ~${nextClaimHours} hour(s)`,
          nextClaimAvailableMs: nextClaimMs,
        }, { status: 429 });
      }
    }

    const isConsecutiveDay =
      lastClaim
        ? now.getTime() - lastClaim.getTime() < 48 * 60 * 60 * 1000
        : false;

    const newStreak = isConsecutiveDay ? Math.min(user.dailyStreak + 1, 7) : 1;
    const streakIndex = newStreak - 1;
    const rewardAmount = STREAK_REWARDS[streakIndex];

    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: { balance: rewardAmount },
        $set: {
          dailyStreak: newStreak,
          lastClaimDate: now,
        },
      },
      { new: true }
    );

    await Transaction.create({
      telegramId,
      type: "daily_claim",
      amount: rewardAmount,
      title: `Day ${newStreak} streak reward`,
    });

    return Response.json({
      success: true,
      balance: updatedUser!.balance,
      dailyStreak: newStreak,
      rewardAmount,
    });
  } catch (error) {
    console.error("Daily reward error:", error);
    return Response.json(
      { error: "Database connection failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}