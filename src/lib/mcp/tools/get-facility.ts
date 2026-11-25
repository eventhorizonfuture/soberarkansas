import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { LISTING_FIELDS, supabaseAnon, toListingJson, type Row } from "../supabase";

export default defineTool({
  name: "get_facility_by_id",
  title: "Get facility details",
  description: "Get full public details for one Sober Arkansas listing by its id.",
  inputSchema: { id: z.string().uuid().describe("Listing id from search results.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const { data, error } = await supabaseAnon().from("listings_public").select(LISTING_FIELDS).eq("id", id).maybeSingle();
    if (error) throw new ToolError("Lookup failed. Try again.");
    if (!data) throw new ToolError("No listing with that id.");
    const listing = toListingJson(data as Row);
    const text = [
      listing.name,
      [listing.address, listing.city, "AR", listing.zip_code].filter(Boolean).join(", "),
      listing.county && `County: ${listing.county}`,
      `Phone: ${listing.phone}`, `Website: ${listing.website}`,
      `Care: ${listing.care_types.join(", ")}`,
      listing.video_tour && `Video tour: ${listing.video_tour}`,
      listing.description, listing.url,
    ].filter(Boolean).join("\n");
    return { content: [{ type: "text", text }], structuredContent: { listing } };
  },
});
