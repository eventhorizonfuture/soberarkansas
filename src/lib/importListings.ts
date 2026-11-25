import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from './geocode';
import { allFacilityFields } from './facilityFields';

export interface ImportResult {
  row: number;
  name: string;
  status: 'success' | 'error';
  message?: string;
  strategy?: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  failedRows: ImportResult[];
  duration: number; // seconds
}

function toBool(val: string): boolean {
  return ['true', 'yes', '1', 'y'].includes(val.toLowerCase().trim());
}

export async function importRows(
  rows: Record<string, string>[],
  onProgress: (percent: number) => void,
  onResult: (results: ImportResult[]) => void,
): Promise<ImportSummary> {
  const startTime = Date.now();
  const results: ImportResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name?.trim();
    const city = row.city?.trim();
    const address = row.address?.trim();

    if (!name || !city || !address) {
      results.push({
        row: i + 1,
        name: name || '(empty)',
        status: 'error',
        message: `Missing ${[!name && 'name', !city && 'city', !address && 'address'].filter(Boolean).join(', ')}`,
      });
      onProgress(((i + 1) / rows.length) * 100);
      onResult([...results]);
      continue;
    }

    const zipCode = row.zipCode?.trim();
    const geo = await geocodeAddress(address, city, zipCode);

    if (!geo.coords) {
      results.push({
        row: i + 1,
        name,
        status: 'error',
        message: `Could not geocode address after ${geo.attempts} attempts (tried ${geo.strategy})`,
      });
      onProgress(((i + 1) / rows.length) * 100);
      onResult([...results]);
      continue;
    }

    // Category is now an array - parse from CSV (could be comma-separated or single value)
    const rawCategory = row.category?.trim() || '';
    const validCategories = ['inpatient', 'outpatient', 'sober-living'];
    const category = rawCategory
      ? rawCategory.split(',').map(c => c.trim()).filter(c => validCategories.includes(c))
      : [];
    const gender = ['men', 'women', 'co-ed'].includes(row.gender?.trim())
      ? row.gender.trim()
      : 'co-ed';

    const insertData: Record<string, any> = {
      name,
      city,
      address,
      phone: row.phone?.trim() || '',
      description: row.description?.trim() || '',
      features: (row.features || '')
        .split(',')
        .map((f: string) => f.trim())
        .filter(Boolean),
      gender,
      image: row.image?.trim() || '',
      images: (row.images || '')
        .split(',')
        .map((u: string) => u.trim())
        .filter((u: string) => u.startsWith('http')),
      price_range: row.priceRange?.trim() || '',
      lat: geo.coords.lat,
      lng: geo.coords.lng,
      category,
      accepts_private_pay: false,
      accepts_medicaid: toBool(row.acceptsMedicaid || ''),
      length_of_stay: row.lengthOfStay?.trim() || '',
      mat_available: toBool(row.matAvailable || ''),
      insurance_verification_url: row.insuranceVerificationUrl?.trim() || '',
      detox_available: toBool(row.detoxAvailable || ''),
      level_php: toBool(row.levelPhp || ''),
      level_iop: toBool(row.levelIop || ''),
      level_op: toBool(row.levelOp || ''),
      telehealth_available: toBool(row.telehealthAvailable || ''),
      evening_groups: toBool(row.eveningGroups || ''),
    };

    // Map all extended facility boolean fields from CSV
    for (const field of allFacilityFields) {
      // Try both camelCase key and snake_case dbCol as possible CSV header names
      const val = row[field.key] ?? row[field.dbCol] ?? '';
      if (val) {
        insertData[field.dbCol] = toBool(val);
      }
    }

    const { error } = await supabase.from('listings').insert(insertData as any);

    results.push(
      error
        ? { row: i + 1, name, status: 'error', message: error.message }
        : { row: i + 1, name, status: 'success', strategy: geo.strategy },
    );
    onProgress(((i + 1) / rows.length) * 100);
    onResult([...results]);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const success = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;

  return {
    total: results.length,
    success,
    failed,
    failedRows: results.filter((r) => r.status === 'error'),
    duration,
  };
}
