/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { items, userInventories, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from middleware
    const currentUser: any = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get user with their inventory
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id));
    const userInventory = await db
      .select()
      .from(userInventories)
      .leftJoin(items, eq(userInventories.itemId, items.id))
      .where(eq(userInventories.userId, currentUser.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare response data
    const responseData = {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      isPremium: user.isPremium,
      languageCode: user.languageCode,
      referralCode: user.referralCode,
      referredByCode: user.referredByCode,
      inventory: userInventory.map((inv) => ({
        id: inv.user_inventories.id,
        handle: inv.items?.handle,
        emoji: inv.items?.emoji,
        itemId: inv.user_inventories.itemId,
        amount: inv.user_inventories.amount,
        isBasic: inv.items?.isBasic,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
