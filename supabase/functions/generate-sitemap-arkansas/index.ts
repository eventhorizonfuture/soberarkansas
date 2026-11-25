import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://soberarkansas.com";

const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/arkansas-directory", changefreq: "daily", priority: "0.9" },
  { loc: "/all-listings", changefreq: "weekly", priority: "0.8" },
  { loc: "/sober-living-little-rock-arkansas", changefreq: "weekly", priority: "0.8" },
  { loc: "/sober-living-fort-smith-arkansas", changefreq: "weekly", priority: "0.8" },
  { loc: "/sober-living-fayetteville-arkansas", changefreq: "weekly", priority: "0.8" },
  { loc: "/sober-living-jonesboro-arkansas", changefreq: "weekly", priority: "0.8" },
  { loc: "/agents", changefreq: "monthly", priority: "0.6" },
  { loc: "/list-your-home", changefreq: "monthly", priority: "0.6" },
  { loc: "/featured", changefreq: "monthly", priority: "0.6" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { db: { schema: "arkansas" } }
    );

    // Fetch all listing IDs and updated_at — paginate past the 1000-row default limit
    const listings: { id: string; updated_at: string }[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("listings_public")
        .select("id, updated_at")
        .order("name")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      listings.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of STATIC_URLS) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic listing pages
    for (const listing of listings || []) {
      const lastmod = listing.updated_at
        ? listing.updated_at.split("T")[0]
        : undefined;
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/listing/${listing.id}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(`Error generating sitemap: ${err.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
