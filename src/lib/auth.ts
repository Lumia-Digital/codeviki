import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        }) as any;

        if (!user || !user.password) {
          throw new Error('Invalid email or password.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          subscriptionTier: user.subscriptionTier,
          usageProjects: user.usageProjects,
          usageApiCalls: user.usageApiCalls,
        } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Force email to lowercase for consistent DB lookups
      const email = (user?.email || token.email)?.toLowerCase();
      
      if (email) {
        try {
          const dbUser = await (prisma.user as any).findUnique({
            where: { email: email },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.subscriptionTier = dbUser.subscriptionTier;
            token.usageProjects = dbUser.usageProjects;
            token.usageApiCalls = dbUser.usageApiCalls;
            token.stripeCurrentPeriodEnd = dbUser.stripeCurrentPeriodEnd?.toISOString() || null;
            token.stripeCancelAtPeriodEnd = dbUser.stripeCancelAtPeriodEnd;
            
            const tierLimits: Record<string, { projects: number; apiCalls: number }> = {
              free: { projects: 3, apiCalls: 1000 },
              pro: { projects: 15, apiCalls: 50000 },
              enterprise: { projects: 999999, apiCalls: 500000 },
            };
            
            const tierKey = (dbUser.subscriptionTier as string || 'free').toLowerCase();
            const limits = (tierLimits as any)[tierKey] || tierLimits.free;
            token.limitProjects = limits.projects;
            token.limitApiCalls = limits.apiCalls;
          }
        } catch (error) {
          console.error("Error in JWT callback fetching user:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).subscriptionTier = token.subscriptionTier;
        (session.user as any).usageProjects = token.usageProjects;
        (session.user as any).usageApiCalls = token.usageApiCalls;
        (session.user as any).limitProjects = token.limitProjects;
        (session.user as any).limitApiCalls = token.limitApiCalls;
        (session.user as any).stripeCurrentPeriodEnd = token.stripeCurrentPeriodEnd;
        (session.user as any).stripeCancelAtPeriodEnd = token.stripeCancelAtPeriodEnd as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development',
};
