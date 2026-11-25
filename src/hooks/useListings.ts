import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SoberLivingHome } from '@/data/listings';
import { allFacilityFields } from '@/lib/facilityFields';

function rowToListing(row: any): SoberLivingHome {
  const listing: SoberLivingHome = {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    phone: row.phone,
    description: row.description,
    features: row.features || [],
    gender: row.gender,
    image: row.image || '',
    images: row.images || [],
    priceRange: row.price_range,
    lat: row.lat,
    lng: row.lng,
    category: Array.isArray(row.category) ? row.category : (row.category ? [row.category] : []),
    acceptsPrivatePay: row.accepts_private_pay ?? false,
    acceptsMedicaid: row.accepts_medicaid ?? false,
    lengthOfStay: row.length_of_stay || '',
    matAvailable: row.mat_available ?? false,
    insuranceVerificationUrl: row.insurance_verification_url || '',
    detoxAvailable: row.detox_available ?? false,
    levelPhp: row.level_php ?? false,
    levelIop: row.level_iop ?? false,
    levelOp: row.level_op ?? false,
    telehealthAvailable: row.telehealth_available ?? false,
    eveningGroups: row.evening_groups ?? false,
    website: row.website || '',
    youtubeUrl: row.youtube_url || '',
    facebookUrl: row.facebook_url || '',
    email: row.email || '',
    county: row.county || '',
    zipCode: row.zip_code || '',
    acceptsMediCal: row.accepts_medi_cal ?? false,
    otpAvailable: row.otp_available ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Map all extended facility boolean fields
  for (const field of allFacilityFields) {
    listing[field.key] = row[field.dbCol] ?? false;
  }

  return listing;
}

async function fetchListings(): Promise<SoberLivingHome[]> {
  const rows: any[] = [];
  // Page through results so large directories are not cut off at the per-request row cap.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('listings_public' as any)
      .select('*')
      .order('name')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows.map(rowToListing);
}

export function useListings() {
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: fetchListings,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SoberLivingHome> }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.features !== undefined) dbUpdates.features = updates.features;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.priceRange !== undefined) dbUpdates.price_range = updates.priceRange;
      if (updates.lat !== undefined) dbUpdates.lat = updates.lat;
      if (updates.lng !== undefined) dbUpdates.lng = updates.lng;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.acceptsPrivatePay !== undefined) dbUpdates.accepts_private_pay = updates.acceptsPrivatePay;
      if (updates.acceptsMedicaid !== undefined) dbUpdates.accepts_medicaid = updates.acceptsMedicaid;
      if (updates.lengthOfStay !== undefined) dbUpdates.length_of_stay = updates.lengthOfStay;
      if (updates.matAvailable !== undefined) dbUpdates.mat_available = updates.matAvailable;
      if (updates.insuranceVerificationUrl !== undefined) dbUpdates.insurance_verification_url = updates.insuranceVerificationUrl;
      if (updates.detoxAvailable !== undefined) dbUpdates.detox_available = updates.detoxAvailable;
      if (updates.levelPhp !== undefined) dbUpdates.level_php = updates.levelPhp;
      if (updates.levelIop !== undefined) dbUpdates.level_iop = updates.levelIop;
      if (updates.levelOp !== undefined) dbUpdates.level_op = updates.levelOp;
      if (updates.telehealthAvailable !== undefined) dbUpdates.telehealth_available = updates.telehealthAvailable;
      if (updates.eveningGroups !== undefined) dbUpdates.evening_groups = updates.eveningGroups;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.youtubeUrl !== undefined) dbUpdates.youtube_url = updates.youtubeUrl;
      if (updates.facebookUrl !== undefined) dbUpdates.facebook_url = updates.facebookUrl;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.county !== undefined) dbUpdates.county = updates.county;
      if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode;
      if (updates.acceptsMediCal !== undefined) dbUpdates.accepts_medi_cal = updates.acceptsMediCal;
      if (updates.otpAvailable !== undefined) dbUpdates.otp_available = updates.otpAvailable;

      // Extended facility fields
      for (const field of allFacilityFields) {
        if (updates[field.key] !== undefined) dbUpdates[field.dbCol] = updates[field.key];
      }

      const { error } = await supabase.from('listings').update(dbUpdates).eq('id', id);
      if (error) throw error;
      return { id, updates };
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previous = queryClient.getQueryData(['listings']);
      queryClient.setQueryData(['listings'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((item: any) => item.id === id ? { ...item, ...updates } : item);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['listings'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  const addMutation = useMutation({
    mutationFn: async (listing: Omit<SoberLivingHome, 'id'>) => {
      const insertData: Record<string, any> = {
        name: listing.name,
        city: listing.city,
        address: listing.address,
        phone: listing.phone,
        description: listing.description,
        features: listing.features,
        gender: listing.gender,
        image: listing.image,
        images: listing.images,
        price_range: listing.priceRange,
        lat: listing.lat,
        lng: listing.lng,
        category: listing.category,
        accepts_private_pay: listing.acceptsPrivatePay,
        accepts_medicaid: listing.acceptsMedicaid,
        length_of_stay: listing.lengthOfStay,
        mat_available: listing.matAvailable,
        insurance_verification_url: listing.insuranceVerificationUrl,
        detox_available: listing.detoxAvailable,
        level_php: listing.levelPhp,
        level_iop: listing.levelIop,
        level_op: listing.levelOp,
        telehealth_available: listing.telehealthAvailable,
        evening_groups: listing.eveningGroups,
        website: listing.website,
      };

      // Extended facility fields
      for (const field of allFacilityFields) {
        if (listing[field.key] !== undefined) insertData[field.dbCol] = listing[field.key];
      }

      const { error } = await supabase.from('listings').insert(insertData as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
  });

  const updateListing = (id: string, updates: Partial<SoberLivingHome>) => {
    updateMutation.mutate({ id, updates });
  };

  const addListing = (listing: Omit<SoberLivingHome, 'id'>) => {
    return addMutation.mutateAsync(listing);
  };

  const deleteListing = (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const getListing = (id: string) => listings.find((l) => l.id === id);

  return { listings, isLoading, updateListing, addListing, deleteListing, getListing };
}
