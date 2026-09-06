import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyTelegramInitData, extractUserFromInitData } from "@/lib/telegramAuth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

const AD_REWARD = 15;
const MAX_ADS_PER_DAY = 20;
const MIN_INTERVAL_MS = 30_000;
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

    await connectDB();

    const user = await User.findOne({ telegramId });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const lastAdDate = user.lastAdWatchDate ? new Date(user.lastAdWatchDate) : null;
    const isNewUtcDay = !lastAdDate || lastAdDate < utcDayStart;

    const currentDayAds = isNewUtcDay ? 0 : user.adsWatchedToday;

    if (currentDayAds >= MAX_ADS_PER_DAY) {
      return Response.json({
        error: "Daily ad limit reached (20/20). Resets at 00:00 UTC.",
        adsWatchedToday: currentDayAds,
        maxAdsPerDay: MAX_ADS_PER_DAY,
      }, { status: 429 });
    }

    const lastAdTimestamp = user.lastAdTimestamp ? new Date(user.lastAdTimestamp).getTime() : 0;
    const elapsedMs = now.getTime() - lastAdTimestamp;
    if (lastAdTimestamp > 0 && elapsedMs < MIN_INTERVAL_MS) {
      const waitMs = MIN_INTERVAL_MS - elapsedMs;
      return Response.json({
        error: `Please wait ${Math.ceil(waitMs / 1000)}s before watching another ad`,
        waitMs,
      }, { status: 429 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: { balance: AD_REWARD, adsWatchedToday: isNewUtcDay ? 1 : 1 },
        $set: {
          lastAdWatchDate: now,
          lastAdTimestamp: now,
          ...(isNewUtcDay ? { adsWatchedToday: 1 } : {}),
        },
      },
      { new: true }
    );

    await Transaction.create({
      telegramId,
      type: "ad_reward",
      amount: AD_REWARD,
      title: "Rewarded ad watch",
    });

    return Response.json({
      success: true,
      balance: updatedUser!.balance,
      adsWatchedToday: isNewUtcDay ? 1 : updatedUser!.adsWatchedToday,
      adsRemaining: MAX_ADS_PER_DAY - (isNewUtcDay ? 1 : updatedUser!.adsWatchedToday),
    });
  } catch (error) {
    console.error("Ad reward error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}