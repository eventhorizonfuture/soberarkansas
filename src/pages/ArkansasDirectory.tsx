import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Map, List, Plus, LogIn, LogOut, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import MapView from '@/components/MapView';
import ListingRow from '@/components/ListingRow';
import FilterBar from '@/components/FilterBar';
import FeaturedListings from '@/components/FeaturedListings';
import SiteFooter from '@/components/SiteFooter';
import { useListings } from '@/hooks/useListings';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';

const BASE_URL = 'https://soberarkansas.com';

const ArkansasDirectory = () => {
  const { listings, isLoading } = useListings();
  const { isFeatured } = useFeaturedListings();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  // SEO meta tags & JSON-LD
  useEffect(() => {
    const title = 'Arkansas Recovery Housing, Inpatient & Outpatient Treatment Directory | Sober Arkansas';
    const description = 'Search sober living homes, inpatient treatment centers, and outpatient recovery programs across Arkansas. Filter by city, gender, and category.';
    const canonicalUrl = `${BASE_URL}/arkansas-directory`;
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', 'website');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', canonicalUrl);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
      isPartOf: { '@type': 'WebSite', name: 'Sober Arkansas', url: BASE_URL },
      about: {
        '@type': 'Thing',
        name: 'Substance Abuse Recovery Housing',
        description: 'Directory of recovery housing, inpatient treatment, and outpatient programs in Arkansas',
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'directory-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    document.getElementById('directory-jsonld')?.remove();
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      ['description', 'og:title', 'og:description', 'og:url', 'og:type'].forEach(name => {
        const isP = name.startsWith('og:');
        document.querySelector(`meta[${isP ? 'property' : 'name'}="${name}"]`)?.remove();
      });
      document.querySelector('link[rel="canonical"]')?.remove();
      document.getElementById('directory-jsonld')?.remove();
    };
  }, []);

  // Clear map state synchronously before first render when navigating via category link
  const [shouldResetMap] = useState(() => {
    const cp = new URLSearchParams(window.location.search).get('category');
    if (cp) {
      sessionStorage.removeItem('map-view');
      sessionStorage.removeItem('dir-map-bounds');
      return true;
    }
    return false;
  });

  const initialCategory = categoryParam || sessionStorage.getItem('dir-category') || 'sober-living';

  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('dir-search') || '');
  const [selectedCity, setSelectedCity] = useState(() => sessionStorage.getItem('dir-city') || 'All Cities');
  const [selectedGender, setSelectedGender] = useState(() => sessionStorage.getItem('dir-gender') || 'All');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(() => {
    try {
      const saved = sessionStorage.getItem('dir-map-bounds');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const handleBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    sessionStorage.setItem('dir-map-bounds', JSON.stringify(bounds));
  }, []);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');
  // Mount only the map for the current screen size: two hidden/visible maps
  // would both draw and both report bounds to the list.
  const [isSmUp, setIsSmUp] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const on = () => setIsSmUp(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Persist filter state
  useEffect(() => {
    sessionStorage.setItem('dir-search', searchQuery);
    sessionStorage.setItem('dir-city', selectedCity);
    sessionStorage.setItem('dir-gender', selectedGender);
    sessionStorage.setItem('dir-category', selectedCategory);
  }, [searchQuery, selectedCity, selectedGender, selectedCategory]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.features.some((f) => f.toLowerCase().includes(q));

      const matchesCity = selectedCity === 'All Cities' || l.city === selectedCity;
      const matchesGender =
        selectedGender === 'All' || l.gender === selectedGender.toLowerCase();
      const matchesCategory = selectedCategory === 'all' || l.category.includes(selectedCategory);

      return matchesSearch && matchesCity && matchesGender && matchesCategory;
    });
  }, [listings, searchQuery, selectedCity, selectedGender, selectedCategory]);

  const visibleListings = useMemo(() => {
    // On mobile list view, don't filter by map bounds since the map isn't visible
    const isMobileList = window.innerWidth < 640 && mobileView === 'list';
    if (!mapBounds || isLoading || filtered.length === 0 || isMobileList) return filtered;
    return filtered.filter((l) => {
      if (l.lat == null || l.lng == null) return false;
      return l.lat >= mapBounds.south && l.lat <= mapBounds.north &&
             l.lng >= mapBounds.west && l.lng <= mapBounds.east;
    });
  }, [filtered, mapBounds, isLoading, mobileView]);

  // Restore scroll position after listings render
  useEffect(() => {
    if (visibleListings.length === 0) return;
    const saved = sessionStorage.getItem('dir-scroll-top');
    if (!saved) return;
    const top = parseInt(saved, 10);
    requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (el) el.scrollTop = top;
      const mel = mobileScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (mel) mel.scrollTop = top;
      sessionStorage.removeItem('dir-scroll-top');
    });
  }, [visibleListings]);

  const saveScrollPosition = useCallback(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    const mel = mobileScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    const top = el?.scrollTop || mel?.scrollTop || 0;
    sessionStorage.setItem('dir-scroll-top', String(top));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="z-10 border-b bg-card px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-foreground shrink-0">
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Sober Arkansas
            </span>
          </Link>
          <Link
            to="/list-your-home"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block shrink-0"
          >
            Add Your Listing (Free)
          </Link>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, city, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-full border-input pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground hidden sm:block">
              Arkansas Recovery Housing, Inpatient & Outpatient Treatment Directory
            </span>
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Link to="/admin">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Shield className="h-4 w-4" /> Admin
                      </Button>
                    </Link>
                    <Link to={`/add${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`}>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" /> Add Listing
                      </Button>
                    </Link>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => signOut()} className="gap-1.5 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Featured Listing Promo Banner */}
      <Link
        to="/get-featured"
        className="block bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 border-b border-amber-500/20 hover:from-amber-500/15 hover:via-amber-400/20 hover:to-amber-500/15 transition-all duration-300 group shrink-0"
      >
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-foreground font-medium">
            <span className="font-bold text-amber-500">Get Featured!</span>{' '}
            Boost your listing to the top of city results
          </span>
          <ArrowRight className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </Link>

      {/* Banner with link + tagline */}
      <div className="border-b bg-primary/5 px-4 py-2 shrink-0 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            to="/sober-living-little-rock-arkansas"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Looking for Little Rock recovery housing? <span className="underline underline-offset-2">View our Little Rock Resource Guide</span>
          </Link>
        </div>
        {selectedCategory === 'sober-living' && (
          <p className="text-sm text-primary font-medium">
            🏠 Showing <span className="font-bold">Sober Living</span> homes — Arkansas recovery housing and sober living homes
          </p>
        )}
      </div>

      <FilterBar
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Mobile Toggle */}
      <div className="flex sm:hidden border-b">
        <Button
          variant={mobileView === 'list' ? 'default' : 'ghost'}
          className="flex-1 rounded-none gap-2"
          onClick={() => setMobileView('list')}
        >
          <List className="h-4 w-4" /> List
        </Button>
        <Button
          variant={mobileView === 'map' ? 'default' : 'ghost'}
          className="flex-1 rounded-none gap-2"
          onClick={() => setMobileView('map')}
        >
          <Map className="h-4 w-4" /> Map
        </Button>
      </div>

      {/* Split View - Desktop: resizable, Mobile: toggle */}
      <div className="hidden sm:block overflow-hidden" style={{ height: '80vh', minHeight: '500px' }}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
            <div className="flex flex-col h-full">
              <div className="border-b px-4 py-2 text-xs text-muted-foreground shrink-0">
                {visibleListings.length} listing{visibleListings.length !== 1 ? 's' : ''} found
              </div>
              <ScrollArea className="flex-1" ref={scrollRef}>
                <FeaturedListings city={selectedCity} onHover={setHoveredId} hoveredId={hoveredId} />
                {visibleListings.length === 0 ? (
                  <div className="px-4 py-16 text-center text-muted-foreground">
                    <p className="text-sm">No homes match your search.</p>
                  </div>
                ) : (
                  <div onClickCapture={saveScrollPosition}>
                    {visibleListings.map((listing) => (
                      <ListingRow
                        key={listing.id}
                        listing={listing}
                        onHover={setHoveredId}
                        isHovered={hoveredId === listing.id}
                        isFeatured={isFeatured(listing.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65}>
            {isSmUp && <MapView key={shouldResetMap ? 'reset' : 'default'} listings={filtered} hoveredId={hoveredId} onBoundsChange={handleBoundsChange} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden overflow-hidden" style={{ height: '80vh', minHeight: '400px' }}>
        {mobileView === 'list' ? (
          <div className="flex flex-col h-full">
            <div className="border-b px-4 py-2 text-xs text-muted-foreground shrink-0">
              {visibleListings.length} listing{visibleListings.length !== 1 ? 's' : ''} found
            </div>
            <ScrollArea className="flex-1" ref={mobileScrollRef}>
              <FeaturedListings city={selectedCity} onHover={setHoveredId} hoveredId={hoveredId} />
              {visibleListings.length === 0 ? (
                <div className="px-4 py-16 text-center text-muted-foreground">
                  <p className="text-sm">No homes match your search.</p>
                </div>
              ) : (
                <div onClickCapture={saveScrollPosition}>
                  {visibleListings.map((listing) => (
                     <ListingRow
                      key={listing.id}
                      listing={listing}
                      onHover={setHoveredId}
                      isHovered={hoveredId === listing.id}
                      isFeatured={isFeatured(listing.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          !isSmUp ? <MapView key={shouldResetMap ? 'reset-mobile' : 'default-mobile'} listings={filtered} hoveredId={hoveredId} onBoundsChange={handleBoundsChange} /> : null
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default ArkansasDirectory;
