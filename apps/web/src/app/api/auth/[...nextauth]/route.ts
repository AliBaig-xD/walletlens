import NextAuth, { NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { ENDPOINTS } from "@/lib/api/endpoints";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CookieOptions = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

function parseSetCookie(
  cookieHeader: string,
): { name: string; value: string; options: CookieOptions } | null {
  const [cookiePart, ...attributes] = cookieHeader.split(";");
  const [rawName, ...rawValueParts] = cookiePart.split("=");
  const name = rawName?.trim();
  const value = rawValueParts.join("=").trim();

  if (!name) return null;

  const options: CookieOptions = {};
  for (const attr of attributes) {
    const [rawKey, rawVal] = attr.trim().split("=");
    const key = rawKey.toLowerCase();
    const val = rawVal?.trim();

    if (key === "path" && val) options.path = val;
    if (key === "domain" && val) options.domain = val;
    if (key === "max-age" && val) options.maxAge = Number(val);
    if (key === "expires" && val) options.expires = new Date(val);
    if (key === "secure") options.secure = true;
    if (key === "httponly") options.httpOnly = true;
    if (key === "samesite" && val)
      options.sameSite = val.toLowerCase() as CookieOptions["sameSite"];
  }

  return { name, value, options };
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            console.error("Missing credentials");
            return null;
          }

          const addressMatch =
            credentials.message.match(/0x[a-fA-F0-9]{40}/);
          if (!addressMatch) {
            console.error("Could not extract address from message");
            return null;
          }
          const address = addressMatch[0];

          const response = await fetch(`${API_URL}${ENDPOINTS.auth.verify}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              message: credentials.message,
              signature: credentials.signature,
              address,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend verification failed:", {
              status: response.status,
              error: errorText,
            });
            return null;
          }

          const setCookieHeaders = response.headers.getSetCookie();
          const cookieStore = await cookies();
          for (const cookieHeader of setCookieHeaders) {
            const parsed = parseSetCookie(cookieHeader);
            if (!parsed) continue;
            cookieStore.set(parsed.name, parsed.value, parsed.options);
          }

          const data = await response.json();
          const user = data?.data?.user;
          if (!user?.walletAddress) return null;

          const authUser: User = {
            id: user.walletAddress,
            walletAddress: user.walletAddress,
            role: user.role,
            createdAt: user.createdAt,
          };
          return authUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      const walletAddress =
        typeof token.sub === "string" ? token.sub : undefined;
      const role = typeof token.role === "string" ? token.role : undefined;
      session.user = {
        ...session.user,
        walletAddress,
        role,
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user && "role" in user && typeof user.role === "string") {
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
