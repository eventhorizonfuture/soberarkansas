import { Link, useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';
import DirectoryCard from '@/components/DirectoryCard';
import { useCounties, type County } from '@/hooks/useArkansas';
import { useListings } from '@/hooks/useListings';
import { isTreatment, listingTags, normCounty, countyLabel, telHref, fmtPhone } from '@/lib/arkansas';
import { TREATMENT_TYPES, typeByPath, typeBySeg, type TreatmentType } from '@/lib/treatmentTypes';
import type { SoberLivingHome } from '@/data/listings';
import NotFound from './NotFound';

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

function useTreatmentData() {
  const { data: counties = [], isLoading: cLoading } = useCounties();
  const { listings, isLoading } = useListings() as { listings: SoberLivingHome[]; isLoading?: boolean };
  const treatment = useMemo(() => listings.filter(isTreatment), [listings]);
  const byCounty = useMemo(() => {
    const m = new Map<string, SoberLivingHome[]>();
    for (const l of treatment) { const k = normCounty(l.county); if (!k) continue; (m.get(k) || m.set(k, []).get(k)!).push(l); }
    return m;
  }, [treatment]);
  // Hide types with no listings statewide (e.g. Medicaid until that data is filled in).
  const types = useMemo(() => TREATMENT_TYPES.filter((t) => treatment.some((l) => listingTags(l).has(t.tag))), [treatment]);
  return { counties, treatment, byCounty, types, loading: cLoading || (isLoading ?? false) };
}

const TypeChips = ({ county, active, types }: { county?: County; active?: TreatmentType; types: TreatmentType[] }) => (
  <div className="mt-8 flex flex-wrap gap-2">
    {types.map((t) => {
      const to = county ? `/treatment-centers/${county.slug}/${t.seg}` : t.path;
      return (
        <Link key={t.seg} to={to} className={`rounded-full px-4 py-2 text-sm font-bold ${active?.seg === t.seg ? 'bg-accent text-accent-foreground' : 'bg-white/15 text-primary-foreground hover:bg-white/25'}`}>
          {t.label}
        </Link>
      );
    })}
  </div>
);

const Grid = ({ items }: { items: SoberLivingHome[] }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => <DirectoryCard key={l.id} listing={l} />)}</div>
);

const AccessLine = ({ county }: { county: County }) =>
  county.access_line ? (
    <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold">
      <Phone className="h-4 w-4" /> {county.access_line_label || `${countyLabel(county.name)}`} (county authority) access line:{' '}
      <a href={telHref(county.access_line)} className="underline">{fmtPhone(county.access_line)}</a>
    </p>
  ) : null;

