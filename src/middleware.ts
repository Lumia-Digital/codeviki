import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development',
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
