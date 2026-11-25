import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.22.4";
import { findCustomerForUser, safeOrigin, TIER_PRICES } from "../_shared/stripe-billing.ts";

const checkoutSchema = z.object({
  priceId: z.string().max(100).optional(),
  listingId: z.string().uuid(),
  city: z.string().trim().min(1).max(100),
  tier: z.enum(["featured"]),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // CORS headers defined at top level
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { listingId, city, tier } = parsed.data;
    const priceId = TIER_PRICES[tier];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    let customer = await findCustomerForUser(stripe, user.id);
    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
    }
    const customerId = customer.id;

    const origin = safeOrigin(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/listing/${listingId}?featured=success`,
      cancel_url: `${origin}/listing/${listingId}?featured=canceled`,
      metadata: {
        listing_id: listingId,
        city,
        tier,
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout error", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Unable to start checkout" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
