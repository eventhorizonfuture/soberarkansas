import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE, clean, supabaseAnon } from "../supabase";
import { countyLabel } from "../../arkansas";

export default defineTool({
  name: "get_county_resources",
  title: "Get county counselor resources",
  description:
    "Get a Arkansas county's substance use access line, crisis line, and counselor resources. Omit county for statewide resources.",
  inputSchema: {
    county: z.string().trim().max(60).optional().describe("County name or slug, e.g. Montgomery. Omit for statewide."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ county }) => {
    const db = supabaseAnon();
    let countyRow: { id: string; name: string; slug: string; access_line: string; access_line_label: string; crisis_line: string } | null = null;
    if (county) {
      const c = clean(county).replace(/\s+county$/i, "");
      const { data, error } = await db
        .from("counties")
        .select("id,name,slug,access_line,access_line_label,crisis_line")
        .or(`name.ilike.${c},slug.eq.${c.toLowerCase().replace(/\s+/g, "-")}`)
        .maybeSingle();
      if (error) throw new ToolError("Lookup failed. Try again.");
      if (!data) throw new ToolError("No Arkansas county by that name.");
      countyRow = data;
    }
    let q = db.from("county_resources").select("title,description,phone,website,category").order("sort_order").order("title");
    q = countyRow ? q.eq("county_id", countyRow.id) : q.is("county_id", null);
    const { data, error } = await q;
    if (error) throw new ToolError("Lookup failed. Try again.");
    const resources = (data ?? []).map((r) => ({
      title: r.title ?? "", description: r.description ?? "", phone: r.phone ?? "",
      website: r.website ?? "", category: r.category ?? "",
    }));
    const header = countyRow
      ? `${countyLabel(countyRow.name)}\nAccess line: ${countyRow.access_line || "not yet listed"}\nCrisis line: ${countyRow.crisis_line || "988"}\n${SITE}/for-counselors/${countyRow.slug}`
      : "Statewide Arkansas resources";
    const list = resources.map((r) => `- [${r.category}] ${r.title} ${r.phone} ${r.website}`).join("\n") || "No resources listed yet.";
    return {
      content: [{ type: "text", text: `${header}\n${list}` }],
      structuredContent: {
        county: countyRow
          ? { name: countyRow.name, slug: countyRow.slug, access_line: countyRow.access_line ?? "", crisis_line: countyRow.crisis_line ?? "" }
          : null,
        resources,
      },
    };
  },
});
