export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionServerEnv } = await import("./src/lib/env-server");
    validateProductionServerEnv();
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
