import { useState, useRef, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Upload, Search } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const PAGE_SIZE = 50;

interface RecoveryHouse {
  id: string;
  name: string;
  doing_business_as: string;
  city: string;
  county: string;
  zip_code: string;
  phone: string;
  website: string;
  bed_count: number;
  narr_level: string;
  target_population: string;
  special_population: string;
  handicap_accessible: string;
  created_at: string;
}

function useRecoveryHouses() {
  return useQuery({
    queryKey: ['recovery_houses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recovery_houses')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as RecoveryHouse[];
    },
  });
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delimiter) { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = parseCSVLine(lines[0], delimiter);

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

const AllListings = () => {
  const { data: houses = [], isLoading } = useRecoveryHouses();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPops, setSelectedPops] = useState<string[]>([]);

  const populationOptions = ['Men', 'Women', 'Men with Children', 'Women with Children', 'Families with Children', 'LGBTQ+'];

  const togglePop = (pop: string) => {
    setSelectedPops(prev =>
      prev.includes(pop) ? prev.filter(p => p !== pop) : [...prev, pop]
    );
    setPage(1);
    setPageInput('1');
  };

  const filteredHouses = useMemo(() => {
    let result = houses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.county.toLowerCase().includes(q) ||
        h.doing_business_as.toLowerCase().includes(q)
      );
    }
    if (selectedPops.length > 0) {
      result = result.filter(h => {
        const pops = h.target_population.split(',').map(p => p.trim()).filter(Boolean);
        return pops.length > 0 && pops.every(pop => selectedPops.includes(pop));
      });
    }
    return result;
  }, [houses, search, selectedPops]);

  const totalPages = Math.max(1, Math.ceil(filteredHouses.length / PAGE_SIZE));
  const displayedHouses = isPrinting ? filteredHouses : filteredHouses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No data rows found in CSV');
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const batchSize = 25;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map(row => ({
          name: row['Residence Name']?.trim() || row.name?.trim() || row.Name?.trim() || '',
          doing_business_as: row['Doing Business As']?.trim() || row.doing_business_as?.trim() || '',
          city: row.City?.trim() || row.city?.trim() || '',
          county: row.County?.trim() || row.county?.trim() || '',
          zip_code: row['Zip Code']?.trim() || row.zip_code?.trim() || '',
          phone: row.Phone?.trim() || row.phone?.trim() || '',
          website: row.WebSite?.trim() || row.website?.trim() || '',
          bed_count: parseInt(row['Bed Count'] || row.bed_count || '0', 10) || 0,
          narr_level: row['NARR Level']?.trim() || row.narr_level?.trim() || '',
          target_population: row['Target Population']?.trim() || row.target_population?.trim() || '',
          special_population: row['Special Population']?.trim() || row.special_population?.trim() || '',
          handicap_accessible: row['Handicap Accessible']?.trim() || row.handicap_accessible?.trim() || '',
        })).filter(r => r.name);

        if (batch.length > 0) {
          const { error } = await (supabase as any)
            .from('recovery_houses')
            .insert(batch);

          if (error) {
            failed += batch.length;
            console.error('Import batch error:', error);
          } else {
            success += batch.length;
          }
        }

        setImportProgress(Math.round(((i + batchSize) / rows.length) * 100));
      }

      await queryClient.invalidateQueries({ queryKey: ['recovery_houses'] });
      setPage(1);
      setPageInput('1');

      if (failed === 0) {
        toast.success(`Imported ${success} recovery residences`);
      } else {
        toast.warning(`Imported ${success}, failed ${failed}`);
      }
    } catch (err: any) {
      toast.error('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImporting(false);
      setImportProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [queryClient]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 print:hidden">
          <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Arkansas's Recovery Housing Directory — Statewide Printable List
          </h1>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed max-w-4xl">
            <p>
              <a href="https://soberarkansas.com" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">SoberArkansas.com</a> provides one of the most comprehensive publicly accessible collections of recovery housing residences across Arkansas. This printable directory compiles recovery housing programs from publicly available sources — SAMHSA facility records, state licensing records, Oxford House listings, and SCARR certified residence listings — one complete, statewide list of recovery homes designed to support safe, structured, and recovery-focused living environments.
            </p>
            <p>
              Finding stable housing after treatment or during recovery can be one of the most important factors in long-term success. This resource was created to assist individuals, families, treatment providers, courts, probation officers, and community organizations by offering a centralized starting point when searching for recovery housing options throughout Arkansas.
            </p>
            <p>
              Listings included on this page are gathered from publicly available sources and are intended for informational purposes only. Housing availability, admission criteria, and program services may change at any time. Individuals are strongly encouraged to contact each residence directly to confirm openings, expectations, and eligibility requirements prior to placement or referral.
            </p>
            <p>
              SoberArkansas.com is dedicated to improving access to recovery resources by helping individuals connect with housing, treatment services, and community supports that promote long-term recovery and stability across Arkansas communities.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-muted-foreground/70 italic">
              (Listings included on this page are sourced from SAMHSA, the Arkansas Department of Human Services (OSAMH catchment-area providers and DPSQA licensing records), Oxford House, and AARR certified residence listings, with the source recorded on every row.)
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mb-4 print:hidden">
            {!isLoading && !isPrinting && (
              <span className="text-sm text-muted-foreground">
                {filteredHouses.length} total · Page {page} of {totalPages}
              </span>
            )}
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {importing ? 'Importing…' : 'Import CSV'}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPrinting(true);
                setTimeout(() => {
                  window.print();
                  setIsPrinting(false);
                }, 500);
              }}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>

        {importing && (
          <div className="mb-4">
            <Progress value={importProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">{importProgress}% complete</p>
          </div>
        )}

        {!isPrinting && (
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-sm font-medium text-foreground">Target Population:</span>
            {populationOptions.map(pop => (
              <label key={pop} className="flex items-center gap-1.5 cursor-pointer text-sm text-foreground">
                <Checkbox
                  checked={selectedPops.includes(pop)}
                  onCheckedChange={() => togglePop(pop)}
                />
                {pop}
              </label>
            ))}
          </div>
        )}

        {!isPrinting && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, city, county, or DBA..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); setPageInput('1'); }}
              className="w-full pl-9 pr-4 h-10 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : houses.length === 0 ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No recovery residences yet</p>
            <p className="text-sm mt-1">Click "Import CSV" to populate this table.</p>
          </div>
        ) : (
          <>
            {totalPages > 1 && !isPrinting && (
              <div className="flex items-center justify-center gap-2 mb-4 pagination-controls">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => { setPage(p => p - 1); setPageInput(String(page - 1)); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(pageInput, 10);
                    if (val >= 1 && val <= totalPages) { setPage(val); setPageInput(String(val)); }
                    else { setPageInput(String(page)); }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-14 h-8 text-center text-sm border rounded bg-background text-foreground"
                />
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => { setPage(p => p + 1); setPageInput(String(page + 1)); }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Residence Name</TableHead>
                    <TableHead>DBA</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Zip</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Beds</TableHead>
                    <TableHead>NARR Level</TableHead>
                    <TableHead>Target Pop.</TableHead>
                    <TableHead>Special Pop.</TableHead>
                    <TableHead>ADA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedHouses.map((house, i) => (
                    <TableRow key={house.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {isPrinting ? i + 1 : (page - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{house.name}</TableCell>
                      <TableCell>{house.doing_business_as}</TableCell>
                      <TableCell>{house.city}</TableCell>
                      <TableCell>{house.county}</TableCell>
                      <TableCell>{house.zip_code}</TableCell>
                      <TableCell>{house.phone}</TableCell>
                      <TableCell>
                        {house.website && house.website.toLowerCase() !== 'n/a' ? (() => {
                          const url = house.website.startsWith('http') ? house.website : `https://${house.website}`;
                          let display = house.website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
                          if (display.length > 20) display = display.slice(0, 18) + '…';
                          return (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[140px] inline-block text-xs">
                              {display}
                            </a>
                          );
                        })() : ''}
                      </TableCell>
                      <TableCell>{house.bed_count || ''}</TableCell>
                      <TableCell>{house.narr_level}</TableCell>
                      <TableCell>{house.target_population}</TableCell>
                      <TableCell>{house.special_population}</TableCell>
                      <TableCell>{house.handicap_accessible}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && !isPrinting && (
              <div className="flex items-center justify-center gap-2 mt-6 pagination-controls">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => { setPage(p => p - 1); setPageInput(String(page - 1)); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(pageInput, 10);
                    if (val >= 1 && val <= totalPages) { setPage(val); setPageInput(String(val)); }
                    else { setPageInput(String(page)); }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-14 h-8 text-center text-sm border rounded bg-background text-foreground"
                />
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => { setPage(p => p + 1); setPageInput(String(page + 1)); }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default AllListings;
