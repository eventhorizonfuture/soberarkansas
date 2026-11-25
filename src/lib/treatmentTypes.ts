import type { DirFilter } from '@/lib/arkansas';

/** Treatment-type landing pages. Keep in sync with scripts/prerender.mjs (TYPES). */
export interface TreatmentType {
  tag: DirFilter;
  /** statewide page path, e.g. /detox-centers-arkansas */
  path: string;
  /** short segment used under a county, e.g. /treatment-centers/los-angeles/detox */
  seg: string;
  label: string;
  plural: string;
  blurb: string;
}

export const TREATMENT_TYPES: TreatmentType[] = [
  { tag: 'residential', path: '/inpatient-rehab-arkansas', seg: 'inpatient', label: 'Inpatient & Residential Rehab', plural: 'inpatient and residential treatment centers', blurb: 'Live-in treatment with round-the-clock structure, usually for 30 to 90 days.' },
  { tag: 'detox', path: '/detox-centers-arkansas', seg: 'detox', label: 'Detox Centers', plural: 'detox programs', blurb: 'Medically supervised withdrawal management, often the first step before ongoing treatment.' },
  { tag: 'outpatient', path: '/outpatient-rehab-arkansas', seg: 'outpatient', label: 'Outpatient Rehab (IOP & PHP)', plural: 'outpatient programs', blurb: 'Treatment while living at home, from weekly counseling to intensive outpatient (IOP) and partial hospitalization (PHP).' },
  { tag: 'otp', path: '/methadone-clinics-arkansas', seg: 'methadone', label: 'Methadone & Suboxone Clinics (OTP)', plural: 'opioid treatment programs', blurb: 'Licensed opioid treatment programs offering medications such as methadone and buprenorphine.' },
  { tag: 'medicaid', path: '/medicaid-rehab-arkansas', seg: 'medicaid', label: 'Rehab That Takes Medicaid', plural: 'programs that accept Medicaid', blurb: 'Programs listed as accepting Medicaid. Call ahead to confirm coverage for the level of care you need.' },
];

export const typeBySeg = (seg?: string) => TREATMENT_TYPES.find((t) => t.seg === seg);
export const typeByPath = (path: string) => TREATMENT_TYPES.find((t) => t.path === path);
