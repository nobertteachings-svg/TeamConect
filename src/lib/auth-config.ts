import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { maybeGrantBootstrapAdmin } from "@/lib/admin-bootstrap";
import { verifyOtpCode } from "@/lib/otp";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {});
        await maybeGrantBootstrapAdmin(user.id, user.email).catch(() => {});
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const rawCode = credentials?.code?.trim().replace(/\s/g, "") ?? "";
        const nameIn = credentials?.name?.trim().slice(0, 80) ?? "";
        if (!email || !/^\d{6}$/.test(rawCode)) return null;

        const challenge = await prisma.emailOtpChallenge.findFirst({
          where: { email, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!challenge || !verifyOtpCode(rawCode, challenge.codeHash)) return null;

        await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});

        const country = challenge.country;
        let userRow = await prisma.user.findUnique({ where: { email } });

        if (userRow) {
          if (userRow.accountDisabled) return null;
          userRow = await prisma.user.update({
            where: { id: userRow.id },
            data: {
              country,
              emailVerified: new Date(),
              ...(nameIn.length >= 2 ? { name: nameIn } : {}),
            },
          });
        } else {
          const fallback = email.split("@")[0]?.slice(0, 80) ?? "Founder";
          const displayName = nameIn.length >= 2 ? nameIn : fallback;
          userRow = await prisma.user.create({
            data: {
              email,
              emailVerified: new Date(),
              country,
              name: displayName,
            },
          });
        }

        return {
          id: userRow.id,
          email: userRow.email,
          name: userRow.name,
          image: userRow.image,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      const id = user?.id;
      const email = user?.email ?? undefined;
      const dbUser = id
        ? await prisma.user.findUnique({
            where: { id },
            select: { accountDisabled: true },
          })
        : email
          ? await prisma.user.findUnique({
              where: { email },
              select: { accountDisabled: true },
            })
          : null;
      if (dbUser?.accountDisabled) {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
      }
      const uid = token.sub as string | undefined;
      if (uid && (user || trigger === "update")) {
        const db = await prisma.user.findUnique({
          where: { id: uid },
          select: { country: true },
        });
        token.country = db?.country ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.country = (token.country as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
