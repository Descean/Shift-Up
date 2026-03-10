import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) return NextResponse.redirect(new URL("/connexion", req.url));

    const role = token.role as string;

    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN" && role !== "DEVELOPER") {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Apporteur-only routes
    if (pathname.startsWith("/dashboard/apporteur") && role !== "APPORTEUR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Étudiant-only routes
    if (pathname.startsWith("/dashboard/etudiant") && role !== "ETUDIANT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/auth/register",
    "/api/payments/:path*",
  ],
};
