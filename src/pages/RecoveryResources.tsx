import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import PageShell, { PageHero } from '@/components/PageShell';
import { guides } from '@/data/guides';
import NotFound from './NotFound';

export const RecoveryResources = () => (
  <PageShell title="Recovery Resources" description="Plain-language guides to licensing, levels of care, Medicaid, and choosing a sober living home in Arkansas.">
    <PageHero eyebrow="Recovery Resources" title="Guides in plain language" subtitle="Clear answers to the questions families and individuals ask most." />
    <section className="container mx-auto grid gap-5 px-4 py-12 md:grid-cols-2">
      {guides.map((g) => (
        <Link key={g.slug} to={`/recovery-resources/${g.slug}`} className="group rounded-3xl bg-card p-7 shadow-card hover:shadow-card-hover">
          <h2 className="text-xl font-bold text-primary">{g.title}</h2>
          <p className="mt-2 text-muted-foreground">{g.summary}</p>
          <span className="mt-4 inline-flex items-center gap-1 font-bold text-accent">Read guide <ArrowRight className="h-4 w-4" /></span>
        </Link>
      ))}
    </section>
  </PageShell>
);

export const GuidePage = () => {
  const { slug } = useParams();
  const g = guides.find((x) => x.slug === slug);
  if (!g) return <NotFound />;
  return (
    <PageShell title={g.title} description={g.summary}>
      <PageHero eyebrow="Recovery Resources" title={g.title} subtitle={g.summary} />
      <article className="container mx-auto max-w-3xl px-4 py-12">
        <Link to="/recovery-resources" className="mb-8 inline-flex items-center gap-1 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" /> All guides</Link>
        {g.sections.map((s) => (
          <section key={s.heading} className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-primary">{s.heading}</h2>
            <p className="text-lg leading-relaxed text-foreground">{s.body}</p>
          </section>
        ))}
      </article>
    </PageShell>
  );
};

export default RecoveryResources;
