export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.APP_ORIGIN?.split(",")[0]?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Production validation reports the invalid value before the server starts.
    }
  }
  return "http://127.0.0.1:3100";
}
