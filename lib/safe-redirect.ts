const FALLBACK_DESTINATION = "/demandes";
const INTERNAL_ORIGIN = "https://doztra.invalid";

export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return FALLBACK_DESTINATION;
  }

  const destination = new URL(value, INTERNAL_ORIGIN);
  if (destination.origin !== INTERNAL_ORIGIN || destination.pathname.startsWith("/connexion")) {
    return FALLBACK_DESTINATION;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
