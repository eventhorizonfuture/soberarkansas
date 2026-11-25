import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ListYourHome = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Sober Arkansas
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          List Your Sober Living Home
        </h1>
        <p className="text-muted-foreground mb-8">
          Get your sober living home listed on SoberArkansas — completely free.
        </p>

        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              How It Works
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Send us an email with your home's details (name, address, description, photos, etc.)</li>
              <li>We'll review the information and add your listing within 24–48 hours</li>
              <li>Your home will appear on the directory and map for people seeking sober living in Arkansas</li>
            </ol>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              What to Include
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Home name and full address</li>
              <li>Contact phone number</li>
              <li>Price range (monthly)</li>
              <li>Gender accepted (Men, Women, or Co-Ed)</li>
              <li>A brief description of your home and programs</li>
              <li>Photos of the home (optional but recommended)</li>
              <li>Any special features or amenities</li>
              <li>Do you allow MAT (Medication-Assisted Treatment)?</li>
              <li>Any exclusionary medications</li>
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Need Your Listing Edited?
            </h2>
            <p className="text-sm text-muted-foreground">
              If your home is already listed and you need to update your information — such as contact details, pricing, photos, or services — just send us an email and we'll make the changes for you.
            </p>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Contact Us
            </h2>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:ContactSoberOhio@gmail.com?subject=List%20My%20Sober%20Living%20Home"
                className="inline-flex"
              >
                <Button className="gap-2">
                  <Mail className="h-4 w-4" /> ContactSoberOhio@gmail.com
                </Button>
              </a>
              <p className="text-xs text-muted-foreground">
                We typically respond within 24 hours. Listing is always free.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ListYourHome;
