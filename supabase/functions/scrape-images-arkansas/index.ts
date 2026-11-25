import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  // Admin-only: verify the caller and their admin role server-side.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    db: { schema: 'arkansas' },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims } = await userClient.auth.getClaims(authHeader.slice(7));
  const uid = claims?.claims?.sub;
  if (!uid) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: isAdmin } = await userClient.rpc('has_role', { _user_id: uid, _role: 'admin' });
  if (!isAdmin) return json({ success: false, error: 'Forbidden' }, 403);

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Only public http(s) hosts on standard ports; block internal/private targets.
    let target: URL;
    try { target = new URL(formattedUrl); } catch { return json({ success: false, error: 'Invalid URL' }, 400); }
    const host = target.hostname.toLowerCase();
    const isPrivate =
      !['http:', 'https:'].includes(target.protocol) ||
      (target.port && !['80', '443'].includes(target.port)) ||
      target.username || target.password ||
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local') ||
      !host.includes('.') || host.includes(':') || host.startsWith('[') ||
      /^(0|10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\./.test(host) ||
      /^\d+$/.test(host) || host === 'metadata.google.internal';
    if (isPrivate) return json({ success: false, error: 'URL not allowed' }, 400);

    const response = await fetch(target.href, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // ── Extract images ──
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const bgRegex = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
    const srcsetRegex = /<(?:img|source)[^>]+srcset=["']([^"']+)["'][^>]*>/gi;

    const imageUrls = new Set<string>();
    let match;
    while ((match = imgRegex.exec(html)) !== null) imageUrls.add(match[1]);
    while ((match = bgRegex.exec(html)) !== null) imageUrls.add(match[1]);
    while ((match = srcsetRegex.exec(html)) !== null) {
      match[1].split(',').forEach((entry: string) => {
        const parts = entry.trim().split(/\s+/);
        if (parts[0]) imageUrls.add(parts[0]);
      });
    }

    const baseUrl = new URL(formattedUrl);
    const resolved = Array.from(imageUrls)
      .map((src) => {
        try {
          if (src.startsWith('data:')) return null;
          if (src.startsWith('//')) return `https:${src}`;
          if (src.startsWith('/')) return `${baseUrl.origin}${src}`;
          if (src.startsWith('http')) return src;
          return new URL(src, formattedUrl).href;
        } catch { return null; }
      })
      .filter((u): u is string => !!u)
      .filter((u) => {
        const lower = u.toLowerCase();
        return !lower.includes('favicon') && !lower.includes('pixel') &&
               !lower.includes('tracking') && !lower.includes('1x1') &&
               !lower.endsWith('.svg') && !lower.endsWith('.ico');
      });

    const uniqueImages = [...new Set(resolved)];
    console.log(`Found ${uniqueImages.length} images`);

    // ── Extract text for AI parsing ──
    // Strip tags to get raw text
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to avoid token overflow

    let facilityInfo = null;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (apiKey && textContent.length > 50) {
      try {
        console.log('Extracting facility info via AI...');
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You extract facility/organization information from webpage text. Return ONLY a JSON object with these fields (use null for any field you cannot determine):
{
  "name": "Facility name",
  "phone": "Phone number(s)",
  "address": "Street address",
  "city": "City",
  "zipCode": "ZIP code",
  "description": "Brief description of services (2-3 sentences max)",
  "website": "Website URL",
  "features": ["feature1", "feature2"],
  "gender": "men" | "women" | "co-ed" | null,
  "priceRange": "Price info if available",
  "matAvailable": true/false/null,
  "telehealthAvailable": true/false/null,
  "acceptsMedicaid": true/false/null,
  "acceptsPrivatePay": true/false/null,
  "detoxAvailable": true/false/null
}
Only include factual information found in the text. Do not fabricate.`
              },
              {
                role: 'user',
                content: `Extract facility information from this webpage (URL: ${formattedUrl}):\n\n${textContent}`
              }
            ],
            temperature: 0.1,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          // Parse JSON from response (handle markdown code blocks)
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          try {
            facilityInfo = JSON.parse(jsonMatch[1]!.trim());
            console.log('AI extraction successful');
          } catch {
            console.error('Failed to parse AI response as JSON');
          }
        }
      } catch (err) {
        console.error('AI extraction error:', err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, images: uniqueImages, facilityInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
