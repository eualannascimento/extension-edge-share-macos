const RESTRICTED_PROTOCOLS = new Set(["chrome:", "edge:"]);
const RESTRICTED_HOSTNAMES = new Set([
  "chrome.google.com",
  "chromewebstore.google.com",
  "microsoftedge.microsoft.com",
]);

export function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  return RESTRICTED_PROTOCOLS.has(parsed.protocol) || RESTRICTED_HOSTNAMES.has(parsed.hostname);
}
