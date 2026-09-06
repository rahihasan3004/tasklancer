import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyTelegramInitData, extractUserFromInitData } from "@/lib/telegramAuth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

const TASK_REWARDS: Record<string, number> = {
  "tg-channel": 50,
  "tg-group": 35,
  "x-follow": 25,
  "yt-sub": 40,
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function checkTelegramMembership(
  botToken: string,
  channelUsername: string,
  telegramUserId: number
): Promise<boolean> {
  try {
    const cleanUsername = channelUsername.replace("@", "");
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=@${cleanUsername}&user_id=${telegramUserId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) return false;
    const status = data.result?.status;
    return ["member", "administrator", "creator"].includes(status);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, taskId, channelUsername } = body as {
      initData?: string;
      taskId?: string;
      channelUsername?: string;
    };

    if (!initData || typeof initData !== "string") {
      return Response.json({ error: "initData is required" }, { status: 400 });
    }

    if (!taskId || typeof taskId !== "string") {
      return Response.json({ error: "taskId is required" }, { status: 400 });
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

    if (!TASK_REWARDS[taskId]) {
      return Response.json({ error: "Unknown task" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ telegramId });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (user.completedTasks.includes(taskId)) {
      return Response.json({ error: "Task already completed" }, { status: 409 });
    }

    if (channelUsername) {
      const isMember = await checkTelegramMembership(BOT_TOKEN, channelUsername, userData.id);
      if (!isMember) {
        return Response.json({ error: "You are not a member of the required channel" }, { status: 403 });
      }
    }

    const rewardAmount = TASK_REWARDS[taskId];

    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      {
        $inc: { balance: rewardAmount },
        $push: { completedTasks: taskId },
      },
      { new: true }
    );

    await Transaction.create({
      telegramId,
      type: "task",
      amount: rewardAmount,
      title: `Task completed: ${taskId}`,
    });

    return Response.json({
      success: true,
      balance: updatedUser!.balance,
      rewardAmount,
      taskId,
    });
  } catch (error) {
    console.error("Task verify error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}