import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

const SECRET_KEY = process.env.TOROX_SECRET_KEY || "pending_key";

export async function GET(request: NextRequest) {
  return handlePostback(request);
}

export async function POST(request: NextRequest) {
  return handlePostback(request);
}

async function handlePostback(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const amount = searchParams.get("amount");
    const tx_id = searchParams.get("tx_id");
    const signature = searchParams.get("signature");

    if (!user_id || !amount || !tx_id || !signature) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const expectedSig = crypto
      .createHash("md5")
      .update(`${user_id}:${amount}:${SECRET_KEY}`)
      .digest("hex");

    if (signature !== expectedSig) {
      return new Response("Invalid signature", { status: 403 });
    }

    await connectDB();

    const existing = await Transaction.findOne({ txId: tx_id });
    if (existing) {
      return new Response("OK");
    }

    const user = await User.findOne({ telegramId: user_id });
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const ptsAmount = Math.round(parseFloat(amount));

    await User.findOneAndUpdate(
      { telegramId: user_id },
      { $inc: { balance: ptsAmount } },
      { new: true }
    );

    await Transaction.create({
      telegramId: user_id,
      type: "ad_reward",
      amount: ptsAmount,
      title: "Torox offerwall reward",
      txId: tx_id,
    });

    return new Response("1");
  } catch (error) {
    console.error("Torox postback error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}