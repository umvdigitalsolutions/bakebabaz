import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin · Bake Baba'z",
    template: "%s · Bake Baba'z Admin",
  },
  // The admin panel must never be indexed.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root min-h-dvh">{children}</div>;
}
