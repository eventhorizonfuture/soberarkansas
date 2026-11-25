import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl, { type GeoJSONSource, type Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Point } from 'geojson';
import type { SoberLivingHome } from '@/data/listings';
import { listingMapCategory } from '@/lib/arkansas';

// MapLibre (vector, GPU-drawn) version of the directory map. Same props and
// legend as the Leaflet version, so pages don't change. Pin colors come from
// the global --map-* tokens and category priority from listingMapCategory, so
// the map and legend can't diverge.
//
// Tiles: OpenFreeMap's free public style (no key, made for websites).

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const AR_BOUNDS: [[number, number], [number, number]] = [[-94.85, 32.85], [-89.4, 36.65]];
const AR_CENTER: [number, number] = [-92.44, 34.90];

interface MapViewProps {
  listings: SoberLivingHome[];
  hoveredId: string | null;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  resetView?: boolean;
}

/** Read an HSL token like "142 64% 38%" from :root and return a color MapLibre can parse. */
function tokenColor(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = raw.match(/^(-?[\d.]+)(?:deg)?\s+([\d.]+)%\s+([\d.]+)%$/);
  return m ? `hsl(${m[1]}, ${m[2]}%, ${m[3]}%)` : fallback;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Listings sharing exact coordinates (e.g. city-level ones) get spread in a
 *  small circle (~30 m) so each pin stays clickable once zoomed in. */
function spreadDuplicates(list: SoberLivingHome[]) {
  const seen = new Map<string, number>();
  return list.map((l) => {
    const key = `${l.lat},${l.lng}`;
    const idx = seen.get(key) || 0;
    seen.set(key, idx + 1);
    if (idx === 0) return l;
    const angle = (idx * 137.5 * Math.PI) / 180;
    const offset = 0.0003 * Math.ceil(idx / 6);
    return { ...l, lat: l.lat + Math.cos(angle) * offset, lng: l.lng + Math.sin(angle) * offset };
  });
}

const MapView = ({ listings, hoveredId, onBoundsChange }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const boundsCb = useRef(onBoundsChange);
  boundsCb.current = onBoundsChange;
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;
  const [failed, setFailed] = useState(false);

  const geojson = useMemo<FeatureCollection<Point>>(() => ({
    type: 'FeatureCollection',
    features: spreadDuplicates(listings.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng) && l.lat !== 0 && l.lng !== 0))
      .map((l) => ({
        type: 'Feature',
        id: l.id,
        geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
        properties: {
          id: l.id,
          name: l.name,
          city: l.city || '',
          image: l.images?.[0] || l.image || '',
          cat: listingMapCategory(l),
        },
      })),
  }), [listings]);
  const dataRef = useRef(geojson);
  dataRef.current = geojson;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    let map: MLMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: AR_CENTER,
        zoom: 6.2,
        minZoom: 4,
        maxZoom: 18,
        maxBounds: AR_BOUNDS,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    mapRef.current = map;

    const colors = {
      inpatient: tokenColor('--map-inpatient', '#2a9d5c'),
      outpatient: tokenColor('--map-outpatient', '#3b82f6'),
      sober: tokenColor('--map-sober', '#e3a33d'),
      cluster: tokenColor('--primary', '#103a93'),
    };

    map.on('load', () => {
      map.addSource('listings', {
        type: 'geojson',
        data: dataRef.current,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 13,
        promoteId: 'id',
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'listings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': colors.cluster,
          'circle-opacity': 0.92,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 21, 100, 27, 500, 34],
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'listings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-font': ['Noto Sans Bold'],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'listings',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['match', ['get', 'cat'], 'inpatient', colors.inpatient, 'outpatient', colors.outpatient, colors.sober],
          'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 10, 7],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 2],
        },
      });
      map.addLayer({
        id: 'point-labels',
        type: 'symbol',
        source: 'listings',
        filter: ['!', ['has', 'point_count']],
        minzoom: 11,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-font': ['Noto Sans Bold'],
          'text-offset': [0.9, 0],
          'text-anchor': 'left',
          'text-max-width': 14,
          'text-optional': true,
        },
        paint: { 'text-color': '#222222', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      });

      map.on('click', 'clusters', async (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = map.getSource('listings') as GeoJSONSource;
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id);
        map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom });
      });

      map.on('click', 'points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as { id: string; name: string; city: string; image: string };
        const el = document.createElement('div');
        el.className = 'min-w-[180px]';
        el.innerHTML = `${p.image ? `<img src="${esc(p.image)}" alt="" class="w-full h-20 object-cover rounded mb-2" onerror="this.remove()">` : ''}
          <h3 class="mb-1 font-semibold text-sm" style="font-family:var(--font-heading)">${esc(p.name)}</h3>
          <p class="text-xs text-muted-foreground mb-2">${esc(p.city)}${p.city ? ', ' : ''}CA</p>
          <a href="/listing/${esc(p.id)}" class="text-xs font-medium text-accent hover:underline">View Details →</a>`;
        el.querySelector('a')?.addEventListener('click', (ev) => {
          ev.preventDefault();
          navRef.current(`/listing/${p.id}`);
        });
        new maplibregl.Popup({ offset: 12, maxWidth: '240px' })
          .setLngLat((f.geometry as Point).coordinates as [number, number])
          .setDOMContent(el)
          .addTo(map);
      });

      for (const layer of ['clusters', 'points']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }

      readyRef.current = true;
      reportBounds();
    });

    const reportBounds = () => {
      const b = map.getBounds();
      boundsCb.current?.({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on('moveend', reportBounds);
    map.on('error', (e) => {
      // A tile or style failure shouldn't take the page down; log it once.
      if (!readyRef.current) console.warn('[map]', e.error?.message || e);
    });

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // New listings (filters, search) → swap the data, keep the view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource('listings') as GeoJSONSource | undefined)?.setData(geojson);
  }, [geojson]);

  // List hover → highlight the matching pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getSource('listings')) return;
    if (hoveredRef.current) map.setFeatureState({ source: 'listings', id: hoveredRef.current }, { hover: false });
    hoveredRef.current = hoveredId;
    if (hoveredId) map.setFeatureState({ source: 'listings', id: hoveredId }, { hover: true });
  }, [hoveredId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: '100%' }} />
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground">
          The map couldn't load on this device. The list still shows every listing.
        </div>
      )}
      <div className="absolute bottom-0 right-0 z-[5] rounded-tl-md bg-card/90 backdrop-blur-sm px-3 py-2 flex flex-row gap-2 shadow-sm" aria-label="Map category legend">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
          <span className="map-category-dot map-category-inpatient inline-block h-2.5 w-2.5 rounded-full" /> Inpatient
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
          <span className="map-category-dot map-category-outpatient inline-block h-2.5 w-2.5 rounded-full" /> Outpatient
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
          <span className="map-category-dot map-category-sober inline-block h-2.5 w-2.5 rounded-full" /> Sober living
        </span>
      </div>
    </div>
  );
};

export default MapView;
