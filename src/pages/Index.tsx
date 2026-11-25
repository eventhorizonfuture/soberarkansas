import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowRight, Users, BookOpen, PlusCircle, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RecoveryInfoSection from '@/components/RecoveryInfoSection';
import FaqSection, { faqItems } from '@/components/FaqSection';
import SeoQuestionsSection, { seoQuestions } from '@/components/SeoQuestionsSection';
import DirectoryCard from '@/components/DirectoryCard';
import Delta from '@/components/Delta';
import { buildSiteJsonLd } from '@/lib/seo/listingJsonLd';
import { useListings } from '@/hooks/useListings';
import { useCounties } from '@/hooks/useArkansas';
import { DIR_FILTERS, REGIONS, regionForCounty, isSoberLiving, isTreatment, normCounty, countyLabel } from '@/lib/arkansas';

const BASE_URL = 'https://soberarkansas.com';

// Homepage "Browse by County" shows only the six most populous counties,
// in population order; the full list of 75 lives on /counties.
const TOP_COUNTIES_BY_POPULATION = ['Pulaski', 'Benton', 'Washington', 'Sebastian', 'Faulkner', 'Saline'];

const Index = () => {
  // SEO meta tags & JSON-LD
  useEffect(() => {
    const title = 'Sober Arkansas | Arkansas Treatment & Sober Living Directory';
    const description = 'Every treatment center and sober living home in Arkansas, in one free directory. Search rehabs, detox, outpatient, and sober living by city, county, or ZIP.';
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', BASE_URL);
    setMeta('property', 'og:type', 'website');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', BASE_URL);

    const jsonLd = buildSiteJsonLd({ baseUrl: BASE_URL, siteName: 'Sober Arkansas', description, stateName: 'Arkansas' });
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'homepage-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    document.getElementById('homepage-jsonld')?.remove();
    document.head.appendChild(script);

    // Single combined FAQPage schema (avoids duplicate FAQPage error in Search Console)
    const allFaqs = [...faqItems, ...seoQuestions];
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.id = 'homepage-faq-jsonld';
    faqScript.textContent = JSON.stringify(faqSchema);
    document.getElementById('homepage-faq-jsonld')?.remove();
    document.head.appendChild(faqScript);

    return () => {
      document.title = prevTitle;
      ['description', 'og:title', 'og:description', 'og:url', 'og:type'].forEach(name => {
        const isP = name.startsWith('og:');
        document.querySelector(`meta[${isP ? 'property' : 'name'}="${name}"]`)?.remove();
      });
      document.querySelector('link[rel="canonical"]')?.remove();
      document.getElementById('homepage-jsonld')?.remove();
      document.getElementById('homepage-faq-jsonld')?.remove();
    };
  }, []);
  const { listings, isLoading } = useListings();
  const { data: counties = [] } = useCounties();
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const covered = new Set(listings.map((l) => normCounty(l.county)).filter(Boolean));
    return [
      { label: 'Total listings', value: listings.length },
      { label: 'Sober living homes', value: listings.filter(isSoberLiving).length },
      { label: 'Treatment centers', value: listings.filter(isTreatment).length },
      { label: 'Counties covered', value: covered.size },
    ];
  }, [listings]);
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(REGIONS.map((r) => [r.key, 0]));
    for (const l of listings) {
      const d = regionForCounty(l.county);
      if (d) counts[d] += 1;
    }
    return counts;
  }, [listings]);
  // Homepage rows only ever show listings that have a photo; search/browse pages still show everything.
  const photoListings = useMemo(() => listings.filter((l) => Boolean(l.image || l.images?.length)), [listings]);
  const recent = useMemo(
    () => [...photoListings].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6),
    [photoListings],
  );
  const topCounties = useMemo(
    () => TOP_COUNTIES_BY_POPULATION
      .map((name) => counties.find((c) => normCounty(c.name) === normCounty(name)))
      .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [counties],
  );
  const go = (e: React.FormEvent) => { e.preventDefault(); navigate(`/directory${q ? `?q=${encodeURIComponent(q)}` : ''}`); };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Masthead (DELTA): wide-tracked kicker, plain name and tagline, search first, flat lowland-horizon art below. */}
        <section className="border-b border-foreground/20 px-4 pt-12 sm:pt-16">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brick">SoberArkansas.com</p>
            <h1 className="text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">Arkansas&apos;s treatment and sober living directory</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">Every rehab, detox program, outpatient clinic, and sober living home in Arkansas, in one free list. Search by city, county, or ZIP. No referral fees. No sign-up.</p>
            <div className="mx-auto mt-7 max-w-2xl border-y-2 border-accent/60 py-3 text-base text-foreground">
              <p>Need help now? Call or text <a href="tel:988" className="font-bold text-accent">988</a> — free, open 24 hours, anywhere in Arkansas.</p>
            </div>
            <form onSubmit={go} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-lg border-2 border-foreground/70 bg-card p-3 shadow-card sm:flex-row">
              <label className="flex flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, county, or ZIP" aria-label="Search by city, county, or ZIP" className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
              </label>
              <button className="min-h-12 rounded-md bg-primary px-8 text-base font-bold text-primary-foreground hover:opacity-90">Find Help</button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-2 pb-10">
              {DIR_FILTERS.map((f) => (
                <Link key={f.key} to={`/directory?f=${f.key}`} className="rounded-full border border-foreground/40 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">{f.label}</Link>
              ))}
            </div>
          </div>
          <Delta className="block h-24 w-full sm:h-32" />
        </section>

        <section className="container mx-auto px-4 pt-10">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-foreground/25 bg-foreground/25 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-4 text-center">
                <p className="text-3xl font-bold text-primary sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>{isLoading ? '—' : s.value.toLocaleString()}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pick your part of the state (DELTA region tiles, river-blue bands). */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Pick your part of the state</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Arkansas runs from the Ozark hills and the River Valley down through Little Rock to the flat Delta farm country along the Mississippi, and treatment looks different in Fayetteville than it does in Pine Bluff. Start with your part of it.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REGIONS.map((d) => (
              <Link key={d.key} to={`/directory?region=${d.key}`} className="group overflow-hidden rounded-lg border border-foreground/25 bg-card shadow-card transition-shadow hover:shadow-card-hover">
                <div className="flex items-center gap-1.5 bg-primary px-5 py-3" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                  <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{d.short}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary">{d.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d.anchor}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">{isLoading ? 'Loading listings…' : `${regionCounts[d.key].toLocaleString()} listings · ${d.counties.length} jurisdictions`}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Free and low-cost options first (names no facility as free). */}
        <section className="border-y border-foreground/25 bg-secondary/50 px-4 py-16">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Free and low-cost options first</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Money should not decide whether somebody gets help. These state lines can tell you what is open and what takes Medicaid before you call a single facility. No facility pays to be in this directory.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: '988 Crisis Line', phone: 'Call or text 988', href: 'tel:988', text: 'For a mental health or substance use crisis, any hour. Free and confidential, anywhere in Arkansas.' },
                { title: 'DHS Support Line', phone: '1-844-763-0198', href: 'tel:18447630198', text: 'The Arkansas Mental Health & Addiction Support Line, run by the Department of Human Services (Office of Substance Abuse and Mental Health). Call Monday through Friday, 8 am to 5 pm, to locate a treatment provider in your area.' },
                { title: 'Arkansas Medicaid', phone: 'humanservices.arkansas.gov', href: 'https://humanservices.arkansas.gov', text: 'Arkansas Medicaid, run by the Arkansas Department of Human Services, covers detox, rehab, and medications for addiction treatment for people who qualify.' },
                { title: 'Catchment-area providers', phone: 'All 75 counties', href: '/for-counselors', text: 'Arkansas has no county-by-county authority. The DHS Office of Substance Abuse and Mental Health funds services through one contracted provider in each of eight catchment areas covering every county. Find your county\'s provider on the county pages.' },
              ].map((c) => (
                <a key={c.title} href={c.href} {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="group rounded-lg border border-foreground/25 bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
                  <Phone className="h-7 w-7 text-brick" />
                  <h3 className="mt-3 text-lg font-bold text-foreground">{c.title}</h3>
                  <p className="text-sm font-bold text-primary">{c.phone}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Recently Added</h2>
            <Link to="/directory" className="flex items-center gap-1 text-sm font-bold text-primary">See all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {isLoading ? (
            <p className="rounded-lg border border-foreground/25 bg-card p-8 text-center text-muted-foreground">Loading the newest listings…</p>
          ) : recent.length === 0 ? (
            <p className="rounded-lg border border-foreground/25 bg-card p-8 text-center text-muted-foreground">New listings will appear here soon.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recent.map((l) => <DirectoryCard key={l.id} listing={l} />)}</div>
          )}
        </section>

        <section className="border-t border-foreground/25 px-4 py-16">
          <div className="container mx-auto grid gap-5 md:grid-cols-3">
            {[
              { to: '/for-counselors', icon: Users, title: 'For Counselors', text: 'County crisis lines, catchment-area provider contacts, and referral resources for all 75 counties.' },
              { to: '/recovery-resources', icon: BookOpen, title: 'Recovery Resources', text: 'Plain-language guides on licensing, levels of care, and Medicaid.' },
              { to: '/get-listed', icon: PlusCircle, title: 'Get Listed', text: 'Run a treatment center or sober living home? Add your facility for free.' },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="group rounded-lg border border-foreground/25 bg-card p-7 shadow-card transition-shadow hover:shadow-card-hover">
                <c.icon className="h-9 w-9 text-brick" />
                <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">Browse by County</h2>
          <div className="flex flex-wrap gap-2">
            {topCounties.map((c) => (
              <Link key={c.id} to={`/counties/${c.slug}`} className="rounded-full border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">{countyLabel(c.name)}</Link>
            ))}
          </div>
          <Link to="/counties" className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary">View all 75 counties <ArrowRight className="h-4 w-4" /></Link>
        </section>

        <RecoveryInfoSection />
        <FaqSection />
        <SeoQuestionsSection />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
