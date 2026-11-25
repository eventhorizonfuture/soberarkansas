import { useState } from 'react';
import PageShell, { PageHero } from '@/components/PageShell';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Inpatient / Residential', 'Outpatient', 'Detox', 'Sober Living', 'Medication-Assisted (OTP)'];

const GetListed = () => {
  const [f, setF] = useState({ facility_name: '', contact_name: '', contact_email: '', contact_phone: '', category: CATEGORIES[0], city: '', website: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.facility_name.trim() || !f.contact_name.trim() || !/^\S+@\S+\.\S+$/.test(f.contact_email) || !f.city.trim()) {
      toast({ title: 'Please fill in facility name, your name, a valid email, and city', variant: 'destructive' }); return;
    }
    setBusy(true);
    const { error } = await supabase.from('facility_submissions').insert(f);
    setBusy(false);
    if (error) toast({ title: 'Could not submit', variant: 'destructive' }); else setDone(true);
  };
  return (
    <PageShell title="Get Listed" description="Add your Arkansas treatment center or sober living home to Sober Arkansas for free.">
      <PageHero eyebrow="For operators" title="Get your facility listed" subtitle="Treatment centers and sober living operators can submit their facility. Our team reviews every submission before it goes live." />
      <section className="container mx-auto max-w-2xl px-4 py-12">
        {done ? (
          <p className="rounded-2xl bg-card p-10 text-center text-lg font-semibold text-primary">Thanks! We received your submission and will review it shortly.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-3xl bg-card p-6 shadow-card sm:grid-cols-2 sm:p-8">
            <Input className="h-12 sm:col-span-2" placeholder="Facility name *" value={f.facility_name} onChange={set('facility_name')} maxLength={300} />
            <Input className="h-12" placeholder="Your name *" value={f.contact_name} onChange={set('contact_name')} maxLength={200} />
            <Input className="h-12" placeholder="Email *" type="email" value={f.contact_email} onChange={set('contact_email')} maxLength={320} />
            <Input className="h-12" placeholder="Phone" value={f.contact_phone} onChange={set('contact_phone')} maxLength={50} />
            <Input className="h-12" placeholder="City *" value={f.city} onChange={set('city')} maxLength={200} />
            <select value={f.category} onChange={set('category')} className="h-12 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2" aria-label="Category">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Input className="h-12 sm:col-span-2" placeholder="Website" value={f.website} onChange={set('website')} maxLength={500} />
            <Textarea className="sm:col-span-2" placeholder="Anything else we should know (license number, services, bed count)" value={f.notes} onChange={set('notes')} maxLength={3000} />
            <button disabled={busy} className="min-h-12 rounded-xl bg-accent font-bold text-accent-foreground hover:opacity-90 disabled:opacity-60 sm:col-span-2">{busy ? 'Submitting…' : 'Submit for review'}</button>
          </form>
        )}
      </section>
    </PageShell>
  );
};

export default GetListed;
