import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { db } from "@/db/drizzle";
import { items, userInventories, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UserJwtPayload {
  id: number;
  telegramId: number;
  iat?: number;
  exp?: number;
}

// Helper to get token from request
export function getTokenFromRequest(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Try to get token from cookie
  const token = request.cookies.get("token")?.value;
  return token;
}

// Verify JWT token
export async function verifyToken(
  token: string
): Promise<UserJwtPayload | null> {
  try {
    if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as UserJwtPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Get current authenticated user
export async function getCurrentUser(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    console.log(payload);

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id));

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Add basic elements to user's inventory
export async function initializeUserBasicElements(userId: number) {
  try {
    // Get all basic elements
    const basicElements = await db
      .select()
      .from(items)
      .where(eq(items.isBasic, true));

    console.log(basicElements);

    // Check if user already has any basic elements
    const existingInventory = await db
      .select()
      .from(userInventories)
      .where(eq(userInventories.userId, userId));

    console.log(existingInventory);

    // Filter out elements that user already has
    const existingItemIds = existingInventory.map((inv) => inv.itemId);
    console.log(existingItemIds);
    const elementsToAdd = basicElements.filter(
      (element) => !existingItemIds.includes(element.id)
    );
    console.log(elementsToAdd);
    // Add missing basic elements to user's inventory
    if (elementsToAdd.length > 0) {
      await db.insert(userInventories).values(
        elementsToAdd.map((element) => ({
          userId,
          itemId: element.id,
          amount: 999999999, // Using a large number for "infinite" amount
        }))
      );
    }

    return true;
  } catch (error) {
    console.error("Error initializing basic elements:", error);
    return false;
  }
}
