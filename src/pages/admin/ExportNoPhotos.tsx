import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const ExportNoPhotos = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .or('image.eq.,image.is.null')
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  const handleExport = async () => {
    setLoading(true);
    try {
      let all: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data } = await supabase
          .from('listings')
          .select('id, name, city, address, phone, category, gender')
          .or('image.eq.,image.is.null')
          .order('name')
          .range(from, from + batchSize - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      const headers = ['ID', 'Name', 'City', 'Address', 'Phone', 'Categories', 'Gender'];
      const rows = all.map((l) => [
        l.id,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.city || '').replace(/"/g, '""')}"`,
        `"${(l.address || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.category || []).join(', ')}"`,
        l.gender || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'listings-without-photos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Listings Without Photos</h1>
      <p className="text-muted-foreground">
        {count !== null ? `${count} listings` : 'Loading...'} currently have no photos.
      </p>
      <Button onClick={handleExport} disabled={loading} className="gap-2">
        <Download className="h-4 w-4" />
        {loading ? 'Exporting...' : 'Download CSV'}
      </Button>
    </div>
  );
};

export default ExportNoPhotos;
