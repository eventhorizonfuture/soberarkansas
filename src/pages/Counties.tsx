import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import PageShell, { PageHero } from '@/components/PageShell';
import { useCounties } from '@/hooks/useArkansas';
import { useListings } from '@/hooks/useListings';
import { normCounty, countyLabel } from '@/lib/arkansas';

const Counties = () => {
  const { data: counties = [] } = useCounties();
  const { listings } = useListings();
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    listings.forEach((l) => { const k = normCounty(l.county); if (k) m.set(k, (m.get(k) || 0) + 1); });
    return m;
  }, [listings]);
  return (
    <PageShell title="Recovery Resources by Arkansas County" description="Treatment centers, sober living homes, and counselor resources for all 95 Arkansas counties.">
      <PageHero eyebrow="All 75 counties" title="Recovery resources by county" subtitle="Pick a county to see its treatment centers, sober living homes, and local resources." />
      <section className="container mx-auto grid gap-3 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {counties.map((c) => (
          <Link key={c.id} to={`/counties/${c.slug}`} className="flex min-h-16 items-center justify-between rounded-2xl bg-card px-5 shadow-card hover:shadow-card-hover">
            <span className="font-bold text-primary">{countyLabel(c.name)}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{counts.get(normCounty(c.name)) || 0}</span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
};

export default Counties;
