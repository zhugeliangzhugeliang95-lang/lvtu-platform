import crypto from "crypto";

type SecretName = "USER_SESSION_SECRET" | "ADMIN_SECRET" | "GUEST_INQUIRY_SECRET";

const globalForSecuritySecrets = globalThis as typeof globalThis & {
  __travelTongDevelopmentSecrets?: Map<SecretName, string>;
};

// Next.js can evaluate the same helper in multiple route bundles during
// development. Keep fallback secrets on globalThis so a cookie signed by the
// login route is also valid in pages and sibling API routes.
const developmentSecrets =
  globalForSecuritySecrets.__travelTongDevelopmentSecrets ??
  new Map<SecretName, string>();

globalForSecuritySecrets.__travelTongDevelopmentSecrets = developmentSecrets;

function developmentSecret(name: SecretName) {
  let value = developmentSecrets.get(name);
  if (!value) {
    value = crypto.randomBytes(32).toString("base64url");
    developmentSecrets.set(name, value);
  }
  return value;
}

export function getSecuritySecret(name: SecretName): string {
  const configured = process.env[name]?.trim();
  if (configured) {
    const otherNames: SecretName[] = ["USER_SESSION_SECRET", "ADMIN_SECRET", "GUEST_INQUIRY_SECRET"];
    if (otherNames.some((other) => other !== name && process.env[other]?.trim() === configured)) {
      throw new Error(`${name} must be distinct from other security secrets`);
    }
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }

  return developmentSecret(name);
}

export function timingSafeTextEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
