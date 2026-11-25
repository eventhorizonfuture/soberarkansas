import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Printer } from 'lucide-react';
import CityCrossLinks from '@/components/CityCrossLinks';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ListingRow from '@/components/ListingRow';
import { useListings } from '@/hooks/useListings';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useMemo } from 'react';
import useFaqSchema from '@/hooks/useFaqSchema';
import { useCityPageSeo } from '@/hooks/useCityPageSeo';
import { isTreatment } from '@/lib/arkansas';

export interface CityPageConfig {
  city: string;
  county: string; // e.g. "Jackson County"
  slug: string; // e.g. "sober-living-kansas-city-arkansas"
  intro: (counts: { programs: number; homes: number }) => string[];
  faq: { q: string; a: string }[];
}

const SoberLivingCity = ({ config }: { config: CityPageConfig }) => {
  const { city, county, slug } = config;
  const { listings, isLoading } = useListings();
  const { isFeatured } = useFeaturedListings();
  useFaqSchema(config.faq);
  const cityListings = useMemo(
    () => listings.filter((l) => l.city.toLowerCase() === city.toLowerCase() && l.category.includes('sober-living')),
    [listings, city],
  );
  const counts = useMemo(() => {
    const inCity = listings.filter((l) => l.city.toLowerCase() === city.toLowerCase());
    return { programs: inCity.filter(isTreatment).length, homes: cityListings.length };
  }, [listings, city, cityListings]);
  useCityPageSeo({ city, slug, county, listings: cityListings });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary/5 border-b px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Sober Living in {city}, Arkansas</h1>
            {config.intro(counts).map((p, i) => (
              <p key={i} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">{p}</p>
            ))}
          </div>
        </section>
        <section className="px-4 py-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{city} Area Recovery Housing Listings</h2>
            <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          </div>
          {isLoading ? (<p className="text-sm text-muted-foreground">Loading listings…</p>) : cityListings.length === 0 ? (<p className="text-sm text-muted-foreground">No sober living listings found for {city} at this time.</p>) : (
            <div className="border rounded-lg divide-y">{cityListings.map((listing) => (<ListingRow key={listing.id} listing={listing} onHover={() => {}} isHovered={false} isFeatured={isFeatured(listing.id)} />))}</div>
          )}
          <div className="flex justify-center pt-8"><Link to="/"><Button size="lg" className="gap-2 rounded-lg"><Search className="h-4 w-4" />Browse Full Arkansas Recovery Housing Directory</Button></Link></div>
        </section>
        <section className="px-4 py-12 max-w-3xl mx-auto space-y-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center" style={{ fontFamily: 'var(--font-heading)' }}>{city} Sober Living — Frequently Asked Questions</h2>
          <div className="space-y-6">{config.faq.map((item, i) => (<div key={i} className="border rounded-lg p-6 bg-muted/30"><h3 className="font-bold text-base sm:text-lg text-foreground mb-2">{item.q}</h3><p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.a}</p></div>))}</div>
        </section>
        <CityCrossLinks currentCity={city} />
        <div className="flex justify-center pb-10"><Link to="/"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Statewide Directory</Button></Link></div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SoberLivingCity;
