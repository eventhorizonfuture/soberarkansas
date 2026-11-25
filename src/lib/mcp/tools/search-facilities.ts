import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CARE_TYPES, LISTING_FIELDS, careTypes, clean, supabaseAnon, toListingJson, type Row } from "../supabase";

export default defineTool({
  name: "search_facilities",
  title: "Search Arkansas recovery facilities",
  description:
    "Search Sober Arkansas's public directory of sober living homes and treatment centers by city, county, ZIP, name, or care type.",
  inputSchema: {
    city: z.string().trim().max(60).optional().describe("Arkansas city, e.g. Little Rock."),
    county: z.string().trim().max(60).optional().describe("County name, e.g. Pulaski."),
    zip: z.string().trim().max(10).optional().describe("ZIP code."),
    name: z.string().trim().max(100).optional().describe("Part of the facility name."),
    care_type: z.enum(CARE_TYPES).optional().describe("sober-living, residential, outpatient, detox, otp, or medicaid."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max results."),
    offset: z.number().int().min(0).default(0).describe("Pagination offset."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, county, zip, name, care_type, limit, offset }) => {
    const db = supabaseAnon();
    let rows: Row[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      let q = db.from("listings_public").select(LISTING_FIELDS).order("name").range(from, from + 999);
      if (city) q = q.ilike("city", clean(city));
      if (county) q = q.ilike("county", `${clean(county).replace(/\s+county$/i, "")}%`);
      if (zip) q = q.ilike("zip_code", `${clean(zip)}%`);
      if (name) q = q.ilike("name", `%${clean(name)}%`);
      const { data, error } = await q;
      if (error) throw new ToolError("Search failed. Try again.");
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < 1000) break;
    }
    if (care_type) rows = rows.filter((r) => careTypes(r).includes(care_type));
    const listings = rows.slice(offset, offset + limit).map(toListingJson);
    const summary = listings.length
      ? listings.map((l) => `- ${l.name} — ${l.city} — ${l.phone} [${l.care_types.join(", ")}] ${l.url}`).join("\n")
      : "No matching listings.";
    return {
      content: [{ type: "text", text: `${rows.length} total matches.\n${summary}` }],
      structuredContent: { total: rows.length, listings },
    };
  },
});
