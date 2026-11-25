import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Users, DollarSign, Pencil, Check, X, ImageIcon, Trash2, ChevronLeft, ChevronRight, Plus, ClipboardPaste, Printer, Globe, Star } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import ImageScraper from '@/components/ImageScraper';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { listingSchema } from '@/lib/listingSchema';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import FeaturedBadge from '@/components/FeaturedBadge';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';
import FacilityDetails from '@/components/FacilityDetails';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useListingSeo } from '@/hooks/useListingSeo';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

async function uploadImage(listingId: string, file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, WebP, or GIF image.', variant: 'destructive' });
    return null;
  }
  if (file.size > MAX_SIZE) {
    toast({ title: 'File too large', description: 'Image must be under 5MB.', variant: 'destructive' });
    return null;
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('listing-images').upload(filePath, file, { upsert: true });
  if (error) {
    toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    return null;
  }
  const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
  return urlData.publicUrl;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getListing, updateListing, deleteListing } = useListings();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { isFeatured } = useFeaturedListings();
  const listing = getListing(id || '');
  useListingSeo(listing);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', phone: '', address: '', zipCode: '', state: 'AR', priceRange: '', image: '', images: [] as string[], city: '', gender: '', features: '', matAvailable: false, telehealthAvailable: false, eveningGroups: false, website: '', category: [] as string[] });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [pasteListening, setPasteListening] = useState(false);

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-lg text-muted-foreground">Listing not found.</p>
            <Link to="/arkansas-directory" className="text-accent hover:underline">← Back to directory</Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const allImages = listing.images.length > 0 ? listing.images : (listing.image ? [listing.image] : []);

  const startEdit = () => {
    // Parse zip code from end of address if present
    const zipMatch = listing.address.match(/\s(\d{5}(?:-\d{4})?)$/);
    const streetAddress = zipMatch ? listing.address.replace(/\s\d{5}(?:-\d{4})?$/, '').trim() : listing.address;
    const zipCode = zipMatch ? zipMatch[1] : '';

    setEditData({
      name: listing.name,
      description: listing.description,
      phone: listing.phone,
      address: streetAddress,
      zipCode,
      state: 'AR',
      priceRange: listing.priceRange,
      image: listing.image || '',
      images: listing.images.length > 0 ? [...listing.images] : (listing.image ? [listing.image] : []),
      city: listing.city,
      gender: listing.gender,
      features: listing.features.join(', '),
      matAvailable: listing.matAvailable,
      telehealthAvailable: listing.telehealthAvailable,
      eveningGroups: listing.eveningGroups,
      website: listing.website || '',
      category: [...listing.category],
    });
    setEditing(true);
  };

  async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
    const query = `${address}, ${city}, Arkansas, USA`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}
    return null;
  }

  const saveEdit = async () => {
    const fullAddress = editData.zipCode ? `${editData.address} ${editData.zipCode}` : editData.address;
    const addressChanged = fullAddress !== listing.address || editData.city !== listing.city;
    let lat = listing.lat;
    let lng = listing.lng;

    if (addressChanged) {
      const coords = await geocodeAddress(fullAddress, editData.city);
      if (!coords) {
        toast({ title: 'Could not find address', description: 'Please check the address and city are correct.', variant: 'destructive' });
        return;
      }
      lat = coords.lat;
      lng = coords.lng;
    }

    const parsed = listingSchema.safeParse({
      ...editData,
      address: fullAddress,
      image: editData.images[0] || '',
      features: editData.features.split(',').map(f => f.trim()).filter(Boolean),
      category: editData.category,
      lat,
      lng,
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      toast({ title: 'Validation error', description: firstError.message, variant: 'destructive' });
      return;
    }

    updateListing(listing.id, { ...parsed.data });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${listing.name}"? This cannot be undone.`)) return;
    await deleteListing(listing.id);
    navigate('/');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(listing.id, file);
      if (url) newUrls.push(url);
    }
    if (newUrls.length > 0) {
      setEditData(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
      toast({ title: `${newUrls.length} image(s) uploaded` });
    }
    setUploading(false);
  };

  const removeEditImage = (index: number) => {
    setEditData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type: imageType });
          imageFiles.push(file);
        }
      }
      if (imageFiles.length === 0) {
        toast({ title: 'No image found', description: 'Copy an image to your clipboard first (e.g. snipping tool).', variant: 'destructive' });
        return;
      }
      setUploading(true);
      const newUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImage(listing.id, file);
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) {
        setEditData(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
        toast({ title: `${newUrls.length} image(s) pasted & uploaded` });
      }
      setUploading(false);
    } catch (err: any) {
      toast({ title: 'Paste failed', description: err?.message || 'Could not read clipboard. Try using the file picker instead.', variant: 'destructive' });
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/arkansas-directory"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to directory
            </Link>
            {!editing && listing && (
              <FavoriteButton listingId={listing.id} className="scale-125" />
            )}
          </div>

          {/* Image Gallery - View Mode */}
          {!editing && allImages.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg border relative group">
              <img src={allImages[activeImageIndex]} alt={listing.name} className="w-full object-contain max-h-[70vh]" />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`h-2 w-2 rounded-full transition-colors ${i === activeImageIndex ? 'bg-foreground' : 'bg-foreground/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Image Editor - Edit Mode */}
          {editing && (
            <div className="mb-6 space-y-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" /> Property Images ({editData.images.length})
              </label>
              {editData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {editData.images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border">
                      <img src={url} alt={`Image ${i + 1}`} className="w-full h-24 object-cover" />
                      <button
                        onClick={() => removeEditImage(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <span className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-md border border-dashed border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Plus className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Add Images'}
                  </span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handlePasteFromClipboard}
                  disabled={uploading}
                  className="gap-1.5"
                >
                  <ClipboardPaste className="h-4 w-4" /> Paste
                </Button>
              </div>
              <div className="mt-2">
                <Input
                  placeholder="Paste image URL (https://...)"
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text').trim();
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                      e.preventDefault();
                      setEditData({ ...editData, images: [...(editData.images || []), text] });
                      toast({ title: 'Image URL added' });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.currentTarget.value.trim();
                      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        setEditData({ ...editData, images: [...(editData.images || []), url] });
                        e.currentTarget.value = '';
                        toast({ title: 'Image URL added' });
                      } else {
                        toast({ title: 'Invalid URL', description: 'Please enter a valid http/https URL.', variant: 'destructive' });
                      }
                    }
                  }}
                />
              </div>
              <ImageScraper
                existingImages={editData.images || []}
                onAddImage={(url) => setEditData((prev) => ({ ...prev, images: [...(prev.images || []), url] }))}
                onApplyInfo={(info) => {
                  setEditData((prev) => {
                    const updated = { ...prev };
                    if (info.name != null) updated.name = info.name;
                    if (info.phone != null) updated.phone = info.phone;
                    if (info.address != null) updated.address = info.address;
                    if (info.city != null) updated.city = info.city;
                    if (info.zipCode != null) updated.zipCode = info.zipCode;
                    if (info.description != null) updated.description = info.description;
                    if (info.website != null) updated.website = info.website;
                    if (info.gender != null) updated.gender = info.gender;
                    if (info.priceRange != null) updated.priceRange = info.priceRange;
                    if (info.features != null) {
                      updated.features = Array.isArray(info.features) ? info.features.join(', ') : info.features;
                    }
                    if (info.matAvailable != null) updated.matAvailable = info.matAvailable;
                    if (info.telehealthAvailable != null) updated.telehealthAvailable = info.telehealthAvailable;
                    if (info.eveningGroups != null) updated.eveningGroups = info.eveningGroups;
                    return updated;
                  });
                }}
              />
            </div>
          )}

          <div className="mb-6 flex items-start justify-between">
            {editing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-heading)' }}
              />
            ) : (
              <div>
                <h1 className="text-3xl md:text-4xl text-foreground">{listing.name}</h1>
                {isFeatured(listing.id) && <div className="mt-2"><FeaturedBadge /></div>}
              </div>
            )}
            {!editing && (
              <div className="flex flex-wrap gap-2 shrink-0 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"><Link to={`/get-featured?${new URLSearchParams({ facility: listing.name, city: listing.city || '' }).toString()}`}><Star className="h-3.5 w-3.5 fill-current" />{isFeatured(listing.id) ? 'Manage Featured' : 'Feature This Listing'}</Link></Button>
                {user && <ManageSubscriptionButton />}
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </>
                )}
              </div>
            )}
            {editing && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={saveEdit} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Check className="h-3.5 w-3.5" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Category edit */}
          {editing && (
            <div className="mb-4 flex flex-wrap gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-1">Categories:</span>
              {['inpatient', 'outpatient', 'sober-living'].map((cat) => (
                <label key={cat} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.category.includes(cat)}
                    onChange={() => {
                      setEditData(prev => {
                        const cats = new Set(prev.category);
                        if (cats.has(cat)) cats.delete(cat); else cats.add(cat);
                        return { ...prev, category: Array.from(cats) };
                      });
                    }}
                    className="rounded border-input"
                  />
                  {cat}
                </label>
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Badge key={editing ? 'gender-edit' : 'gender-view'} variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {editing ? (
                <select
                  value={editData.gender}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="h-5 border-none bg-transparent text-xs"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="co-ed">Co-Ed</option>
                </select>
              ) : (
                listing.gender === 'co-ed' ? 'Co-Ed' : listing.gender === 'men' ? 'Men' : 'Women'
              )}
            </Badge>
          {(editing ? editData.category : listing.category).includes('sober-living') ? (
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {editing ? (
                  <Input
                    value={editData.priceRange}
                    onChange={(e) => setEditData({ ...editData, priceRange: e.target.value })}
                    className="h-5 w-32 border-none bg-transparent p-0 text-xs"
                  />
                ) : (
                  listing.priceRange
                )}
              </Badge>
            ) : (
              <>
                {listing.acceptsMedicaid && <Badge variant="secondary">Medicaid/Medicare</Badge>}
                {listing.category.includes('inpatient') && listing.lengthOfStay && <Badge variant="secondary">Stay: {listing.lengthOfStay}</Badge>}
                {(listing.category.includes('inpatient') || listing.category.includes('outpatient')) && (
                  editing ? (
                    <Badge variant={editData.matAvailable ? 'secondary' : 'outline'} className="cursor-pointer select-none" onClick={() => setEditData(prev => ({ ...prev, matAvailable: !prev.matAvailable }))}>
                      {editData.matAvailable ? 'MAT Available ✓' : 'No MAT ✗'}
                    </Badge>
                  ) : (
                    <Badge variant={listing.matAvailable ? 'secondary' : 'outline'}>{listing.matAvailable ? 'MAT Available' : 'No MAT'}</Badge>
                  )
                )}
                {listing.category.includes('inpatient') && <Badge variant={listing.detoxAvailable ? 'secondary' : 'outline'}>{listing.detoxAvailable ? 'Detox Available' : 'No Detox'}</Badge>}
                {listing.category.includes('inpatient') && listing.insuranceVerificationUrl && (
                  <a href={listing.insuranceVerificationUrl} target="_blank" rel="noopener noreferrer">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-accent">Verify Insurance ↗</Badge>
                  </a>
                )}
                {listing.category.includes('outpatient') && listing.levelPhp && <Badge variant="secondary">PHP</Badge>}
                {listing.category.includes('outpatient') && listing.levelIop && <Badge variant="secondary">IOP</Badge>}
                {listing.category.includes('outpatient') && listing.levelOp && <Badge variant="secondary">OP</Badge>}
                {listing.category.includes('outpatient') && (
                  editing ? (
                    <Badge variant={editData.telehealthAvailable ? 'secondary' : 'outline'} className="cursor-pointer select-none" onClick={() => setEditData(prev => ({ ...prev, telehealthAvailable: !prev.telehealthAvailable }))}>
                      {editData.telehealthAvailable ? 'Telehealth ✓' : 'No Telehealth ✗'}
                    </Badge>
                  ) : (
                    <Badge variant={listing.telehealthAvailable ? 'secondary' : 'outline'}>{listing.telehealthAvailable ? 'Telehealth' : 'No Telehealth'}</Badge>
                  )
                )}
                {listing.category.includes('outpatient') && (
                  editing ? (
                    <Badge variant={editData.eveningGroups ? 'secondary' : 'outline'} className="cursor-pointer select-none" onClick={() => setEditData(prev => ({ ...prev, eveningGroups: !prev.eveningGroups }))}>
                      {editData.eveningGroups ? 'Evening Groups ✓' : 'No Evening Groups ✗'}
                    </Badge>
                  ) : (
                    <Badge variant={listing.eveningGroups ? 'secondary' : 'outline'}>{listing.eveningGroups ? 'Evening Groups' : 'No Evening Groups'}</Badge>
                  )
                )}
              </>
            )}
          </div>

          {/* Contact info */}
          <div className="mb-8 space-y-3 rounded-lg border bg-card p-5">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {editing ? (
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Street Address</label>
                    <Input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="h-7 text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">City</label>
                      <Input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="h-7 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">State</label>
                      <Input value="AR" disabled className="h-7 text-sm bg-muted" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Zip Code</label>
                      <Input value={editData.zipCode} onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })} className="h-7 text-sm" placeholder="28202" />
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const zipMatch = listing.address.match(/\s(\d{5}(?:-\d{4})?)$/);
                  const street = zipMatch ? listing.address.replace(/\s\d{5}(?:-\d{4})?$/, '').trim() : listing.address;
                  const zip = zipMatch ? zipMatch[1] : '';
                  const fullAddress = `${street}, ${listing.city}, MD${zip ? ' ' + zip : ''}`;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  return (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {fullAddress}
                    </a>
                  );
                })()
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              {editing ? (
                <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="h-7 text-sm" />
              ) : (
                <a href={`tel:${listing.phone}`} className="text-accent hover:underline">{listing.phone}</a>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-accent" />
              {editing ? (
                <Input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} placeholder="https://example.com" className="h-7 text-sm" />
              ) : listing.website ? (
                <a href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {listing.website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')}
                </a>
              ) : (
                <span className="text-muted-foreground">No website listed</span>
              )}
            </div>
            {!editing && listing.updatedAt && (
              <p className="pt-1 text-xs text-muted-foreground">
                Listing last updated <time dateTime={listing.updatedAt.slice(0, 10)}>{new Date(listing.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>. Call to confirm availability.
              </p>
            )}
          </div>

          {!editing && (listing.youtubeUrl || listing.facebookUrl || listing.email) && (
            <div className="mb-8 flex flex-wrap gap-3">
              {listing.email && (
                <a href={`mailto:${listing.email}`} className="inline-flex min-h-12 items-center rounded-xl border px-5 font-bold text-primary hover:bg-secondary">✉ Email</a>
              )}
              {listing.youtubeUrl && (
                <a href={/^https?:/i.test(listing.youtubeUrl) ? listing.youtubeUrl : `https://${listing.youtubeUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl bg-accent px-5 font-bold text-accent-foreground hover:opacity-90">▶ Video Tour</a>
              )}
              {listing.facebookUrl && (
                <a href={/^https?:/i.test(listing.facebookUrl) ? listing.facebookUrl : `https://${listing.facebookUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl border px-5 font-bold text-primary hover:bg-secondary">Facebook</a>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="mb-3 text-xl text-foreground">About This Home</h2>
            {editing ? (
              <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={6} className="text-sm leading-relaxed" />
            ) : (
              <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}
                dangerouslySetInnerHTML={{
                  __html: listing.description
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            )}
          </div>

          {/* Features */}
          <div>
            <h2 className="mb-3 text-xl text-foreground">Features & Amenities</h2>
            {editing ? (
              <div className="space-y-1">
                <Input value={editData.features} onChange={(e) => setEditData({ ...editData, features: e.target.value })} placeholder="Comma-separated, e.g. 12-Step, Drug Testing, House Manager" className="text-sm" />
                <p className="text-xs text-muted-foreground">Separate features with commas</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {listing.features.map((f) => (
                  <Badge key={f} variant="outline" className="text-sm">{f}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Extended Facility Details */}
          {!editing && <FacilityDetails listing={listing} />}

          {!editing && (
            <div className="mt-10 rounded-2xl bg-secondary p-5 text-sm">
              <span className="font-semibold text-foreground">Do you operate this facility? </span>
              <a href={`mailto:ContactSoberOhio@gmail.com?subject=${encodeURIComponent(`Claim listing: ${listing.name}`)}&body=${encodeURIComponent(`I would like to claim this listing: ${window.location.href}`)}`} className="font-bold text-accent underline">Claim this listing</a>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ListingDetail;
