import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyTOTPCode } from "@/lib/totp";
import { rateLimit } from "@/lib/ratelimit";

// Extend next-auth types
declare module "next-auth" {
  interface User {
    role?: string;
    affiliationCode?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      affiliationCode?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    affiliationCode?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
    newUser: "/dashboard/client",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limiting anti brute-force — proxy.ts ne peut pas protéger cette
        // route (next-auth court-circuite son propre middleware pour tout
        // chemin /api/auth/*), donc la protection est posée ici directement.
        const forwarded = (req.headers as Record<string, string> | undefined)?.["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const { allowed } = rateLimit(`login:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
        if (!allowed) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // 2FA — si activé sur le compte, un code TOTP valide est obligatoire
        // pour terminer la connexion (auparavant vérifié nulle part : un mot
        // de passe seul suffisait même avec le 2FA "activé").
        if (user.totpEnabled) {
          if (!user.totpSecret) return null; // état incohérent, refuse par sécurité
          if (!credentials.code) {
            throw new Error("2FA_REQUIRED");
          }
          if (!verifyTOTPCode(credentials.code, user.totpSecret)) {
            throw new Error("2FA_INVALID");
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          affiliationCode: user.affiliationCode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.affiliationCode = user.affiliationCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.affiliationCode = token.affiliationCode;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google OAuth: assign default role if new user
      if (account?.provider === "google" && user) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          // New user via Google — will be created by PrismaAdapter
          // Role defaults to CLIENT in schema
        }
      }
      return true;
    },
  },
};
