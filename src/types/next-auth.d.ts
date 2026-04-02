import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      country?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    country?: string | null;
  }
}
