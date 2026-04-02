import DashboardLayout from "@/components/dashboard/dashboard-layout";

export default function DashboardRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <DashboardLayout params={params}>{children}</DashboardLayout>;
}
