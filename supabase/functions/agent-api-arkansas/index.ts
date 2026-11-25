// Public, read-only directory API for AI agents. Uses only the anon key and
// public views/tables, so it can never expose private or admin data.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SITE = "https://soberarkansas.com";
const FIELDS =
  "id,name,address,city,county,zip_code,gender,category,phone,website,description,youtube_url,facebook_url,accepts_medi_cal,accepts_medicaid,otp_available,detox_available,lat,lng,image,updated_at";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARE = ["sober-living", "residential", "outpatient", "detox", "otp", "medicaid"] as const;

const Query = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  county: z.string().trim().max(60).optional(),
  zip: z.string().trim().max(10).optional(),
  care_type: z.enum(CARE).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  format: z.enum(["json", "md"]).default("json"),
});

type Listing = Record<string, any> & { id: string; name: string };

const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { db: { schema: "arkansas" } });
const clean = (s: string) => s.replace(/[%,()*]/g, " ").trim();

function careTypes(l: Listing): string[] {
  const cats = ((l.category ?? []) as string[]).map((c) => c.toLowerCase());
  const has = (s: string) => cats.some((c) => c.includes(s));
  const out: string[] = [];
  if (has("sober")) out.push("sober-living");
  if (has("inpatient") || has("residential")) out.push("residential");
  if (has("outpatient")) out.push("outpatient");
  if (l.detox_available || has("detox")) out.push("detox");
  if (l.otp_available) out.push("otp");
  if (l.accepts_medi_cal || l.accepts_medicaid) out.push("medicaid");
  return out;
}

const shape = (l: Listing) => ({ ...l, care_types: careTypes(l), url: `${SITE}/listing/${l.id}` });

function toMd(l: Listing): string {
  const lines = [`## ${l.name}`, ""];
  const add = (k: string, v: unknown) => {
    if (v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length))
      lines.push(`- **${k}:** ${Array.isArray(v) ? v.join(", ") : v}`);
  };
  add("Address", [l.address, l.city, "SC", l.zip_code].filter(Boolean).join(", "));
  add("County", l.county);
  add("Care", careTypes(l));
  add("Gender", l.gender);
  add("Phone", l.phone);
  add("Website", l.website);
  add("Video tour", l.youtube_url);
  add("Page", `${SITE}/listing/${l.id}`);
  if (l.description) lines.push("", String(l.description));
  return lines.join("\n");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
