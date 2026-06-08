import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    google?: {
      accessToken?: string;
      expiresAt?: number;
      refreshToken?: string;
      scope?: string;
      tokenType?: string;
    };
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleAccessToken?: string;
    googleExpiresAt?: number;
    googleRefreshToken?: string;
    googleScope?: string;
    googleTokenType?: string;
    userId?: string;
  }
}
