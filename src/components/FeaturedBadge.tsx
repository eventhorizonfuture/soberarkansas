import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FeaturedBadge = () => (
  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
    <Star className="h-3 w-3 fill-current" /> Featured
  </Badge>
);

export default FeaturedBadge;
