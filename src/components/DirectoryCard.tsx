import { Link } from 'react-router-dom';
import { Phone, Globe, Youtube, Facebook, MapPin } from 'lucide-react';
import type { SoberLivingHome } from '@/data/listings';
import { listingTags, TAG_LABEL, telHref, extUrl, careLabel, genderLabel, countyLabel } from '@/lib/arkansas';

const clip = (s: string, n: number) => {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
};

const DirectoryCard = ({ listing }: { listing: SoberLivingHome }) => {
  const tags = Array.from(listingTags(listing));
  const img = listing.image || listing.images?.[0];
  const facts = [
    careLabel(listing),
    genderLabel(listing.gender),
    listing.county ? countyLabel(listing.county) : listing.city,
  ];
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border-2 border-foreground/70 bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <Link to={`/listing/${listing.id}`} className="block aspect-[16/10] overflow-hidden bg-secondary">
        {img ? (
          <img src={img} alt={listing.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-sunset text-primary-foreground/90">
            <span className="px-6 text-center text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{listing.name}</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link to={`/listing/${listing.id}`} className="text-lg font-bold leading-snug text-foreground hover:text-primary">{listing.name}</Link>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {listing.city}{listing.county ? `, ${countyLabel(listing.county)}` : ''}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-y border-foreground/20 py-2.5 text-center">
          {facts.map((f) => (
            <div key={f}>
              <dd className="text-[13px] font-semibold leading-tight text-foreground">{f}</dd>
            </div>
          ))}
        </dl>
        {listing.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{clip(listing.description, 150)}</p>
        ) : null}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t === 'medicaid' ? 'bg-brick/15 text-brick' : 'bg-primary/10 text-primary'}`}>{TAG_LABEL[t]}</span>
            ))}
          </div>
        )}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          {listing.phone && (
            <a href={telHref(listing.phone)} className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-3 text-sm font-bold text-accent-foreground hover:opacity-90">
              <Phone className="h-4 w-4" /> {listing.phone}
            </a>
          )}
          {listing.website && (
            <a href={extUrl(listing.website)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold text-primary hover:bg-secondary">
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          {listing.youtubeUrl && (
            <a href={extUrl(listing.youtubeUrl)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold text-primary hover:bg-secondary">
              <Youtube className="h-4 w-4" /> Video Tour
            </a>
          )}
          {listing.facebookUrl && (
            <a href={extUrl(listing.facebookUrl)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold text-primary hover:bg-secondary">
              <Facebook className="h-4 w-4" /> Facebook
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default DirectoryCard;