const text = (body: string, type: string) =>
  new Response(body, {
    headers: { ...cors, "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "public, max-age=600" },
  });

async function allListings(): Promise<Listing[]> {
  const all: Listing[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db().from("listings_public").select(FIELDS).order("city").order("name").range(from, from + 999);
    if (error) throw error;
    all.push(...((data ?? []) as Listing[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

async function llmsFull(): Promise<string> {
  const all = await allListings();
  const out = [
    "# Sober Arkansas — Full Directory",
    "",
    `> ${all.length} sober living homes and treatment centers across Arkansas. Source: ${SITE}. Call ahead to confirm availability. In a crisis call 988.`,
    "",
  ];
  let city = "";
  for (const l of all) {
    const c = String(l.city || "Other");
    if (c !== city) { city = c; out.push(`# ${city}`, ""); }
    out.push(toMd(l), "");
  }
  return out.join("\n");
}

function openapi(base: string) {
  const p = (name: string, schema: object, d: string) => ({ name, in: "query", required: false, schema, description: d });
  return {
    openapi: "3.0.3",
    info: { title: "Sober Arkansas Directory API", version: "1.0.0", description: "Read-only public data on Arkansas sober living and addiction treatment facilities, plus county counselor resources." },
    servers: [{ url: base }],
    paths: {
      "/listings": {
        get: {
          operationId: "searchListings",
          summary: "Search facilities",
          parameters: [
            p("q", { type: "string" }, "Text search on name"),
            p("city", { type: "string" }, "Arkansas city, e.g. Little Rock"),
            p("county", { type: "string" }, "County name, e.g. Pulaski"),
            p("zip", { type: "string" }, "ZIP code"),
            p("care_type", { type: "string", enum: CARE }, "Type of care"),
            p("limit", { type: "integer", minimum: 1, maximum: 100, default: 25 }, "Page size"),
            p("offset", { type: "integer", minimum: 0, default: 0 }, "Pagination offset"),
            p("format", { type: "string", enum: ["json", "md"], default: "json" }, "Response format"),
          ],
          responses: { "200": { description: "Matching listings" } },
        },
      },
      "/listings/{id}": {
        get: {
          operationId: "getListing",
          summary: "Get one facility",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            p("format", { type: "string", enum: ["json", "md"], default: "json" }, "Response format"),
          ],
          responses: { "200": { description: "Listing" }, "404": { description: "Not found" } },
        },
      },
      "/counties": { get: { operationId: "listCounties", summary: "All 100 Arkansas counties with access and crisis lines", responses: { "200": { description: "Counties" } } } },
      "/county-resources": {
        get: {
          operationId: "countyResources",
          summary: "Counselor resources for a county (omit county for statewide)",
          parameters: [p("county", { type: "string" }, "County name or slug")],
          responses: { "200": { description: "Resources" } },
        },
      },
      "/llms-full.txt": { get: { operationId: "fullDirectory", summary: "Entire directory as markdown", responses: { "200": { description: "Markdown" } } } },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/agent-api-arkansas/, "") || "/";
  const wantsMd = (req.headers.get("accept") || "").includes("text/markdown");

  try {
    if (path === "/" || path === "/openapi.json") {
      return json(openapi(`${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-api-arkansas`));
    }
    if (path === "/llms-full.txt") return text(await llmsFull(), "text/markdown");

    if (path === "/counties") {
      const { data, error } = await db().from("counties").select("name,slug,access_line,access_line_label,crisis_line").order("name");
      if (error) throw error;
      return json({ total: data?.length ?? 0, results: (data ?? []).map((c) => ({ ...c, url: `${SITE}/for-counselors/${c.slug}` })) });
    }

    const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const qp = parsed.data;
    const md = qp.format === "md" || wantsMd;

    if (path === "/county-resources") {
      let countyRow: { id: string; name: string } | null = null;
      if (qp.county) {
        const c = clean(qp.county).replace(/\s+county$/i, "");
        const { data, error } = await db().from("counties").select("id,name")
          .or(`name.ilike.${c},slug.eq.${c.toLowerCase().replace(/\s+/g, "-")}`).maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "Unknown county" }, 404);
        countyRow = data;
      }
      let q = db().from("county_resources").select("title,description,phone,website,category").order("sort_order").order("title");
      q = countyRow ? q.eq("county_id", countyRow.id) : q.is("county_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return json({ county: countyRow?.name ?? "statewide", results: data ?? [] });
    }

    const one = path.match(/^\/listings\/([^/]+)$/);
    if (one) {
      if (!UUID.test(one[1])) return json({ error: "Invalid id" }, 400);
      const { data, error } = await db().from("listings_public").select(FIELDS).eq("id", one[1]).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Not found" }, 404);
      return md ? text(toMd(data as Listing), "text/markdown") : json(shape(data as Listing));
    }

    if (path === "/listings") {
      let rows: Listing[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        let query = db().from("listings_public").select(FIELDS).order("name").range(from, from + 999);
        if (qp.q) query = query.ilike("name", `%${clean(qp.q)}%`);
        if (qp.city) query = query.ilike("city", clean(qp.city));
        if (qp.county) query = query.ilike("county", `${clean(qp.county).replace(/\s+county$/i, "")}%`);
        if (qp.zip) query = query.ilike("zip_code", `${clean(qp.zip)}%`);
        const { data, error } = await query;
        if (error) throw error;
        rows.push(...((data ?? []) as Listing[]));
        if (!data || data.length < 1000) break;
      }
      if (qp.care_type) rows = rows.filter((l) => careTypes(l).includes(qp.care_type!));
      const page = rows.slice(qp.offset, qp.offset + qp.limit);
      if (md) return text(page.map(toMd).join("\n\n") || "No results.", "text/markdown");
      return json({ total: rows.length, limit: qp.limit, offset: qp.offset, results: page.map(shape) });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
});
