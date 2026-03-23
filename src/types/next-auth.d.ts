import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionTier: string;
      limitProjects: number;
      limitApiCalls: number;
      usageProjects: number;
      usageApiCalls: number;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    subscriptionTier: string;
    limitProjects: number;
    limitApiCalls: number;
    usageProjects: number;
    usageApiCalls: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    subscriptionTier: string;
    limitProjects: number;
    limitApiCalls: number;
    usageProjects: number;
    usageApiCalls: number;
  }
}
