import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Table = 'facility_submissions' | 'resource_suggestions';

function useRows(table: Table) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Record<string, any>[];
    },
  });
}

const StatusButtons = ({ table, row }: { table: Table; row: Record<string, any> }) => {
  const qc = useQueryClient();
  const setStatus = async (status: string) => {
    const { error } = await supabase.from(table).update({ status }).eq('id', row.id);
    if (error) toast({ title: 'Update failed', variant: 'destructive' }); else qc.invalidateQueries({ queryKey: [table] });
  };
  const del = async () => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from(table).delete().eq('id', row.id);
    qc.invalidateQueries({ queryKey: [table] });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold capitalize">{row.status}</span>
      <Button size="sm" onClick={() => setStatus('approved')}>Approve</Button>
      <Button size="sm" variant="outline" onClick={() => setStatus('rejected')}>Reject</Button>
      <Button size="sm" variant="ghost" onClick={del}>Delete</Button>
    </div>
  );
};

const AdminSubmissions = () => {
  const { data: subs = [] } = useRows('facility_submissions');
  const { data: sugg = [] } = useRows('resource_suggestions');
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Get Listed submissions</h1>
        <p className="text-sm text-muted-foreground">Approving marks a submission as reviewed; add the facility under Facilities to publish it.</p>
        {subs.length === 0 && <p className="text-muted-foreground">No submissions yet.</p>}
        {subs.map((s) => (
          <Card key={s.id} className="space-y-2 p-5">
            <p className="text-lg font-bold">{s.facility_name} <span className="text-sm font-normal text-muted-foreground">· {s.category} · {s.city}</span></p>
            <p className="text-sm">{s.contact_name} · <a className="underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>{s.contact_phone && ` · ${s.contact_phone}`}</p>
            {s.website && <p className="text-sm break-all">{s.website}</p>}
            {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
            <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
            <StatusButtons table="facility_submissions" row={s} />
          </Card>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Suggested counselor resources</h2>
        {sugg.length === 0 && <p className="text-muted-foreground">No suggestions yet.</p>}
        {sugg.map((s) => (
          <Card key={s.id} className="space-y-2 p-5">
            <p className="text-lg font-bold">{s.resource_title} {s.county && <span className="text-sm font-normal text-muted-foreground">· {s.county}</span>}</p>
            <p className="text-sm">{s.name} · <a className="underline" href={`mailto:${s.email}`}>{s.email}</a></p>
            {s.details && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.details}</p>}
            <StatusButtons table="resource_suggestions" row={s} />
          </Card>
        ))}
      </section>
    </div>
  );
};

export default AdminSubmissions;
