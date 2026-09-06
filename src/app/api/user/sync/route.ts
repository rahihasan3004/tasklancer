import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyTelegramInitData, extractUserFromInitData } from "@/lib/telegramAuth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Withdrawal } from "@/models/Withdrawal";

const REFERRAL_BONUS = 100;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, referralCode } = body as {
      initData?: string;
      referralCode?: string;
    };

    if (!initData || typeof initData !== "string") {
      return Response.json(
        { error: "initData is required" },
        { status: 400 }
      );
    }

    if (!BOT_TOKEN) {
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const verification = verifyTelegramInitData(initData, BOT_TOKEN);
    if (!verification.isValid) {
      return Response.json(
        { error: "Invalid Telegram authentication data" },
        { status: 401 }
      );
    }

    const userData = extractUserFromInitData(initData, verification);
    if (!userData) {
      return Response.json(
        { error: "User data not found in initData" },
        { status: 400 }
      );
    }

    const telegramId = String(userData.id);

    const db = await connectDB();
    if (!db) {
      return Response.json(
        { error: "Database connection failed", details: "MONGODB_URI is not configured or connection failed" },
        { status: 500 }
      );
    }

    let user = await User.findOne({ telegramId });

    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        telegramId,
        firstName: userData.first_name,
        username: userData.username,
        balance: 0,
        dailyStreak: 0,
      });
    }

    if (isNewUser && referralCode && referralCode !== telegramId) {
      const referrer = await User.findOne({ telegramId: referralCode });
      if (referrer) {
        await User.updateOne(
          { telegramId: referralCode },
          { $inc: { balance: REFERRAL_BONUS } }
        );

        await Transaction.create({
          telegramId: referralCode,
          type: "referral",
          amount: REFERRAL_BONUS,
          title: `Referral bonus from ${userData.first_name}`,
        });

        await User.updateOne(
          { telegramId },
          { $set: { referredBy: referralCode } }
        );
      }
    }

    const recentTransactions = await Transaction.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentWithdrawals = await Withdrawal.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const referralsCount = await User.countDocuments({ referredBy: telegramId });

    return Response.json({
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        balance: user.balance,
        dailyStreak: user.dailyStreak,
        lastClaimDate: user.lastClaimDate ?? null,
        adsWatchedToday: user.adsWatchedToday,
        completedTasks: user.completedTasks ?? [],
        referredBy: user.referredBy ?? null,
        referralsCount,
        createdAt: user.createdAt,
      },
      transactions: recentTransactions.map((t) => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        title: t.title,
        createdAt: t.createdAt,
      })),
      withdrawals: recentWithdrawals.map((w) => ({
        id: w._id,
        amount: w.amount,
        method: w.method,
        accountNumber: w.accountNumber,
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (error) {
    console.error("User sync error:", error);
    return Response.json(
      { error: "Database connection failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}