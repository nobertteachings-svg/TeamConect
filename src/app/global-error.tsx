"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-stone-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-stone-600 mb-4">
              We&apos;ve been notified and are working on it. Please try again.
            </p>
            <a
              href="/"
              className="inline-flex px-4 py-2 rounded-lg bg-brand-green text-white font-medium hover:bg-brand-green/90"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
