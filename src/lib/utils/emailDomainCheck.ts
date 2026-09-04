/**
 * Checks whether an email's domain can actually receive mail, by looking up
 * its MX records via Google's public DNS-over-HTTPS API — a real validity
 * check beyond regex format, catching typo'd/nonexistent domains
 * (gmial.com, yah00.com, ...) without needing a backend of our own.
 *
 * Returns:
 * - `true`  — the domain exists and has mail servers configured.
 * - `false` — the domain doesn't exist, or has no mail servers at all.
 * - `null`  — the check itself couldn't be completed (network error,
 *   timeout, the API being unavailable). Callers must treat this as
 *   "unknown" and not block the user — the DNS lookup is a best-effort
 *   enhancement, not something that should ever prevent a real signup
 *   if a third-party service has a bad moment.
 */
export async function domainAcceptsEmail(domain: string): Promise<boolean | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { Status: number; Answer?: { data: string }[] };
    if (data.Status === 3) return false; // NXDOMAIN — the domain doesn't exist
    if (data.Status !== 0) return null; // some other resolver-side issue — inconclusive
    if (!Array.isArray(data.Answer) || data.Answer.length === 0) return false;
    // RFC 7505 "null MX" (a single "0 ." record) is a domain explicitly
    // declaring it accepts no mail at all — e.g. example.com uses this.
    const isNullMx = data.Answer.length === 1 && /^0\s+\.$/.test(data.Answer[0].data.trim());
    return !isNullMx;
  } catch {
    return null;
  }
}

export function extractEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1);
}
