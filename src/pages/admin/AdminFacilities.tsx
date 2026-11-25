import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trash2, Tag, ChevronLeft, ChevronRight, Pencil, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useListings } from '@/hooks/useListings';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;
const CATEGORIES = ['inpatient', 'outpatient', 'sober-living'];

type SortKey = 'name' | 'city' | 'category';
type SortDir = 'asc' | 'desc';

const AdminFacilities = () => {
  const { listings, isLoading, deleteListing, updateListing } = useListings();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterUnassigned = searchParams.get('filter') === 'unassigned';
  const [snapshotIds] = useState<Set<string> | null>(() => null);
  const [unassignedSnapshot, setUnassignedSnapshot] = useState<Set<string> | null>(null);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('inpatient');

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Snapshot unassigned IDs when filter is activated so they don't disappear on assignment
  useEffect(() => {
    if (filterUnassigned && !isLoading && listings.length > 0 && !unassignedSnapshot) {
      setUnassignedSnapshot(new Set(listings.filter((l) => !l.category || l.category.length === 0).map((l) => l.id)));
    }
    if (!filterUnassigned) {
      setUnassignedSnapshot(null);
    }
  }, [filterUnassigned, isLoading, listings, unassignedSnapshot]);

  const filtered = useMemo(() => {
    let data = [...listings];
    if (filterUnassigned && unassignedSnapshot) {
      data = data.filter((l) => unassignedSnapshot.has(l.id));
    } else if (filterUnassigned) {
      data = data.filter((l) => !l.category || l.category.length === 0);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.phone.includes(q)
      );
    }
    data.sort((a, b) => {
      let av = '', bv = '';
      if (sortKey === 'category') {
        av = (a.category || []).join(',');
        bv = (b.category || []).join(',');
      } else {
        av = (a[sortKey] || '').toString().toLowerCase();
        bv = (b[sortKey] || '').toString().toLowerCase();
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return data;
  }, [listings, search, sortKey, sortDir, filterUnassigned]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map((l) => l.id)));
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    for (const id of ids) {
      try { await deleteListing(id); } catch {}
    }
    setSelected(new Set());
    setBulkDeleteOpen(false);
    toast({ title: `Deleted ${ids.length} facilities` });
  };

  const handleBulkCategory = () => {
    const ids = Array.from(selected);
    for (const id of ids) {
      const listing = listings.find((l) => l.id === id);
      if (!listing) continue;
      const cats = new Set(listing.category || []);
      cats.add(bulkCategory);
      updateListing(id, { category: Array.from(cats) });
    }
    setSelected(new Set());
    setBulkCategoryOpen(false);
    toast({ title: `Assigned "${bulkCategory}" to ${ids.length} facilities` });
  };

  const handleSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteListing(deleteTarget.id);
      toast({ title: `Deleted "${deleteTarget.name}"` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setDeleteTarget(null);
  };

  const startEdit = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    updateListing(editingCell.id, { [editingCell.field]: editValue });
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Facilities
        </h1>
        {filterUnassigned && (
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Unassigned only ({filtered.length})
            <button onClick={() => setSearchParams({})} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} facilities</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, city, address, phone..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        {!filterUnassigned && (
          <Button variant="outline" size="sm" onClick={() => { setSearchParams({ filter: 'unassigned' }); setPage(0); }}>
            <AlertTriangle className="h-4 w-4 mr-1.5" /> Unassigned
          </Button>
        )}
        {selected.size > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => setBulkCategoryOpen(true)}>
              <Tag className="h-4 w-4 mr-1.5" /> Assign Category ({selected.size})
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete ({selected.size})
            </Button>
          </>
        )}
      </div>

      {/* Pagination (top) */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page + 1} of {totalPages}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-3 w-10">
                <Checkbox
                  checked={pageData.length > 0 && selected.size === pageData.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {(['name', 'city', 'category'] as SortKey[]).map((key) => (
                <th
                  key={key}
                  className="p-3 text-left cursor-pointer hover:text-foreground text-muted-foreground font-medium select-none"
                  onClick={() => toggleSort(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
              <th className="p-3 text-left text-muted-foreground font-medium">Phone</th>
              <th className="p-3 text-left text-muted-foreground font-medium">Address</th>
              <th className="p-3 w-24 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                </td>
                {/* Inline editable: name */}
                <td className="p-3">
                  {editingCell?.id === l.id && editingCell?.field === 'name' ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onDoubleClick={() => startEdit(l.id, 'name', l.name)}
                    >
                      {l.name}
                    </span>
                  )}
                </td>
                {/* Inline editable: city */}
                <td className="p-3">
                  {editingCell?.id === l.id && editingCell?.field === 'city' ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onDoubleClick={() => startEdit(l.id, 'city', l.city)}
                    >
                      {l.city}
                    </span>
                  )}
                </td>
                {/* Category checkboxes */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {([['inpatient', 'In'], ['outpatient', 'Out'], ['sober-living', 'SL']] as const).map(([cat, label]) => {
                      const checked = (l.category || []).includes(cat);
                      return (
                        <div key={cat} className="flex flex-col items-center gap-0.5">
                          <span className={`text-[10px] leading-none ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                          <Checkbox
                            checked={checked}
                            className="h-3.5 w-3.5"
                            onCheckedChange={() => {
                              const cats = new Set(l.category || []);
                              if (checked) cats.delete(cat);
                              else cats.add(cat);
                              updateListing(l.id, { category: Array.from(cats) });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </td>
                {/* Phone – inline editable */}
                <td className="p-3">
                  {editingCell?.id === l.id && editingCell?.field === 'phone' ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:underline"
                      onDoubleClick={() => startEdit(l.id, 'phone', l.phone)}
                    >
                      {l.phone || '—'}
                    </span>
                  )}
                </td>
                {/* Address */}
                <td className="p-3 max-w-[200px] truncate" title={l.address}>
                  {l.address || '—'}
                </td>
                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Link to={`/admin/facilities/${l.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ id: l.id, name: l.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No facilities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facility</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Facilities</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size} selected facilities. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk category dialog */}
      <AlertDialog open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Category</AlertDialogTitle>
            <AlertDialogDescription>
              Add a category to {selected.size} selected facilities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={bulkCategory} onValueChange={setBulkCategory}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCategory}>Assign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFacilities;
