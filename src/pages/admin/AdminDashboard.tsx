import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ImageIcon, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useListings } from '@/hooks/useListings';
import AdminCounts from '@/components/AdminCounts';

type CategoryValue = string | string[] | undefined | null;

const normalizeToken = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');

const toCategoryTokens = (category: CategoryValue): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) return category.filter(Boolean).map(normalizeToken);
  return [normalizeToken(category)];
};

const hasCategory = (category: CategoryValue, token: string) => {
  const tokens = toCategoryTokens(category);
  const t = normalizeToken(token);
  return tokens.some((x) => x.includes(t));
};

const AdminDashboard = () => {
  const { listings, isLoading } = useListings();

  const stats = useMemo(() => {
    const total = listings.length;

    const inpatient = listings.filter((l) => hasCategory(l.category as CategoryValue, 'inpatient')).length;
    const outpatient = listings.filter((l) => hasCategory(l.category as CategoryValue, 'outpatient')).length;
    const soberLiving = listings.filter((l) => hasCategory(l.category as CategoryValue, 'sober-living')).length;
    const unassigned = listings.filter((l) => toCategoryTokens(l.category as CategoryValue).length === 0).length;

    const withPhotos = listings.filter((l) => (Array.isArray(l.images) && l.images.length > 0) || (l.image && String(l.image).trim() !== '')).length;
    const withoutPhotos = total - withPhotos;

    const noPhone = listings.filter((l) => !l.phone || String(l.phone).trim() === '').length;
    const noAddress = listings.filter((l) => !l.address || String(l.address).trim() === '').length;

    const completeCore = listings.filter((l) => {
      const hasCat = toCategoryTokens(l.category as CategoryValue).length > 0;
      const hasPh = !!l.phone && String(l.phone).trim() !== '';
      const hasAddr = !!l.address && String(l.address).trim() !== '';
      return hasCat && hasPh && hasAddr;
    }).length;

    const qualityPct = total === 0 ? 0 : Math.round((completeCore / total) * 100);

    return {
      total,
      inpatient,
      outpatient,
      soberLiving,
      unassigned,
      withPhotos,
      withoutPhotos,
      noPhone,
      noAddress,
      qualityPct,
    };
  }, [listings]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          {stats.qualityPct}% data quality
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Facilities" value={stats.total} />
        <StatCard label="Inpatient" value={stats.inpatient} color="text-blue-400" />
        <StatCard label="Outpatient" value={stats.outpatient} color="text-emerald-400" />
        <StatCard label="Sober Living" value={stats.soberLiving} color="text-amber-400" />
        <StatCard label="Unassigned" value={stats.unassigned} color="text-destructive" />
      </div>

      {/* Photo & Missing data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<ImageIcon className="h-8 w-8 text-primary shrink-0" />}
          value={stats.withPhotos}
          label="With Photos"
        />
        <Link to="/admin/export-no-photos">
          <InfoCard
            icon={<ImageIcon className="h-8 w-8 text-muted-foreground shrink-0" />}
            value={stats.withoutPhotos}
            label="Without Photos — Export CSV"
          />
        </Link>
        <InfoCard
          icon={<AlertTriangle className="h-8 w-8 text-amber-400 shrink-0" />}
          value={stats.noPhone}
          label="Missing Phone"
        />
        <InfoCard
          icon={<AlertTriangle className="h-8 w-8 text-amber-400 shrink-0" />}
          value={stats.noAddress}
          label="Missing Address"
        />
      </div>

      {/* Quick links */}
      {stats.unassigned > 0 && (
        <Link
          to="/admin/facilities?filter=unassigned"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
        >
          <Building2 className="h-5 w-5" />
          {stats.unassigned} facilities need category assignment
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      )}
      <AdminCounts listings={listings} />
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
  <Card className="p-4 text-center">
    <p className={`text-3xl font-bold ${color || 'text-foreground'}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </Card>
);

const InfoCard = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <Card className="p-4 flex items-center gap-3">
    {icon}
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </Card>
);

export default AdminDashboard;
