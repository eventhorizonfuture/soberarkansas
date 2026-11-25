import { createClient } from "@supabase/supabase-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabasePublishableKey(): string {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // ignore malformed keyset
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is required");
}

export function supabaseAnon() {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL is required");
  return createClient(url, supabasePublishableKey(), {
    db: { schema: "arkansas" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SITE = "https://soberarkansas.com";

export const LISTING_FIELDS =
  "id,name,address,city,county,zip_code,gender,category,phone,website,description,youtube_url,facebook_url,accepts_medi_cal,accepts_medicaid,otp_available,detox_available,mat_available";

export const CARE_TYPES = ["sober-living", "residential", "outpatient", "detox", "otp", "medicaid"] as const;
export type CareType = (typeof CARE_TYPES)[number];

export type Row = {
  id: string | null; name: string | null; address: string | null; city: string | null;
  county: string | null; zip_code: string | null; gender: string | null; category: string[] | null;
  phone: string | null; website: string | null; description: string | null;
  youtube_url: string | null; facebook_url: string | null;
  accepts_medi_cal: boolean | null; accepts_medicaid: boolean | null;
  otp_available: boolean | null; detox_available: boolean | null; mat_available: boolean | null;
};

export function careTypes(r: Row): CareType[] {
  const cats = (r.category ?? []).map((c) => c.toLowerCase());
  const has = (s: string) => cats.some((c) => c.includes(s));
  const out: CareType[] = [];
  if (has("sober")) out.push("sober-living");
  if (has("inpatient") || has("residential")) out.push("residential");
  if (has("outpatient")) out.push("outpatient");
  if (r.detox_available || has("detox")) out.push("detox");
  if (r.otp_available) out.push("otp");
  if (r.accepts_medi_cal || r.accepts_medicaid) out.push("medicaid");
  return out;
}

export const toListingJson = (r: Row) => ({
  id: r.id ?? "",
  name: r.name ?? "",
  address: r.address ?? "",
  city: r.city ?? "",
  county: r.county ?? "",
  zip_code: r.zip_code ?? "",
  gender: r.gender ?? "",
  care_types: careTypes(r),
  phone: r.phone ?? "",
  website: r.website ?? "",
  video_tour: r.youtube_url ?? "",
  facebook: r.facebook_url ?? "",
  description: r.description ?? "",
  url: `${SITE}/listing/${r.id}`,
});

export const clean = (s: string) => s.replace(/[%,()*]/g, " ").trim();
