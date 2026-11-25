import { Link, NavLink } from 'react-router-dom';
import { Menu, Heart, LogOut, Shield, Map as MapIcon } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navLinks = [
  { to: '/treatment-centers', label: 'Treatment' },
  { to: '/directory', label: 'Directory' },
  { to: '/arkansas-directory?category=all', label: 'Map' },
  { to: '/counties', label: 'Counties' },
  { to: '/for-counselors', label: 'For Counselors' },
  { to: '/recovery-resources', label: 'Recovery Resources' },
];

const SiteHeader = () => {
  const { isAdmin } = useAdmin();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`;

  return (
    <>
    <div className="px-4 py-2 text-center text-sm font-bold" style={{ backgroundColor: '#8c1d2f', color: '#ffe3e7' }}>
      In crisis? Call or text <a href="tel:988" className="underline underline-offset-2">988</a> — free, 24/7 &nbsp;·&nbsp; Arkansas DHS access line: <a href="tel:18447630198" className="underline underline-offset-2">1-844-763-0198</a>
    </div>
    <header className="sticky top-0 z-40 border-b bg-card/95 px-4 py-3 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-0">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-sm font-extrabold tracking-tight text-primary-foreground" style={{ fontFamily: 'var(--font-heading)' }}>AR</span>
          <span className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>Sober Arkansas</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/favorites" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><Heart className="h-4 w-4" /> Saved</Link>
              <button onClick={() => signOut()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sign Out</button>
            </div>
          ) : (
            <Link to="/auth" className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline">Sign In</Link>
          )}
          <Link to="/get-listed" className="hidden min-h-10 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground hover:opacity-90 sm:inline-flex">Get Listed</Link>

          {/* Map shortcut next to the menu on phones and tablets */}
          <Link
            to="/arkansas-directory?category=all"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/30 px-3 text-sm font-semibold text-primary hover:bg-secondary lg:hidden"
            aria-label="Search the map"
          >
            <MapIcon className="h-4 w-4" /> Map
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="-mr-2 p-2 text-foreground lg:hidden" aria-label="Open menu"><Menu className="h-6 w-6" /></button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-10">
              <nav className="flex flex-col gap-1">
                {[...navLinks, { to: '/get-listed', label: 'Get Listed' }].map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-foreground hover:bg-secondary">{link.label}</Link>
                ))}
                {user ? (
                  <>
                    <Link to="/favorites" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold hover:bg-secondary"><Heart className="h-4 w-4" /> Saved</Link>
                    <button onClick={() => { signOut(); setOpen(false); }} className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-base font-semibold text-muted-foreground hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign Out</button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-primary hover:bg-secondary">Sign In</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary"><Shield className="h-4 w-4" /> Admin</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </>
  );
};

export default SiteHeader;
