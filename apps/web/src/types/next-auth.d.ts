import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      walletAddress?: string;
      role?: string;
      createdAt?: string;
    } & DefaultSession["user"];
  }

  interface User {
    walletAddress: string;
    role?: string;
    createdAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