/** /treatment-centers — statewide hub. */
export const TreatmentHub = () => {
  const { counties, treatment, byCounty, types } = useTreatmentData();
  const typeCounts = types.map((t) => ({ t, n: treatment.filter((l) => listingTags(l).has(t.tag)).length }));
  return (
    <PageShell title="Addiction Treatment Centers in Arkansas" description={`Find ${treatment.length.toLocaleString('en-US')} addiction treatment centers across Arkansas: inpatient rehab, detox, outpatient programs, and methadone clinics, by county.`}>
      <PageHero eyebrow="Treatment directory" title="Addiction treatment centers in Arkansas"
        subtitle={`${plural(treatment.length, 'licensed and listed program', 'licensed and listed programs')} across all 75 counties. Free to search, no referral fees.`}>
        <TypeChips types={types} />
      </PageHero>
      <section className="container mx-auto px-4 py-10">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">By type of care</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {typeCounts.map(({ t, n }) => (
            <Link key={t.seg} to={t.path} className="rounded-2xl bg-card p-5 shadow-card hover:shadow-card-hover">
              <p className="font-bold text-primary">{t.label} <span className="text-muted-foreground">({n.toLocaleString('en-US')})</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4 pb-12">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">By county</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counties.map((c) => (
            <Link key={c.id} to={`/treatment-centers/${c.slug}`} className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-5 shadow-card hover:shadow-card-hover">
              <span className="font-bold text-primary">{countyLabel(c.name)}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{byCounty.get(normCounty(c.name))?.length || 0}</span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
};

/** /treatment-centers/:county and /treatment-centers/:county/:type */
export const CountyTreatment = () => {
  const { county: slug, type: seg } = useParams();
  const { counties, byCounty, types, loading } = useTreatmentData();
  const county = counties.find((c) => c.slug === slug);
  const type = typeBySeg(seg);
  const all = county ? byCounty.get(normCounty(county.name)) || [] : [];
  if (loading && !county) return null;
  if (!county || (seg && !type)) return <NotFound />;

  if (type) {
    const items = all.filter((l) => listingTags(l).has(type.tag));
    return (
      <PageShell title={`${type.label} in ${countyLabel(county.name)}, MD`} description={`${plural(items.length, type.plural.replace(/s$/, ''), type.plural)} in ${countyLabel(county.name)}, Arkansas. Compare programs, see what they offer, and call directly.`}>
        <PageHero eyebrow={`${countyLabel(county.name)}`} title={`${type.label} in ${countyLabel(county.name)}`} subtitle={`${plural(items.length, 'program', 'programs')}. ${type.blurb}`}>
          <AccessLine county={county} />
          <TypeChips county={county} active={type} types={types} />
        </PageHero>
        <section className="container mx-auto px-4 py-10">
          {items.length ? <Grid items={items} /> : <p className="rounded-2xl bg-card p-8 text-center text-muted-foreground">No {type.plural} listed in {countyLabel(county.name)} yet. <Link className="text-primary underline" to={`/treatment-centers/${county.slug}`}>See all treatment in {countyLabel(county.name)}</Link>.</p>}
          <p className="mt-8 text-sm"><Link to={`/treatment-centers/${county.slug}`} className="font-semibold text-primary underline">All treatment centers in {countyLabel(county.name)}</Link> · <Link to={type.path} className="font-semibold text-primary underline">{type.label} across Arkansas</Link></p>
        </section>
      </PageShell>
    );
  }

  const sections = types.filter((t) => t.tag !== 'medicaid').map((t) => ({ t, items: all.filter((l) => listingTags(l).has(t.tag)) }));
  const mediCal = all.filter((l) => listingTags(l).has('medicaid')).length;
  return (
    <PageShell title={`Addiction Treatment Centers in ${countyLabel(county.name)}, MD`} description={`${plural(all.length, 'treatment center', 'treatment centers')} in ${countyLabel(county.name)}, Arkansas: inpatient rehab, detox, outpatient, and methadone clinics${mediCal ? `, ${mediCal} taking Medicaid` : ''}.`}>
      <PageHero eyebrow={`${countyLabel(county.name)}`} title={`Addiction treatment centers in ${countyLabel(county.name)}`}
        subtitle={`${plural(all.length, 'program', 'programs')}${mediCal ? ` · ${mediCal.toLocaleString('en-US')} take Medicaid` : ''}`}>
        <AccessLine county={county} />
        <TypeChips county={county} types={types} />
      </PageHero>
      {sections.map(({ t, items }) => items.length > 0 && (
        <section key={t.seg} className="container mx-auto px-4 py-10">
          <h2 className="mb-1 text-2xl font-extrabold text-primary">{t.label} <span className="text-muted-foreground">({items.length})</span></h2>
          <p className="mb-5 text-sm text-muted-foreground">{t.blurb}</p>
          <Grid items={items.slice(0, 9)} />
          {items.length > 9 && (
            <Link to={`/treatment-centers/${county.slug}/${t.seg}`} className="mt-5 inline-flex items-center gap-1 font-bold text-primary">
              See all {items.length} {t.label.toLowerCase()} in {countyLabel(county.name)} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      ))}
      <section className="container mx-auto px-4 pb-12 text-sm">
        <Link to={`/counties/${county.slug}`} className="font-semibold text-primary underline">Sober living homes in {countyLabel(county.name)}</Link> ·{' '}
        <Link to="/treatment-centers" className="font-semibold text-primary underline">Treatment in other counties</Link>
      </section>
    </PageShell>
  );
};

/** /detox-centers-arkansas etc. — statewide page for one type of care. */
export const StateTreatmentType = () => {
  const { pathname } = useLocation();
  const type = typeByPath(pathname.replace(/\/$/, ''));
  const { counties, byCounty, treatment, types } = useTreatmentData();
  if (!type || (treatment.length > 0 && !types.includes(type))) return <NotFound />;
  const items = treatment.filter((l) => listingTags(l).has(type.tag));
  const perCounty = counties.map((c) => ({ c, n: (byCounty.get(normCounty(c.name)) || []).filter((l) => listingTags(l).has(type.tag)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  return (
    <PageShell title={`${type.label} in Arkansas`} description={`${plural(items.length, type.plural.replace(/s$/, ''), type.plural)} across Arkansas, by county. ${type.blurb}`}>
      <PageHero eyebrow="Arkansas" title={`${type.label} in Arkansas`} subtitle={`${plural(items.length, 'program', 'programs')} in ${perCounty.length} counties. ${type.blurb}`}>
        <TypeChips active={type} types={types} />
      </PageHero>
      <section className="container mx-auto px-4 py-10">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">Choose a county</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {perCounty.map(({ c, n }) => (
            <Link key={c.id} to={`/treatment-centers/${c.slug}/${type.seg}`} className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-5 shadow-card hover:shadow-card-hover">
              <span className="font-bold text-primary">{countyLabel(c.name)}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{n}</span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
};
