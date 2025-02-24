/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/auth/telegram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse, validate } from "@telegram-apps/init-data-node";
import { customAlphabet } from "nanoid";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { initializeUserBasicElements } from "@/lib/auth";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

async function createToken(payload: any) {
  const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  return token;
}

async function validateTelegramUser(initData: string) {
  try {
    const secretToken = process.env.NEXT_PUBLIC_TELEGRAM_TOKEN;
    if (!secretToken) {
      throw new Error("TELEGRAM_TOKEN is not defined");
    }

    validate(initData, secretToken);
    const data = parse(initData);
    return data.user;
  } catch (error) {
    console.error("Telegram validation error:", error);
    return null;
  }
}

async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = nanoid();
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code));
    isUnique = existingUser.length === 0;
  }

  return code!;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, referralCode } = body;

    // Validate input
    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    // Validate Telegram user
    const user = await validateTelegramUser(initData);
    if (!user) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 });
    }

    // Generate new referral code
    const newReferralCode = await generateUniqueReferralCode();
    // Find referrer if referral code provided
    let referrer = null;
    if (referralCode) {
      referrer = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode));

      if (referrer.length > 0) {
        // Update referrer's friend count
        await db
          .update(users)
          .set({
            friendCount: (referrer[0].friendCount || 0) + 1,
          })
          .where(eq(users.id, referrer[0].id));
      }
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, user.id));

    const isNewUser = existingUser.length === 0;

    // Ensure basic elements exist in the items table
    // Upsert user in database
    const userDB = await db
      .insert(users)
      .values({
        telegramId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        languageCode: user.language_code,
        photoUrl: null,
        isPremium: user.is_premium || false,
        referralCode: newReferralCode,
        referredByCode: referrer?.[0]?.referralCode,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          languageCode: user.language_code,
          photoUrl: null,
          isPremium: user.is_premium || false,
        },
      })
      .returning();

    if (isNewUser) {
      await initializeUserBasicElements(userDB[0].id);
    }

    // Generate JWT token
    const token = await createToken(userDB[0]);

    return NextResponse.json({
      access_token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
