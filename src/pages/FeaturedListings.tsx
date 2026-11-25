import { Star, CheckCircle, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { FEATURED_TIERS } from '@/lib/featuredTiers';

const FeaturedListingsPage = () => {
  const tier = FEATURED_TIERS.featured;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-20 sm:py-28 text-center border-b bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/20">
          {/* Decorative floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-[10%] text-4xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>⭐</div>
            <div className="absolute top-20 right-[15%] text-3xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>✨</div>
            <div className="absolute bottom-10 left-[20%] text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>🌟</div>
            <div className="absolute bottom-16 right-[25%] text-3xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.8s' }}>💫</div>
          </div>

          <div className="relative max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-amber-500/40 bg-amber-500/15 px-5 py-2 text-sm font-bold text-amber-600 shadow-lg shadow-amber-500/10">
              <Sparkles className="h-4 w-4" /> Featured Listings
            </div>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Stand Out From<br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                The Crowd
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get your listing seen <strong>first</strong>. Featured listings get prime placement,
              a shiny badge, and way more eyeballs from people searching for recovery homes.
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="px-4 py-16 max-w-lg mx-auto">
          <div className="relative rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 to-orange-500/5 shadow-2xl shadow-amber-500/20 p-10 text-center overflow-hidden">
            {/* Ribbon */}
            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold px-8 py-1.5 rotate-[45deg] translate-x-6 translate-y-4 shadow-md">
              POPULAR
            </div>

            <div className="text-5xl mb-4">🏆</div>
            <h2
              className="text-2xl font-extrabold text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {tier.label}
            </h2>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-foreground">$49</span>
              <span className="text-lg text-muted-foreground font-medium">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Cancel anytime. No contracts.</p>

            <div className="mt-8 space-y-4 text-left">
              {[
                { icon: Star, text: 'Eye-catching featured badge' },
                { icon: TrendingUp, text: 'Top of city search results' },
                { icon: Zap, text: 'Instant activation after checkout' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{text}</span>
                </div>
              ))}
            </div>

            <a href="/get-featured">
              <Button size="lg" className="mt-8 w-full gap-2 rounded-xl text-base py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02]">
                <Star className="h-5 w-5 fill-current" /> Get Featured Now
              </Button>
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-16 max-w-3xl mx-auto border-t">
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-12"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            How It Works 🚀
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { step: '1', emoji: '🔍', title: 'Find Your Listing', desc: 'Browse the directory and open your listing\'s detail page.' },
              { step: '2', emoji: '⭐', title: 'Click "Get Featured"', desc: 'Hit the button and complete checkout through our secure payment portal.' },
              { step: '3', emoji: '🎉', title: 'You\'re Featured!', desc: 'Your listing is promoted instantly with a featured badge in city results.' },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <div className="text-4xl">{item.emoji}</div>
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-8 max-w-md mx-auto text-center">
            Don't see your listing in the directory yet?{' '}
            <a
              href="mailto:ContactSoberOhio@gmail.com?subject=List%20My%20Sober%20Living%20Home"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
            >
              Email us
            </a>{' '}
            and we'll get you added — it's free!
          </p>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 max-w-3xl mx-auto border-t">
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-10"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Questions? We Got You 💬
          </h2>
          <div className="space-y-4">
            {[
              { q: 'How does featured placement work?', a: 'Featured listings appear at the top of city search results with a prominent badge, giving you maximum visibility to people searching for recovery resources.' },
              { q: 'What happens if I cancel?', a: 'Your listing stays featured until the end of your billing period. After that, it returns to its normal position. No hard feelings!' },
              { q: 'Is there a contract?', a: 'Nope! Month-to-month billing. Cancel anytime with zero penalties.' },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border bg-card p-6 hover:border-amber-500/30 transition-colors">
                <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 max-w-3xl mx-auto text-center border-t">
          <div className="text-4xl mb-4">🌟</div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ready to Shine?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join other sober living homes already getting more visibility. Get featured today!
          </p>
          <a href="/get-featured">
            <Button size="lg" className="gap-2 rounded-xl text-base px-10 py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02]">
              <Sparkles className="h-5 w-5" /> Let's Do This
            </Button>
          </a>
          <p className="text-sm text-muted-foreground mt-6">
            Have questions? Email us at{' '}
            <a
              href="mailto:ContactSoberOhio@gmail.com?subject=Featured%20Listing%20Question"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
            >
              ContactSoberOhio@gmail.com
            </a>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default FeaturedListingsPage;
