import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

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
