import { Link, useParams } from 'react-router-dom';
import { Phone, ArrowLeft } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';
import ResourceList from '@/components/ResourceList';
import { useCounties, useCountyResources } from '@/hooks/useArkansas';
import { RESOURCE_CATEGORIES, countyLabel, telHref, fmtPhone } from '@/lib/arkansas';
import NotFound from './NotFound';

const CounselorCounty = () => {
  const { slug } = useParams();
  const { data: counties, isLoading } = useCounties();
  const county = counties?.find((c) => c.slug === slug);
  const { data: resources = [] } = useCountyResources(county?.id);
  if (isLoading) return null;
  if (!county) return <NotFound />;
  const grouped = RESOURCE_CATEGORIES.map((cat) => ({ cat, items: resources.filter((r) => r.category === cat) })).filter((g) => g.items.length);
  return (
    <PageShell title={`${countyLabel(county.name)} Counselor Resources`} description={`Substance use access line, crisis numbers, and counselor resources for ${countyLabel(county.name)}, Arkansas.`}>
      <PageHero eyebrow="For Counselors" title={`${countyLabel(county.name)} resources`}>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 text-foreground">
            <p className="text-sm font-semibold text-muted-foreground">{county.access_line_label} — the substance use access line for this county</p>
            {county.access_line ? <a href={telHref(county.access_line)} className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-primary"><Phone className="h-5 w-5" /> {fmtPhone(county.access_line)}</a>
              : <p className="mt-1 text-base font-semibold text-muted-foreground">Being verified — check back soon</p>}
          </div>
          <div className="rounded-2xl bg-card p-5 text-foreground">
            <p className="text-sm font-semibold text-muted-foreground">Crisis line</p>
            <a href={telHref(county.crisis_line || '988')} className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-accent"><Phone className="h-5 w-5" /> {county.crisis_line ? fmtPhone(county.crisis_line) : '988'}</a>
          </div>
        </div>
        {county.notes && <p className="mt-4 opacity-90">{county.notes}</p>}
      </PageHero>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap gap-4 text-sm font-bold">
          <Link to="/for-counselors" className="inline-flex items-center gap-1 text-primary"><ArrowLeft className="h-4 w-4" /> All counties</Link>
          <Link to={`/counties/${county.slug}`} className="text-accent">See {countyLabel(county.name)} treatment &amp; sober living →</Link>
        </div>
        {grouped.length === 0 ? <ResourceList items={[]} empty={`Resources for ${countyLabel(county.name)} are being added.`} /> : grouped.map((g) => (
          <section key={g.cat} className="mb-10">
            <h2 className="mb-4 text-xl font-extrabold text-primary">{g.cat}</h2>
            <ResourceList items={g.items} empty="" />
          </section>
        ))}
      </div>
    </PageShell>
  );
};

export default CounselorCounty;
