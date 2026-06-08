import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getPrisma } from "@/lib/prisma";

export const googleDriveScope =
  "openid email profile https://www.googleapis.com/auth/drive";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          include_granted_scopes: "true",
          prompt: "consent",
          scope: googleDriveScope,
        },
      },
    }),
  ],
  callbacks: {
    jwt({ account, token, user }) {
      if (user) {
        token.userId = user.id ?? token.sub;
      }

      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleExpiresAt = account.expires_at;
        token.googleRefreshToken =
          account.refresh_token ?? token.googleRefreshToken;
        token.googleScope = account.scope;
        token.googleTokenType = account.token_type;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(
          token.userId ?? token.sub ?? token.email ?? "google-user",
        );
      }

      session.google = {
        accessToken: token.googleAccessToken
          ? String(token.googleAccessToken)
          : undefined,
        expiresAt:
          typeof token.googleExpiresAt === "number"
            ? token.googleExpiresAt
            : undefined,
        refreshToken: token.googleRefreshToken
          ? String(token.googleRefreshToken)
          : undefined,
        scope: token.googleScope ? String(token.googleScope) : undefined,
        tokenType: token.googleTokenType
          ? String(token.googleTokenType)
          : undefined,
      };

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      try {
        await getPrisma().user.upsert({
          where: { email: user.email ?? "" },
          update: {
            image: user.image,
            name: user.name,
          },
          create: {
            email: user.email,
            id: user.id,
            image: user.image,
            name: user.name,
          },
        });

        await getPrisma().appSettings.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      } catch (error) {
        console.warn("Database sign-in sync skipped", error);
      }
    },
  },
}));
