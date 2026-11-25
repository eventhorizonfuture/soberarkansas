import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useListings } from '@/hooks/useListings';
import { toast } from '@/hooks/use-toast';
import { listingSchema } from '@/lib/listingSchema';
import { supabase } from '@/integrations/supabase/client';

const AddListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCategory = searchParams.get('category') || '';
  const initialCategory = ['inpatient', 'outpatient', 'sober-living'].includes(paramCategory) ? paramCategory : 'sober-living';
  const { addListing } = useListings();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
    phones: [''] as string[],
    description: '',
    features: '',
    gender: 'co-ed' as 'men' | 'women' | 'co-ed',
    images: [] as string[],
    priceRange: '',
    category: initialCategory,
    acceptsMedicaid: false,
    lengthOfStay: '',
    matAvailable: false,
    insuranceVerificationUrl: '',
    detoxAvailable: false,
    levelPhp: false,
    levelIop: false,
    levelOp: false,
    telehealthAvailable: false,
    eveningGroups: false,
  });
  const [uploading, setUploading] = useState(false);

  async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Use structured query for higher accuracy
      const params = new URLSearchParams({
        format: 'json',
        street: address,
        city: city,
        state: 'Arkansas',
        country: 'US',
        limit: '1',
        addressdetails: '1',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      // Fallback to free-text query if structured fails
      const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address}, ${city}, Arkansas, USA`)}&limit=1`);
      const fallbackData = await fallbackRes.json();
      if (fallbackData.length > 0) {
        return { lat: parseFloat(fallbackData[0].lat), lng: parseFloat(fallbackData[0].lon) };
      }
    } catch {}
    return null;
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coords = await geocodeAddress(form.address, form.city);
    if (!coords) {
      toast({ title: 'Could not find address', description: 'Please check the address and city are correct.', variant: 'destructive' });
      return;
    }

    const parsed = listingSchema.safeParse({
      name: form.name,
      city: form.city,
      address: form.address,
      phone: form.phones.map(p => p.trim()).filter(Boolean).join(', '),
      description: form.description,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      gender: form.gender,
      image: form.images[0] || '',
      images: form.images,
      priceRange: form.priceRange,
      lat: coords.lat,
      lng: coords.lng,
      category: [form.category],
      acceptsPrivatePay: false,
      acceptsMedicaid: form.acceptsMedicaid,
      lengthOfStay: form.lengthOfStay,
      matAvailable: form.matAvailable,
      insuranceVerificationUrl: form.insuranceVerificationUrl,
      detoxAvailable: form.detoxAvailable,
      levelPhp: form.levelPhp,
      levelIop: form.levelIop,
      levelOp: form.levelOp,
      telehealthAvailable: form.telehealthAvailable,
      eveningGroups: form.eveningGroups,
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      toast({ title: 'Validation error', description: firstError.message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await addListing(parsed.data as Required<typeof parsed.data>);
      toast({ title: 'Listing added!' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </Link>

          <h1 className="text-3xl mb-8 text-foreground">
            {form.category === 'sober-living' ? 'Add Sober Living Home' : 'Add Treatment Center'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Home name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="e.g. Little Rock" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Full street address" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Phone Number(s)</Label>
                {form.phones.map((ph, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={ph}
                      onChange={(e) => {
                        const updated = [...form.phones];
                        updated[i] = e.target.value;
                        setForm(prev => ({ ...prev, phones: updated }));
                      }}
                      placeholder="(555) 555-0000"
                    />
                    {form.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, phones: prev.phones.filter((_, idx) => idx !== i) }))}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {form.phones.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, phones: [...prev.phones, ''] }))}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Phone
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="co-ed">Co-Ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sober-living">Sober Living</SelectItem>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.category === 'sober-living' ? (
              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range</Label>
                <Input id="priceRange" value={form.priceRange} onChange={(e) => update('priceRange', e.target.value)} placeholder="$500–$700/mo" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Accepted</Label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.acceptsMedicaid} onChange={(e) => setForm(prev => ({ ...prev, acceptsMedicaid: e.target.checked }))} className="rounded" />
                      Medicaid / Medicare
                    </label>
                  </div>
                </div>
                {form.category === 'inpatient' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="lengthOfStay">Length of Stay</Label>
                      <Input id="lengthOfStay" value={form.lengthOfStay} onChange={(e) => update('lengthOfStay', e.target.value)} placeholder="e.g. 30–90 days" />
                    </div>
                    <div className="space-y-2">
                      <Label>MAT Available</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.matAvailable} onChange={(e) => setForm(prev => ({ ...prev, matAvailable: e.target.checked }))} className="rounded" />
                          Yes, MAT is available
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Detox Available</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.detoxAvailable} onChange={(e) => setForm(prev => ({ ...prev, detoxAvailable: e.target.checked }))} className="rounded" />
                          Yes, Detox is available
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceVerificationUrl">Insurance Verification Link</Label>
                      <Input id="insuranceVerificationUrl" value={form.insuranceVerificationUrl} onChange={(e) => update('insuranceVerificationUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload CSV File</Label>
                      {form.insuranceVerificationUrl && form.insuranceVerificationUrl.endsWith('.csv') && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate max-w-xs">{form.insuranceVerificationUrl.split('/').pop()}</span>
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, insuranceVerificationUrl: '' }))} className="text-destructive hover:underline text-xs">Remove</button>
                        </div>
                      )}
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast({ title: 'File too large', description: 'CSV must be under 5MB.', variant: 'destructive' });
                              return;
                            }
                            setUploading(true);
                            const ext = 'csv';
                            const filePath = `csv/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                            const { error } = await supabase.storage.from('listing-images').upload(filePath, file, { upsert: true, contentType: 'text/csv' });
                            if (error) {
                              toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
                              setUploading(false);
                              return;
                            }
                            const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
                            setForm(prev => ({ ...prev, insuranceVerificationUrl: urlData.publicUrl }));
                            toast({ title: 'CSV uploaded successfully' });
                            setUploading(false);
                          }}
                        />
                        <span className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                          <Plus className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload CSV'}
                        </span>
                      </label>
                    </div>
                  </>
                )}
                {form.category === 'outpatient' && (
                  <>
                    <div className="space-y-2">
                      <Label>Levels of Care</Label>
                      <div className="flex flex-col gap-2 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.levelPhp} onChange={(e) => setForm(prev => ({ ...prev, levelPhp: e.target.checked }))} className="rounded" />
                          PHP (Partial Hospitalization Program)
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.levelIop} onChange={(e) => setForm(prev => ({ ...prev, levelIop: e.target.checked }))} className="rounded" />
                          IOP (Intensive Outpatient Program)
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.levelOp} onChange={(e) => setForm(prev => ({ ...prev, levelOp: e.target.checked }))} className="rounded" />
                          OP (Outpatient)
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>MAT Available</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.matAvailable} onChange={(e) => setForm(prev => ({ ...prev, matAvailable: e.target.checked }))} className="rounded" />
                          Yes, MAT is available
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Telehealth Available</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.telehealthAvailable} onChange={(e) => setForm(prev => ({ ...prev, telehealthAvailable: e.target.checked }))} className="rounded" />
                          Yes, Telehealth is available
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Evening Groups</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.eveningGroups} onChange={(e) => setForm(prev => ({ ...prev, eveningGroups: e.target.checked }))} className="rounded" />
                          Yes, Evening groups available
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} placeholder="Describe this home..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input id="features" value={form.features} onChange={(e) => update('features', e.target.value)} placeholder="12-Step, Drug Testing, House Manager" />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border">
                      <img src={url} alt={`Image ${i + 1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploading(true);
                    const tempId = `new-${Date.now()}`;
                    const newUrls: string[] = [];
                    for (const file of Array.from(files)) {
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                      if (!allowedTypes.includes(file.type)) {
                        toast({ title: 'Invalid file type', description: `${file.name}: Please upload JPG, PNG, WebP, or GIF.`, variant: 'destructive' });
                        continue;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast({ title: 'File too large', description: `${file.name}: Must be under 5MB.`, variant: 'destructive' });
                        continue;
                      }
                      const ext = file.name.split('.').pop() || 'jpg';
                      const filePath = `${tempId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                      const { error } = await supabase.storage.from('listing-images').upload(filePath, file, { upsert: true });
                      if (error) {
                        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
                        continue;
                      }
                      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
                      newUrls.push(urlData.publicUrl);
                    }
                    if (newUrls.length > 0) {
                      setForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
                      toast({ title: `${newUrls.length} image(s) uploaded` });
                    }
                    setUploading(false);
                  }}
                />
                <span className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <ImageIcon className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload Images'}
                </span>
              </label>
            </div>


            <Button type="submit" disabled={submitting} className="gap-2">
              <Plus className="h-4 w-4" /> {submitting ? 'Adding...' : 'Add Listing'}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default AddListing;
