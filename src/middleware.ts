import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as unknown as Record<string, string>)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Unauthenticated users cannot access protected areas
  if (!user && (pathname.startsWith("/customer") || pathname.startsWith("/seller") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, seller_status")
      .eq("id", user.id)
      .single();

    if (profile) {
      // /seller/apply is accessible to any authenticated user (to submit application)
      if (pathname.startsWith("/seller/apply") || pathname.startsWith("/seller/pending")) {
        // Allow all authenticated users — no role check needed
        return supabaseResponse;
      }

      // /seller/* (dashboard, products, inventory, orders, demand, settings)
      // requires seller_verified OR admin
      if (
        pathname.startsWith("/seller") &&
        profile.seller_status !== "seller_verified" &&
        profile.role !== "admin"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/customer/search";
        return NextResponse.redirect(url);
      }

      // /admin/* requires admin role
      if (pathname.startsWith("/admin") && profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
