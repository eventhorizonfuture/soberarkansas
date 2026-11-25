import { Search } from 'lucide-react';
import Delta from '@/components/Delta';
import { Input } from '@/components/ui/input';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const HeroSection = ({ searchQuery, onSearchChange }: HeroSectionProps) => {
  return (
    <section className="relative bg-primary px-4 pt-20 text-primary-foreground md:pt-28">
      <div className="container relative mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-4xl tracking-tight md:text-5xl lg:text-6xl">
          Arkansas Sober Living Directory
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/75" style={{ fontFamily: 'var(--font-body)' }}>
          Find safe, structured sober living homes across Arkansas. Every listing is verified, so you can compare homes and call with confidence.
        </p>
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, city, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-13 rounded-none border-none bg-card pl-12 pr-6 text-card-foreground shadow-lg placeholder:text-muted-foreground focus-visible:ring-accent"
          />
        </div>
      </div>
      <Delta className="relative mt-14 block h-24 w-full sm:h-32" />
    </section>
  );
};

export default HeroSection;
