// Re-export existing ImportListings page, but without site header/footer for admin layout
import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ClipboardPaste, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { importRows, type ImportResult, type ImportSummary } from '@/lib/importListings';

const PASTE_HEADERS = ['name', 'city', 'address', 'phone', 'zipCode', 'image', 'images'];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'facility', 'facility name', 'listing', 'listing name', 'business', 'company'],
  city: ['city', 'town', 'municipality'],
  address: ['address', 'street', 'street1', 'street address', 'street_address', 'addr'],
  phone: ['phone', 'phone number', 'phone_number', 'tel', 'telephone'],
  zipCode: ['zip', 'zip code', 'zip_code', 'zipcode', 'postal', 'postal code'],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[_\s]+/g, ' ').trim();
}

function mapHeaderToField(header: string): string | null {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

function parseTSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const firstLine = lines[0].split('\t').map((h) => h.trim());
  const mappedFields = firstLine.map(mapHeaderToField);
  const hasHeaders = mappedFields.some((f) => f !== null);
  if (hasHeaders) {
    return lines.slice(1).map((line) => {
      const values = line.split('\t').map((v) => v.trim());
      const row: Record<string, string> = {};
      firstLine.forEach((h, i) => {
        const field = mapHeaderToField(h);
        if (field) row[field] = values[i] || '';
      });
      return row;
    });
  }
  return lines.map((line) => {
    const values = line.split('\t').map((v) => v.trim());
    const row: Record<string, string> = {};
    PASTE_HEADERS.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [pasteRows, setPasteRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Please upload a CSV file.', variant: 'destructive' });
      return;
    }
    setFile(f);
    setResults([]);
    setSummary(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) {
        toast({ title: 'Empty CSV', description: 'No data rows found.', variant: 'destructive' });
      } else {
        toast({ title: `${parsed.length} row(s) found`, description: 'Review and click Import.' });
      }
    };
    reader.readAsText(f);
  }, []);

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseTSV(pasteText);
    setPasteRows(parsed);
    setResults([]);
    setSummary(null);
    if (parsed.length === 0) {
      toast({ title: 'No data found', variant: 'destructive' });
    } else {
      toast({ title: `${parsed.length} row(s) parsed` });
    }
  };

  const handleImport = async (sourceRows: Record<string, string>[]) => {
    if (sourceRows.length === 0) return;
    setImporting(true);
    setResults([]);
    setProgress(0);
    setSummary(null);
    const result = await importRows(sourceRows, setProgress, setResults);
    setSummary(result);
    setImporting(false);
    toast({ title: 'Import complete', description: `${result.success}/${result.total} succeeded.` });
  };

  const downloadFailures = () => {
    if (!summary || summary.failedRows.length === 0) return;
    const csv = ['Row,Name,Error']
      .concat(summary.failedRows.map((r) => `${r.row},"${r.name}","${r.message || ''}"`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-failures.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const PreviewTable = ({ data }: { data: Record<string, string>[] }) => (
    <div className="max-h-48 overflow-auto rounded border border-border text-xs">
      <table className="w-full">
        <thead className="bg-muted sticky top-0">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">City</th>
            <th className="p-2 text-left">Address</th>
            <th className="p-2 text-left">Phone</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{row.name || '—'}</td>
              <td className="p-2">{row.city || '—'}</td>
              <td className="p-2">{row.address || '—'}</td>
              <td className="p-2">{row.phone || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Bulk Import</h1>
      <p className="text-muted-foreground text-sm">Add multiple facilities via CSV upload or paste from Excel.</p>

      {summary ? (
        <Card className="p-5 space-y-4 border-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {summary.failed === 0 ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            Import Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{summary.total}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="rounded-lg bg-green-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.success}</div>
              <div className="text-muted-foreground">Succeeded</div>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{summary.failed}</div>
              <div className="text-muted-foreground">Failed</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold text-foreground">
                {summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0}%
              </div>
              <div className="text-muted-foreground">Rate</div>
            </div>
          </div>
          {summary.failed > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-destructive">Failed Rows</h3>
                <Button variant="outline" size="sm" onClick={downloadFailures} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </div>
              <div className="max-h-40 overflow-auto space-y-1">
                {summary.failedRows.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-destructive/10">
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>Row {r.row}: {r.name}{r.message && ` — ${r.message}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button variant="outline" onClick={() => { setSummary(null); setRows([]); setPasteRows([]); setFile(null); }}>
            Import More
          </Button>
        </Card>
      ) : (
        <Card className="p-5">
          <Tabs defaultValue="paste">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="paste" className="flex-1 gap-1.5"><ClipboardPaste className="h-4 w-4" /> Paste</TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 gap-1.5"><FileText className="h-4 w-4" /> CSV File</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4">
              <p className="text-xs text-muted-foreground">Paste rows from Excel/Sheets: <strong>Name, City, Address, Phone, Zip</strong></p>
              <Textarea
                placeholder="Paste data here..."
                className="min-h-[160px] font-mono text-xs"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                disabled={importing}
              />
              <Button onClick={handleParsePaste} disabled={importing || !pasteText.trim()} variant="secondary" size="sm">
                Parse
              </Button>
              {pasteRows.length > 0 && (
                <div className="space-y-3">
                  <PreviewTable data={pasteRows} />
                  <Button onClick={() => handleImport(pasteRows)} disabled={importing} className="w-full gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Import {pasteRows.length} rows
                  </Button>
                </div>
              )}
              {importing && <Progress value={progress} className="h-2" />}
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <label className="block cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={importing} />
                <span className="inline-flex w-full h-12 items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Upload className="h-5 w-5" />
                  {file ? file.name : 'Choose CSV file'}
                </span>
              </label>
              {rows.length > 0 && (
                <div className="space-y-3">
                  <PreviewTable data={rows} />
                  <Button onClick={() => handleImport(rows)} disabled={importing} className="w-full gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Import {rows.length} rows
                  </Button>
                </div>
              )}
              {importing && <Progress value={progress} className="h-2" />}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default AdminImport;
