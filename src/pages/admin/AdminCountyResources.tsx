import { useEffect, useState } from 'react';
import { countyLabel } from '@/lib/arkansas';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Trash2, Plus, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCounties, useCountyResources, type CountyResource } from '@/hooks/useArkansas';
import { RESOURCE_CATEGORIES } from '@/lib/arkansas';
import { toast } from '@/hooks/use-toast';

const STATEWIDE = 'statewide';

const AdminCountyResources = () => {
  const qc = useQueryClient();
  const { data: counties = [] } = useCounties();
  const [sel, setSel] = useState<string>(STATEWIDE);
  const countyId = sel === STATEWIDE ? null : sel;
  const county = counties.find((c) => c.id === sel);
  const { data: resources = [] } = useCountyResources(countyId);
  const [rows, setRows] = useState<CountyResource[]>([]);
  const [lines, setLines] = useState({ access_line: '', access_line_label: '', crisis_line: '', notes: '' });

  useEffect(() => setRows(resources), [resources]);
  useEffect(() => { if (county) setLines({ access_line: county.access_line, access_line_label: county.access_line_label, crisis_line: county.crisis_line, notes: county.notes }); }, [county]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['county_resources', countyId ?? 'statewide'] });
  const edit = (id: string, k: keyof CountyResource, v: string) => setRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const save = async (r: CountyResource) => {
    if (!r.title.trim()) return toast({ title: 'Title is required', variant: 'destructive' });
    const { error } = await supabase.from('county_resources').update({ title: r.title, description: r.description, phone: r.phone, website: r.website, category: r.category }).eq('id', r.id);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); else { toast({ title: 'Saved' }); refresh(); }
  };
  const add = async () => {
    const { error } = await supabase.from('county_resources').insert({ county_id: countyId, title: 'New resource', category: 'Assessment', sort_order: rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0 });
    if (error) toast({ title: 'Could not add', description: error.message, variant: 'destructive' }); else refresh();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    const { error } = await supabase.from('county_resources').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', variant: 'destructive' }); else refresh();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    await Promise.all(next.map((r, idx) => supabase.from('county_resources').update({ sort_order: idx }).eq('id', r.id)));
    refresh();
  };
  const saveLines = async () => {
    if (!county) return;
    const { error } = await supabase.from('counties').update(lines).eq('id', county.id);
    if (error) toast({ title: 'Save failed', variant: 'destructive' }); else { toast({ title: 'County saved' }); qc.invalidateQueries({ queryKey: ['counties'] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">County Resources</h1>
          <p className="text-sm text-muted-foreground">Edit the counselor resources shown for each county.</p>
        </div>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="h-11 min-w-56 rounded-md border border-input bg-card px-3 text-sm" aria-label="County">
          <option value={STATEWIDE}>Statewide (For Counselors page)</option>
          {counties.map((c) => <option key={c.id} value={c.id}>{countyLabel(c.name)}</option>)}
        </select>
      </div>

      {county && (
        <Card className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Access line label</Label><Input value={lines.access_line_label} onChange={(e) => setLines({ ...lines, access_line_label: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>SUD access line</Label><Input value={lines.access_line} onChange={(e) => setLines({ ...lines, access_line: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Crisis line</Label><Input value={lines.crisis_line} onChange={(e) => setLines({ ...lines, crisis_line: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Input value={lines.notes} onChange={(e) => setLines({ ...lines, notes: e.target.value })} /></div>
          <Button onClick={saveLines} className="sm:col-span-2"><Save className="mr-2 h-4 w-4" /> Save county numbers</Button>
        </Card>
      )}

      {rows.map((r, i) => (
        <Card key={r.id} className="space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Input value={r.title} onChange={(e) => edit(r.id, 'title', e.target.value)} placeholder="Title" />
            <select value={r.category} onChange={(e) => edit(r.id, 'category', e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label="Category">
              {RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Textarea value={r.description} onChange={(e) => edit(r.id, 'description', e.target.value)} placeholder="Short description" rows={2} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={r.phone} onChange={(e) => edit(r.id, 'phone', e.target.value)} placeholder="Phone" />
            <Input value={r.website} onChange={(e) => edit(r.id, 'website', e.target.value)} placeholder="Website or PDF link" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => save(r)}><Save className="mr-1 h-4 w-4" /> Save</Button>
            <Button size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
            <Button size="sm" variant="destructive" onClick={() => remove(r.id)} className="ml-auto"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
          </div>
        </Card>
      ))}
      <Button onClick={add} variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add resource</Button>
    </div>
  );
};

export default AdminCountyResources;
