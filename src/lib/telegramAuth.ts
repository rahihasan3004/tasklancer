import crypto from "crypto";

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface VerificationResult {
  isValid: boolean;
  user?: TelegramUser;
}

function parseInitData(initData: string): Map<string, string> {
  const params = new Map<string, string>();
  for (const pair of initData.split("&")) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = decodeURIComponent(pair.slice(0, eqIdx));
    const value = decodeURIComponent(pair.slice(eqIdx + 1));
    params.set(key, value);
  }
  return params;
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string
): VerificationResult {
  if (
    process.env.NODE_ENV === "development" &&
    (!initData || initData === "mock_init_data")
  ) {
    return {
      isValid: true,
      user: { id: 123456789, first_name: "Dev User", username: "localdev" },
    };
  }

  const params = parseInitData(initData);

  const hash = params.get("hash");
  if (!hash) return { isValid: false };

  params.delete("hash");

  const sortedKeys = Array.from(params.keys()).sort();
  const dataCheckString = sortedKeys
    .map((key) => `${key}=${params.get(key)}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return { isValid: computedHash === hash };
}

export function extractUserFromInitData(
  initData: string,
  verification: VerificationResult
): TelegramUser | null {
  if (verification.user) return verification.user;
  const params = new URLSearchParams(initData);
  const userRaw = params.get("user");
  if (!userRaw) return null;
  return JSON.parse(userRaw);
}