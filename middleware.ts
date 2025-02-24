// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define paths that don't require authentication
const publicPaths = ["/api/auth/telegram"];

// Define paths that require authentication
const protectedPaths = ["/api/me", "/api/craft", "/api/inventory"];

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Helper to check if path matches array of paths
function matchesPath(path: string, pathArray: string[]): boolean {
  return pathArray.some(
    (p) => path.startsWith(p) || path.match(new RegExp(`^${p}(/.*)?$`))
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for public paths and static files
  if (
    matchesPath(path, publicPaths) ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Get token from authorization header or cookie
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("token")?.value;
  console.log(token);
  // Check if path requires authentication
  const isProtectedPath = matchesPath(path, protectedPaths);

  if (isProtectedPath || token) {
    if (!token) {
      // Redirect to login if token is missing
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    console.log(payload);
    if (!payload) {
      // Clear invalid token cookie and redirect to login
      //   const response = NextResponse.redirect(new URL("/", request.url));
      //   response.cookies.delete("token");
      //   return response;
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.id as string);
    requestHeaders.set("x-user-telegram-id", payload.telegramId as string);

    // Continue with added headers
    return NextResponse.next({
      headers: requestHeaders,
    });
  }

  // Allow access to unprotected paths without token
  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
