import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { SoberLivingHome } from '@/data/listings';
import { DIR_FILTERS, listingTags } from '@/lib/arkansas';

const AdminCounts = ({ listings }: { listings: SoberLivingHome[] }) => {
  const { byCat, byCounty } = useMemo(() => {
    const byCat = DIR_FILTERS.map((f) => ({ label: f.label, n: listings.filter((l) => listingTags(l).has(f.key)).length }));
    const m = new Map<string, number>();
    listings.forEach((l) => { const c = (l.county || 'No county set').replace(/\s+county$/i, ''); m.set(c, (m.get(c) || 0) + 1); });
    return { byCat, byCounty: Array.from(m.entries()).sort((a, b) => b[1] - a[1]) };
  }, [listings]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Listings by category</h2>
        <ul className="space-y-1.5 text-sm">{byCat.map((c) => <li key={c.label} className="flex justify-between"><span>{c.label}</span><b>{c.n}</b></li>)}</ul>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Listings by county</h2>
        <ul className="max-h-64 space-y-1.5 overflow-auto text-sm">{byCounty.map(([c, n]) => <li key={c} className="flex justify-between"><span>{c}</span><b>{n}</b></li>)}</ul>
      </Card>
    </div>
  );
};

export default AdminCounts;
