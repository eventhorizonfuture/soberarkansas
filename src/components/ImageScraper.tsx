import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Loader2, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FacilityInfo {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  description?: string | null;
  website?: string | null;
  features?: string[] | null;
  gender?: string | null;
  priceRange?: string | null;
  matAvailable?: boolean | null;
  telehealthAvailable?: boolean | null;
  acceptsMedicaid?: boolean | null;
  acceptsPrivatePay?: boolean | null;
  detoxAvailable?: boolean | null;
}

interface ImageScraperProps {
  onAddImage: (url: string) => void;
  existingImages: string[];
  onApplyInfo?: (info: Partial<Record<string, any>>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  zipCode: 'ZIP Code',
  description: 'Description',
  website: 'Website',
  features: 'Features',
  gender: 'Gender',
  priceRange: 'Price Range',
  matAvailable: 'MAT Available',
  telehealthAvailable: 'Telehealth',
  acceptsMedicaid: 'Accepts Medicaid',
  acceptsPrivatePay: 'Accepts Private Pay',
  detoxAvailable: 'Detox Available',
};

const ImageScraper = ({ onAddImage, existingImages, onApplyInfo }: ImageScraperProps) => {
  const [pageUrl, setPageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [facilityInfo, setFacilityInfo] = useState<FacilityInfo | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const handleScrape = async () => {
    if (!pageUrl.trim()) return;
    setLoading(true);
    setScrapedImages([]);
    setFacilityInfo(null);
    setAppliedFields(new Set());

    try {
      // TODO(arkansas): 'scrape-images-arkansas' is not deployed yet — see fork-prep/REBRAND-NOTES.md (b).
      const { data, error } = await supabase.functions.invoke('scrape-images-arkansas', {
        body: { url: pageUrl.trim() },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to scrape');

      const images = (data.images as string[]) || [];
      setScrapedImages(images);

      if (data.facilityInfo) {
        setFacilityInfo(data.facilityInfo);
      }

      if (images.length === 0 && !data.facilityInfo) {
        toast({ title: 'Nothing found', description: 'No images or info found on that page.' });
      } else {
        const parts = [];
        if (images.length > 0) parts.push(`${images.length} images`);
        if (data.facilityInfo) parts.push('facility info');
        toast({ title: `Found ${parts.join(' and ')}` });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyField = (key: string, value: any) => {
    if (!onApplyInfo) return;
    onApplyInfo({ [key]: value });
    setAppliedFields((prev) => new Set(prev).add(key));
    toast({ title: `${FIELD_LABELS[key] || key} applied` });
  };

  const applyAll = () => {
    if (!onApplyInfo || !facilityInfo) return;
    const toApply: Record<string, any> = {};
    Object.entries(facilityInfo).forEach(([key, value]) => {
      if (value !== null && value !== undefined && !appliedFields.has(key)) {
        toApply[key] = value;
      }
    });
    onApplyInfo(toApply);
    setAppliedFields(new Set(Object.keys(facilityInfo).filter((k) => facilityInfo[k as keyof FacilityInfo] != null)));
    toast({ title: 'All info applied' });
  };

  const isAlreadyAdded = (url: string) => existingImages.includes(url);

  const formatValue = (key: string, value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 w-full mt-2">
        <Globe className="h-4 w-4" /> Import from Website
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-input p-3 space-y-3 bg-muted/30">
      <div className="flex gap-2">
        <Input
          placeholder="Paste webpage URL to scan for images & info..."
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleScrape(); } }}
          className="flex-1"
        />
        <Button type="button" onClick={handleScrape} disabled={loading || !pageUrl.trim()} size="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          <span className="ml-1.5">{loading ? 'Scanning...' : 'Scan'}</span>
        </Button>
      </div>

      {/* Extracted facility info */}
      {facilityInfo && onApplyInfo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Extracted Info — click to apply:</p>
            <Button type="button" variant="outline" size="sm" onClick={applyAll} className="text-xs h-7 gap-1">
              <ArrowRight className="h-3 w-3" /> Apply All
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {Object.entries(facilityInfo).map(([key, value]) => {
              if (value === null || value === undefined) return null;
              const applied = appliedFields.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !applied && applyField(key, value)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                    applied
                      ? 'bg-primary/10 text-primary cursor-default'
                      : 'bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer border border-input'
                  }`}
                >
                  {applied && <Check className="h-3 w-3 shrink-0" />}
                  <span className="font-medium shrink-0">{FIELD_LABELS[key] || key}:</span>
                  <span className="truncate text-muted-foreground">{formatValue(key, value)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scraped images grid */}
      {scrapedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Click an image to add it:</p>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {scrapedImages.map((url, i) => {
              const added = isAlreadyAdded(url);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!added) {
                      onAddImage(url);
                      toast({ title: 'Image added' });
                    }
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    added
                      ? 'border-primary opacity-60 cursor-default'
                      : 'border-transparent hover:border-primary cursor-pointer hover:shadow-md'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Scraped ${i + 1}`}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                  {added && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setScrapedImages([]); setFacilityInfo(null); setPageUrl(''); }}>
        Close
      </Button>
    </div>
  );
};

export default ImageScraper;
