import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

interface Props { title: string; description?: string; children: ReactNode }

/** Shared page wrapper: header, footer, and per-page title/description. */
const PageShell = ({ title, description, children }: Props) => {
  const { pathname } = useLocation();
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = `https://soberarkansas.com${pathname === '/' ? '' : pathname.replace(/\/$/, '')}`;
  }, [pathname]);
  useEffect(() => {
    document.title = `${title} | Sober Arkansas`;
    if (description) {
      let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.name = 'description'; document.head.appendChild(el); }
      el.content = description;
    }
  }, [title, description]);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
};

export const PageHero = ({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) => (
  <section className="bg-sunset px-4 py-14 text-primary-foreground sm:py-20">
    <div className="container mx-auto max-w-4xl">
      {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>}
      <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-4 max-w-2xl text-base opacity-90 sm:text-lg">{subtitle}</p>}
      {children}
    </div>
  </section>
);

export default PageShell;
