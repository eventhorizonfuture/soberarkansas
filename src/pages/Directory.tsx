import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';
import DirectoryCard from '@/components/DirectoryCard';
import { useListings } from '@/hooks/useListings';
import { DIR_FILTERS, DirFilter, listingTags, matchesQuery, REGIONS, regionForCounty } from '@/lib/arkansas';

const Directory = () => {
  const { listings, isLoading } = useListings();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const region = params.get('region') || '';
  const regionName = REGIONS.find((d) => d.key === region)?.name;
  const active = new Set((params.get('f') || '').split(',').filter(Boolean) as DirFilter[]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const toggle = (f: DirFilter) => {
    const s = new Set(active);
    if (s.has(f)) s.delete(f); else s.add(f);
    setParam('f', Array.from(s).join(','));
  };

  const results = useMemo(() => listings.filter((l) => {
    if (region && regionForCounty(l.county) !== region) return false;
    if (!matchesQuery(l, q)) return false;
    const tags = listingTags(l);
    for (const f of active) if (!tags.has(f)) return false;
    return true;
  }), [listings, q, params]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell title="Arkansas Recovery Directory" description="Search every Arkansas treatment center and sober living home by city, county, or ZIP.">
      <PageHero eyebrow="Directory" title="Find treatment and sober living" subtitle="Search by city, county, or ZIP, then narrow by the type of care you need.">
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card-hover">
          <Search className="ml-2 h-5 w-5 text-muted-foreground" />
          <input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="City, county, or ZIP" aria-label="Search" className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
      </PageHero>
      <section className="container mx-auto px-4 py-8">
        {regionName && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-foreground/25 bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Showing {regionName} only.</p>
            <button onClick={() => setParam('region', '')} className="text-sm font-bold text-primary underline underline-offset-2">Show the whole state</button>
          </div>
        )}
        <div className="mb-6 flex flex-wrap gap-2">
          {DIR_FILTERS.map((f) => (
            <button key={f.key} onClick={() => toggle(f.key)} aria-pressed={active.has(f.key)}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${active.has(f.key) ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground hover:border-primary'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="mb-5 text-sm font-semibold text-muted-foreground">{isLoading ? 'Loading…' : `${results.length.toLocaleString()} result${results.length === 1 ? '' : 's'}`}</p>
        {!isLoading && results.length === 0 ? (
          <p className="rounded-2xl bg-card p-10 text-center text-muted-foreground">No listings match yet. Try a nearby city or remove a filter.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.map((l) => <DirectoryCard key={l.id} listing={l} />)}</div>
        )}
      </section>
    </PageShell>
  );
};

export default Directory;
