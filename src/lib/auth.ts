import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { ApiError } from "./api-errors";
import { env } from "./env";

// Config is built lazily (on first request) so `next build` needs no secrets.
// Google reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET and Resend reads
// AUTH_RESEND_KEY from the environment automatically.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google, Resend({ from: env().EMAIL_FROM })],
  session: { strategy: "database" },
  pages: { signIn: "/sign-in", verifyRequest: "/check-email", error: "/sign-in" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
}));

/** For API routes: the signed-in user's id, or a 401. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new ApiError("UNAUTHORIZED", "Please sign in.");
  return id;
}
