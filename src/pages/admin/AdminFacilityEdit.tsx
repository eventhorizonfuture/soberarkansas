import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X as XIcon, Plus, Star, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useListings } from '@/hooks/useListings';
import { facilityFieldGroups } from '@/lib/facilityFields';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = ['inpatient', 'outpatient', 'sober-living'];

const AdminFacilityEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { listings, isLoading, updateListing } = useListings();
  const listing = listings.find((l) => l.id === id);

  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (listing) {
      setForm({ ...listing });
      setDirty(false);
    }
  }, [listing]);

  if (isLoading) return <p className="text-muted-foreground p-4">Loading...</p>;
  if (!listing) return <p className="text-destructive p-4">Facility not found.</p>;

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleCategory = (cat: string) => {
    const cats = new Set(form.category || []);
    if (cats.has(cat)) cats.delete(cat);
    else cats.add(cat);
    update('category', Array.from(cats));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      const basicFields = ['name', 'city', 'address', 'phone', 'description', 'gender', 'priceRange', 'category',
        'acceptsPrivatePay', 'acceptsMedicaid', 'lengthOfStay', 'matAvailable', 'insuranceVerificationUrl',
        'detoxAvailable', 'levelPhp', 'levelIop', 'levelOp', 'telehealthAvailable', 'eveningGroups',
        'features', 'image', 'images', 'website', 'youtubeUrl', 'facebookUrl', 'county', 'zipCode', 'acceptsMediCal', 'otpAvailable'];

      for (const f of basicFields) {
        if (JSON.stringify(form[f]) !== JSON.stringify(listing[f])) {
          updates[f] = form[f];
        }
      }

      // Extended facility fields
      for (const group of facilityFieldGroups) {
        for (const field of group.fields) {
          if (form[field.key] !== listing[field.key]) {
            updates[field.key] = form[field.key];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        toast({ title: 'No changes to save' });
        setSaving(false);
        return;
      }

      updateListing(listing.id, updates);
      toast({ title: 'Saved successfully' });
      setDirty(false);
    } catch (err: any) {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImages = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 5MB`, variant: 'destructive' });
        continue;
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `listings/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(filePath, file, { upsert: true });
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
      newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) {
      const updatedImages = [...(form.images || []), ...newUrls];
      const updatedPrimary = form.image || newUrls[0];
      update('images', updatedImages);
      if (!form.image) update('image', updatedPrimary);
      toast({ title: `${newUrls.length} photo(s) uploaded` });
    }
    setUploading(false);
  };

  const removeImage = (url: string) => {
    const imgs = (form.images || []).filter((u: string) => u !== url);
    update('images', imgs);
    if (form.image === url) {
      update('image', imgs[0] || '');
    }
  };

  const setPrimary = (url: string) => {
    update('image', url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/facilities')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl text-foreground flex-1" style={{ fontFamily: 'var(--font-heading)' }}>
          {listing.name}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/facilities')} disabled={saving}>
            <XIcon className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* Arkansas fields */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Links, County &amp; Coverage</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website || ''} onChange={(e) => update('website', e.target.value)} placeholder="https://" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} placeholder="intake@example.com" /></div>
          <div className="space-y-1.5"><Label>Video Tour (YouTube URL)</Label><Input value={form.youtubeUrl || ''} onChange={(e) => update('youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." /></div>
          <div className="space-y-1.5"><Label>Facebook URL</Label><Input value={form.facebookUrl || ''} onChange={(e) => update('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." /></div>
          <div className="space-y-1.5"><Label>County</Label><Input value={form.county || ''} onChange={(e) => update('county', e.target.value)} placeholder="City of St. Louis" /></div>
          <div className="space-y-1.5"><Label>ZIP Code</Label><Input value={form.zipCode || ''} onChange={(e) => update('zipCode', e.target.value)} /></div>
          <div className="flex flex-col gap-3 pt-6">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!form.acceptsMediCal} onCheckedChange={(v) => update('acceptsMediCal', !!v)} /> Takes Medicaid</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!form.otpAvailable} onCheckedChange={(v) => update('otpAvailable', !!v)} /> Medication-Assisted Treatment (OTP)</label>
          </div>
        </div>
      </Card>

      {/* Basic info */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
           <div className="space-y-1.5">
              <Label>Phone(s)</Label>
              {(form.phone || '').split(',').map((ph: string, i: number, arr: string[]) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={ph.trim()}
                    onChange={(e) => {
                      const phones = (form.phone || '').split(',').map((p: string) => p.trim());
                      phones[i] = e.target.value;
                      update('phone', phones.join(', '));
                    }}
                    placeholder="(555) 555-0000"
                  />
                  {arr.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const phones = (form.phone || '').split(',').map((p: string) => p.trim()).filter((_: string, idx: number) => idx !== i);
                        update('phone', phones.join(', '));
                      }}
                      className="text-destructive hover:text-destructive/80 shrink-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {(form.phone || '').split(',').length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update('phone', (form.phone || '') + (form.phone ? ', ' : ''))}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Phone
                </Button>
              )}
            </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender || 'co-ed'} onValueChange={(v) => update('gender', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="co-ed">Co-Ed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Price Range</Label>
            <Input value={form.priceRange || ''} onChange={(e) => update('priceRange', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Length of Stay</Label>
            <Input value={form.lengthOfStay || ''} onChange={(e) => update('lengthOfStay', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={4} value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Features (comma-separated)</Label>
          <Input
            value={(form.features || []).join(', ')}
            onChange={(e) => update('features', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
          />
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Categories</h2>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={(form.category || []).includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      </Card>

      {/* Photos */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Photos</h2>
        {(form.images || []).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(form.images || []).map((url: string, i: number) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-28 object-cover" />
                {form.image === url && (
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5" /> Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {form.image !== url && (
                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setPrimary(url)} title="Set as primary">
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeImage(url)} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><ImageIcon className="h-4 w-4" /> No photos uploaded.</p>
        )}
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUploadImages(e.target.files)}
            disabled={uploading}
          />
          <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </span>
        </label>
      </Card>

      {/* Boolean field sections */}
      {facilityFieldGroups.map((group) => (
        <Card key={group.section} className="p-5 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{group.section}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
            {group.fields.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <Checkbox
                  checked={!!form[field.key]}
                  onCheckedChange={(v) => update(field.key, !!v)}
                />
                {field.label}
              </label>
            ))}
          </div>
        </Card>
      ))}

      {/* Bottom save bar */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setForm({ ...listing }); setDirty(false); }}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminFacilityEdit;
