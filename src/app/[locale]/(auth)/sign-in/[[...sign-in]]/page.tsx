import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SignInClient } from "./sign-in-client";

export default async function SignInPage() {
  const t = await getTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-20 text-stone-500">
          {t("loading")}
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
