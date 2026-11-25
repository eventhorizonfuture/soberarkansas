import { Link } from 'react-router-dom';

const CITIES = [
  { name: 'Little Rock', county: 'Pulaski County', to: '/sober-living-little-rock-arkansas' },
  { name: 'Fort Smith', county: 'Sebastian County', to: '/sober-living-fort-smith-arkansas' },
  { name: 'Fayetteville', county: 'Washington County', to: '/sober-living-fayetteville-arkansas' },
  { name: 'Jonesboro', county: 'Craighead County', to: '/sober-living-jonesboro-arkansas' },
];

export default function CityCrossLinks({ current }: { current?: string }) {
  const others = CITIES.filter((c) => c.name !== current);
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="text-xl font-bold text-foreground">Sober living in other Arkansas cities</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {others.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-xl border bg-card p-4 hover:border-primary">
            <span className="font-bold text-primary">Sober living in {c.name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{c.county}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
