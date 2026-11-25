import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const SiteFooter = () => (
  <footer className="bg-primary px-4 py-12 text-primary-foreground">
    <div className="container mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Sober Arkansas</p>
        <p className="mt-2 text-sm opacity-80">Arkansas&apos;s treatment and sober living directory. Every rehab, detox program, and sober living home in the state, in one free list.</p>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        <Link to="/directory" className="hover:underline">Directory</Link>
        <Link to="/counties" className="hover:underline">All 75 Counties</Link>
        <Link to="/for-counselors" className="hover:underline">For Counselors</Link>
        <Link to="/recovery-resources" className="hover:underline">Recovery Resources</Link>
        <Link to="/get-listed" className="hover:underline">Get Listed</Link>
        <Link to="/agents" className="hover:underline">For AI Assistants</Link>
      </nav>
      <div className="space-y-3 text-sm">
        <p>In crisis? Call or text <a href="tel:988" className="font-bold text-white underline decoration-accent decoration-2 underline-offset-2">988</a></p>
        <p>Arkansas DHS access line: <a href="tel:18447630198" className="font-bold text-white">1-844-763-0198</a></p>
        <p>SAMHSA Helpline: <a href="tel:18006624357" className="font-bold text-white">1-800-662-4357</a></p>
        <a href="mailto:ContactSoberOhio@gmail.com" className="inline-flex items-center gap-2 font-semibold hover:underline"><Mail className="h-4 w-4" /> Contact Us</a>
      </div>
      <div className="text-sm">
        <p className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Recovery in neighboring states</p>
        <p className="mt-2 opacity-80">Looking across the state line?</p>
        <a href="https://sobermissouri.com" target="_blank" rel="noopener noreferrer" className="mt-1 block font-semibold hover:underline">Sober Missouri — sobermissouri.com</a>
        <a href="https://sobertennessee.com" target="_blank" rel="noopener noreferrer" className="mt-1 block font-semibold hover:underline">Sober Tennessee — sobertennessee.com</a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
