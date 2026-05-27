import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const scopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || "";

async function refreshAccessToken(token) {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
      refreshToken: refreshed.refresh_token || token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Google access token refresh failed", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing-client-secret",
      authorization: {
        params: {
          scope: scopes,
          access_type: "offline",
          prompt: "consent",
          ...(allowedDomain ? { hd: allowedDomain } : {}),
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      if (!allowedDomain) return true;
      const email = profile?.email || "";
      return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`);
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token || token.refreshToken;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined;
        token.error = undefined;
      }

      if (token.expiresAt && Date.now() < token.expiresAt - 60 * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.authError = token.error;
      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions);
