import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/chat/:path*",
    "/api/image/:path*",
    "/api/video/:path*",
  ],
};
