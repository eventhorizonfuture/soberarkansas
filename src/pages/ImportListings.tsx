import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle, Loader2, ClipboardPaste, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { importRows, type ImportResult, type ImportSummary } from '@/lib/importListings';

const PASTE_HEADERS = ['name', 'city', 'address', 'phone', 'zipCode'];

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

const SAMPLE_CSV = `name,city,address,phone,category,gender,description,features,priceRange,acceptsMedicaid,lengthOfStay,matAvailable,detoxAvailable,insuranceVerificationUrl,levelPhp,levelIop,levelOp,telehealthAvailable,eveningGroups
"Example Home","Columbus","123 Main St","(555) 555-0000","sober-living","co-ed","A great place to recover","12-Step, Drug Testing","$500-$700/mo","false","","false","false","","false","false","false","false","false"`;

const SAMPLE_PASTE = PASTE_HEADERS.join('\t') + '\nExample Home\tColumbus\t123 Main St\t(555) 555-0000\t43215';

const ImportListings = () => {
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
        toast({ title: `${parsed.length} row(s) found`, description: 'Review and click Import to proceed.' });
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
      toast({ title: 'No data found', description: 'Paste at least a header row and one data row.', variant: 'destructive' });
    } else {
      toast({ title: `${parsed.length} row(s) parsed`, description: 'Review and click Import to proceed.' });
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
    toast({
      title: 'Import complete',
      description: `${result.success}/${result.total} succeeded in ${formatDuration(result.duration)}.`,
    });
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-listings.csv';
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="max-h-48 overflow-auto rounded border text-xs">
      <table className="w-full">
        <thead className="bg-muted sticky top-0">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">City</th>
            <th className="p-2 text-left">Address</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Zip Code</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{row.name || '—'}</td>
              <td className="p-2">{row.city || '—'}</td>
              <td className="p-2">{row.address || '—'}</td>
              <td className="p-2">{row.phone || '—'}</td>
              <td className="p-2">{row.zipCode || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const SummaryCard = () => {
    if (!summary) return null;
    const successRate = summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
    return (
      <Card className="p-5 space-y-4 border-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {summary.failed === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          Import Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{summary.total}</div>
            <div className="text-muted-foreground">Total Rows</div>
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
            <div className="text-2xl font-bold text-foreground">{successRate}%</div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Completed in {formatDuration(summary.duration)}
        </p>
        {summary.failed > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-destructive">Failed Rows ({summary.failed})</h3>
              <Button variant="outline" size="sm" onClick={downloadFailures} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export Failures CSV
              </Button>
            </div>
            <div className="max-h-48 overflow-auto space-y-1">
              {summary.failedRows.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-destructive/10">
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Row {r.row}: {r.name}</span>
                    {r.message && <span className="text-muted-foreground"> — {r.message}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const LiveResults = () => {
    if (results.length === 0 || summary) return null;
    const successSoFar = results.filter((r) => r.status === 'success').length;
    const failSoFar = results.filter((r) => r.status === 'error').length;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">{successSoFar} succeeded</span>
          <span className="text-destructive font-medium">{failSoFar} failed</span>
        </div>
        <div className="max-h-40 overflow-auto space-y-1">
          {results.slice(-10).map((r, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs p-1.5 rounded ${r.status === 'success' ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
              {r.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
              <span>Row {r.row}: {r.name}{r.message ? ` — ${r.message}` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </Link>

          <h1 className="text-3xl mb-2 text-foreground">Bulk Import Listings</h1>
          <p className="text-muted-foreground mb-6">Add multiple listings at once. Paste from Excel or upload a CSV file.</p>

          {summary ? (
            <SummaryCard />
          ) : (
            <Card className="p-6">
              <Tabs defaultValue="paste">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="paste" className="flex-1 gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Paste from Excel
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex-1 gap-1.5">
                    <FileText className="h-4 w-4" /> Upload CSV
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy rows from Excel/Google Sheets and paste below. Columns in order:
                    <br />
                    <strong>Name, City, Street Address, Phone Number, Zip Code</strong>
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(SAMPLE_PASTE); toast({ title: 'Copied', description: 'Sample data copied to clipboard. Paste it below to test.' }); }} className="gap-1.5">
                    <ClipboardPaste className="h-4 w-4" /> Copy Sample Data
                  </Button>
                  <Textarea
                    placeholder={"Name\tCity\tStreet Address\tPhone\tZip Code\nExample Home\tColumbus\t123 Main St\t(555) 555-0000\t43215"}
                    className="min-h-[200px] font-mono text-xs"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    disabled={importing}
                  />
                  <Button onClick={handleParsePaste} disabled={importing || !pasteText.trim()} variant="secondary" className="gap-1.5">
                    Parse Pasted Data
                  </Button>

                  {pasteRows.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Preview</h2>
                        <span className="text-sm text-muted-foreground">{pasteRows.length} listing(s) ready</span>
                      </div>
                      <PreviewTable data={pasteRows} />
                      <Button onClick={() => handleImport(pasteRows)} disabled={importing} className="gap-2 w-full">
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {importing ? 'Importing...' : `Import ${pasteRows.length} Listing(s)`}
                      </Button>
                    </div>
                  )}

                  {importing && <Progress value={progress} className="h-2" />}
                  <LiveResults />
                </TabsContent>

                <TabsContent value="csv" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Prepare your CSV</h2>
                    <Button variant="outline" size="sm" onClick={downloadSample} className="gap-1.5">
                      <FileText className="h-4 w-4" /> Download Sample CSV
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Required columns: <strong>name</strong>, <strong>city</strong>, <strong>address</strong>. All other columns are optional.
                  </p>
                  <label className="block cursor-pointer">
                    <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={importing} />
                    <span className="inline-flex w-full h-12 items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Upload className="h-5 w-5" />
                      {file ? file.name : 'Choose CSV file'}
                    </span>
                  </label>

                  {rows.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Review & Import</h2>
                        <span className="text-sm text-muted-foreground">{rows.length} listing(s) ready</span>
                      </div>
                      <PreviewTable data={rows} />
                      <Button onClick={() => handleImport(rows)} disabled={importing} className="gap-2 w-full">
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {importing ? 'Importing...' : `Import ${rows.length} Listing(s)`}
                      </Button>
                    </div>
                  )}

                  {importing && <Progress value={progress} className="h-2" />}
                  <LiveResults />
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default ImportListings;
