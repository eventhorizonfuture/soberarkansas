import { Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';
import DirectoryCard from '@/components/DirectoryCard';
import { useCounties } from '@/hooks/useArkansas';
import { useListings } from '@/hooks/useListings';
import { isSoberLiving, isTreatment, normCounty, countyLabel } from '@/lib/arkansas';
import NotFound from './NotFound';

const CountyLanding = () => {
  const { slug } = useParams();
  const { data: counties, isLoading } = useCounties();
  const { listings } = useListings();
  const county = counties?.find((c) => c.slug === slug);
  const inCounty = useMemo(() => county ? listings.filter((l) => normCounty(l.county) === normCounty(county.name)) : [], [listings, county]);
  if (isLoading) return null;
  if (!county) return <NotFound />;
  const treatment = inCounty.filter(isTreatment);
  const sober = inCounty.filter(isSoberLiving);
  const Section = ({ title, items }: { title: string; items: typeof inCounty }) => (
    <section className="container mx-auto px-4 py-10">
      <h2 className="mb-5 text-2xl font-extrabold text-primary">{title} <span className="text-muted-foreground">({items.length})</span></h2>
      {items.length === 0 ? <p className="rounded-2xl bg-card p-8 text-center text-muted-foreground">None listed in {countyLabel(county.name)} yet.</p>
        : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <DirectoryCard key={l.id} listing={l} />)}</div>}
    </section>
  );
  return (
    <PageShell title={`Recovery Resources in ${countyLabel(county.name)}`} description={`${treatment.length} treatment centers and ${sober.length} sober living homes in ${countyLabel(county.name)}, Arkansas.`}>
      <PageHero eyebrow="County guide" title={`Recovery Resources in ${countyLabel(county.name)}`}
        subtitle={`${treatment.length} treatment center${treatment.length === 1 ? '' : 's'} · ${sober.length} sober living home${sober.length === 1 ? '' : 's'}`}>
        <Link to={`/for-counselors/${county.slug}`} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 font-bold text-accent-foreground hover:opacity-90">
          {countyLabel(county.name)} counselor resources <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={`/treatment-centers/${county.slug}`} className="ml-3 mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white/15 px-6 font-bold text-primary-foreground hover:bg-white/25">
          Treatment centers by type <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>
      <Section title="Treatment Centers" items={treatment} />
      <Section title="Sober Living Homes" items={sober} />
    </PageShell>
  );
};

export default CountyLanding;
