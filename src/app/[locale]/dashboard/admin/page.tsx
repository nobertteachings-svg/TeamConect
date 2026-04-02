import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { AdminConsole } from "@/components/admin/admin-console";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user?.roles.includes("ADMIN")) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50">
        <p>{t("admin.accessDenied")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-green sm:text-2xl">{t("admin.title")}</h2>
        <p className="mt-1 text-sm text-stone-500">{t("admin.subtitle")}</p>
      </div>
      <AdminConsole />
    </div>
  );
}
