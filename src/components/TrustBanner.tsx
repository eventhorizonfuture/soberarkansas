import { Info } from 'lucide-react';

const TrustBanner = () => {
  return (
    <section className="bg-muted/50 border-b px-4 py-6 sm:py-8 shrink-0">
      <div className="max-w-3xl mx-auto space-y-3 text-center">
        <h2
          className="text-lg sm:text-xl font-bold text-foreground inline-flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <Info className="h-5 w-5 text-primary shrink-0" />
          Arkansas Recovery Housing and Treatment Resource
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          SoberArkansas.com is an independent statewide directory created to help individuals, families, and professionals locate recovery housing, sober living residences, inpatient treatment programs, and outpatient services throughout Arkansas. Information is gathered from publicly available sources and provider submissions to support informed referral and placement decisions.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground/70 italic">
          SoberArkansas.com is not a treatment provider or placement agency. Individuals are encouraged to contact programs directly to confirm availability and eligibility requirements.
        </p>
      </div>
    </section>
  );
};

export default TrustBanner;
