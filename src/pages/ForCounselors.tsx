import { Link } from 'react-router-dom';
import { useState } from 'react';
import PageShell, { PageHero } from '@/components/PageShell';
import ResourceList from '@/components/ResourceList';
import { useCounties, useCountyResources } from '@/hooks/useArkansas';
import { countyLabel } from '@/lib/arkansas';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const SuggestForm = () => {
  const [form, setForm] = useState({ name: '', email: '', county: '', resource_title: '', details: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.resource_title.trim()) {
      toast({ title: 'Please add your name, a valid email, and the resource name', variant: 'destructive' }); return;
    }
    setBusy(true);
    const { error } = await supabase.from('resource_suggestions').insert({ ...form, details: form.details.slice(0, 3000) });
    setBusy(false);
    if (error) toast({ title: 'Could not send suggestion', variant: 'destructive' }); else setDone(true);
  };
  if (done) return <p className="rounded-2xl bg-card p-8 text-center font-semibold text-primary">Thank you! Our team will review your suggestion.</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-card p-6 shadow-card sm:grid-cols-2">
      <Input placeholder="Your name" value={form.name} onChange={set('name')} maxLength={200} className="h-12" />
      <Input placeholder="Your email" type="email" value={form.email} onChange={set('email')} maxLength={320} className="h-12" />
      <Input placeholder="County (optional)" value={form.county} onChange={set('county')} maxLength={100} className="h-12" />
      <Input placeholder="Resource name" value={form.resource_title} onChange={set('resource_title')} maxLength={300} className="h-12" />
      <Textarea placeholder="Phone, website, and what it offers" value={form.details} onChange={set('details')} maxLength={3000} className="sm:col-span-2" />
      <button disabled={busy} className="min-h-12 rounded-xl bg-accent font-bold text-accent-foreground hover:opacity-90 disabled:opacity-60 sm:col-span-2">{busy ? 'Sending…' : 'Suggest this resource'}</button>
    </form>
  );
};

const ForCounselors = () => {
  const { data: counties = [] } = useCounties();
  const { data: statewide = [] } = useCountyResources(null);
  const forms = statewide.filter((r) => r.category === 'Forms');
  const general = statewide.filter((r) => r.category !== 'Forms');
  return (
    <PageShell title="For Counselors" description="County-by-county crisis numbers, OSAMH catchment-area contacts, and referral resources for Arkansas counselors and case managers.">
      <PageHero eyebrow="For Counselors" title="Referral resources for every Arkansas county" subtitle="Crisis numbers, OSAMH catchment-area contacts, and trusted local resources — kept current for counselors, case managers, and discharge planners." />
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">Statewide resources</h2>
        <ResourceList items={general} empty="Statewide resources coming soon." />
      </section>
      <section className="container mx-auto px-4 py-6">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">Choose a county</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {counties.map((c) => (
            <Link key={c.id} to={`/for-counselors/${c.slug}`} className="flex min-h-12 items-center rounded-xl bg-card px-4 font-semibold text-foreground shadow-card hover:text-accent">{countyLabel(c.name)}</Link>
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-5 text-2xl font-extrabold text-primary">Forms &amp; downloads</h2>
        <ResourceList items={forms} empty="Downloadable forms and PDFs will be posted here." />
      </section>
      <section className="container mx-auto max-w-3xl px-4 pb-16">
        <h2 className="mb-2 text-2xl font-extrabold text-primary">Suggest a resource</h2>
        <p className="mb-5 text-muted-foreground">Know a program, meeting, or hotline we should list? Send it to our team.</p>
        <SuggestForm />
      </section>
    </PageShell>
  );
};

export default ForCounselors;
