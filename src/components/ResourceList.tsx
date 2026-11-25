import { Phone, ExternalLink } from 'lucide-react';
import type { CountyResource } from '@/hooks/useArkansas';
import { extUrl, telHref } from '@/lib/arkansas';

const ResourceList = ({ items, empty }: { items: CountyResource[]; empty: string }) => {
  if (items.length === 0) return <p className="rounded-2xl bg-card p-8 text-center text-muted-foreground">{empty}</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((r) => (
        <article key={r.id} className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card">
          <div>
            <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-foreground">{r.category}</span>
            <h3 className="mt-3 text-lg font-bold text-primary">{r.title}</h3>
            {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
          </div>
          <div className="mt-auto flex flex-wrap gap-2">
            {r.phone && <a href={telHref(r.phone)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"><Phone className="h-4 w-4" /> {r.phone}</a>}
            {r.website && <a href={extUrl(r.website)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-primary hover:bg-secondary"><ExternalLink className="h-4 w-4" /> {r.category === 'Forms' ? 'Download' : 'Website'}</a>}
          </div>
        </article>
      ))}
    </div>
  );
};

export default ResourceList;
