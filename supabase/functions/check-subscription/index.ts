import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { findCustomerForUser } from "../_shared/stripe-billing.ts";

const ALLOWED_ORIGINS = [
  "https://soberarkansas.com",
  "https://soberarkansas.lovable.app",
  "https://id-preview--20d70265-d03e-48eb-8694-553990680867.lovable.app",
  "https://20d70265-d03e-48eb-8694-553990680867.lovableproject.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customer = await findCustomerForUser(stripe, user.id);

    if (!customer) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscriptions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customer.id;
    logStep("Found customer");

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    // Also sync to featured_listings table
    const activeSubs = subscriptions.data.map((sub) => ({
      subscription_id: sub.id,
      product_id: sub.items.data[0]?.price?.product,
      price_id: sub.items.data[0]?.price?.id,
      listing_id: sub.metadata?.listing_id || null,
      city: sub.metadata?.city || null,
      tier: sub.metadata?.tier || null,
      end_date: new Date(sub.current_period_end * 1000).toISOString(),
    }));

    // Upsert featured_listings for active subs
    for (const sub of activeSubs) {
      if (sub.listing_id && sub.city && sub.tier) {
        const { error } = await supabaseClient
          .from('featured_listings')
          .upsert({
            listing_id: sub.listing_id,
            user_id: user.id,
            city: sub.city,
            tier: sub.tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.subscription_id,
            status: 'active',
          }, { onConflict: 'city,tier,listing_id' });
        if (error) logStep("Upsert error", { error: error.message });
      }
    }

    logStep("Returning subscriptions", { count: activeSubs.length });
    return new Response(JSON.stringify({ subscriptions: activeSubs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
