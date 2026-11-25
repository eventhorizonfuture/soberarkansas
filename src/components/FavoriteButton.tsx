import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
}

const FavoriteButton = ({ listingId, className = '' }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const navigate = useNavigate();
  const filled = isFavorite(listingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleFavorite(listingId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${
        filled
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-red-400'
      } ${className}`}
      title={filled ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={filled ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`h-4 w-4 ${filled ? 'fill-current' : ''}`} />
    </button>
  );
};

export default FavoriteButton;
