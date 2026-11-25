import { Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const items = [
  'Individuals and families seeking recovery support',
  'Treatment providers and discharge planners',
  'Courts and probation departments',
  'Case managers and community organizations',
];

const RecoveryInfoSection = () => {
  return (
    <section className="px-4 py-8 space-y-8 max-w-4xl mx-auto">
      <Card className="border-border/60">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center" style={{ fontFamily: 'var(--font-heading)' }}>
            Arkansas Recovery Resource Information Center
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <p>
              SoberArkansas.com serves as an independent recovery resource designed to help individuals, families, and professionals locate recovery housing, sober living residences, and substance use treatment services throughout Arkansas. Our goal is to improve access to publicly available information by organizing recovery resources into one centralized location that supports informed decision-making during treatment placement and recovery planning.
            </p>
            <p>
              Recovery housing availability, program expectations, and admission requirements can vary widely across providers. By compiling information from publicly available registries, provider submissions, and community resources, SoberArkansas helps simplify the referral process for families, treatment providers, courts, probation departments, and case managers working to support individuals in recovery.
            </p>
            <p>
              SoberArkansas.com does not provide treatment services or placement decisions. Individuals are encouraged to contact programs directly to confirm availability, eligibility requirements, and services offered.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
        <CardContent className="p-8 sm:p-12 space-y-8">
          <h3
            className="text-lg sm:text-2xl font-bold text-foreground text-center"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Used By Families and Professionals Across Arkansas
          </h3>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 max-w-2xl mx-auto">
            {items.map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>

          <div className="flex justify-center pt-4">
            <Link to="/arkansas-directory?category=all">
              <Button
                size="lg"
                className="gap-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <Search className="h-4 w-4" />
                Start Searching Arkansas Recovery Resources
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default RecoveryInfoSection;
