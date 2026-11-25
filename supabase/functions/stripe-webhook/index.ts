import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// No CORS needed - webhooks come from Stripe servers, not browsers

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  // Reject browser preflight - this endpoint is for Stripe servers only
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { listing_id, city, tier, user_id } = session.metadata || {};

        if (listing_id && city && tier && user_id && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const { error } = await supabaseClient.from("featured_listings").upsert(
            {
              listing_id,
              city,
              tier,
              user_id,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? null,
              status: "active",
            },
            { onConflict: "city,tier,listing_id" }
          );
          if (error) logStep("Upsert error on checkout.session.completed", { error: error.message });
          else logStep("Featured listing activated", { listing_id, city, tier });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const subId = subscription.id;

        if (status === "active") {
          logStep("Subscription still active", { subId });
        } else {
          // Mark as inactive for any non-active status (past_due, unpaid, etc.)
          const { error } = await supabaseClient
            .from("featured_listings")
            .update({ status: "inactive" })
            .eq("stripe_subscription_id", subId);
          if (error) logStep("Update error", { error: error.message });
          else logStep("Listing set inactive", { subId, status });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;

        const { error } = await supabaseClient
          .from("featured_listings")
          .update({ status: "inactive" })
          .eq("stripe_subscription_id", subId);
        if (error) logStep("Delete-update error", { error: error.message });
        else logStep("Listing deactivated on cancellation", { subId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
