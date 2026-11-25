import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const seoQuestions = [
  {
    q: 'How much does sober living cost in Arkansas?',
    a: 'Costs vary by location and level of support. Many homes charge monthly rent, and some require move-in fees. Always call to confirm pricing and what is included.',
  },
  {
    q: 'What are common rules in sober living homes?',
    a: 'Most homes require sobriety, house meetings, curfews, and participation in recovery activities. Rules can include drug testing and employment or treatment requirements.',
  },
  {
    q: 'Can someone be on MAT (Suboxone/methadone) in sober living?',
    a: 'Some homes are MAT-friendly and some are not. Ask each home directly about their MAT policy before referring or placing someone.',
  },
  {
    q: 'How fast can someone get placed into recovery housing?',
    a: 'It depends on openings and program requirements. Availability can change quickly, so it\'s best to contact multiple homes and confirm eligibility.',
  },
];

const SeoQuestionsSection = () => {
  return (
    <section className="px-4 py-12 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2
          className="text-xl sm:text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Arkansas Recovery Housing Quick Answers
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quick answers to common questions families and professionals ask when searching for recovery housing and treatment resources across Arkansas.
        </p>
      </div>

      <div className="space-y-6">
        {seoQuestions.map((item, i) => (
          <div key={i} className="border rounded-lg p-6 bg-muted/30">
            <h3 className="font-bold text-base sm:text-lg text-foreground mb-2">
              {item.q}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>


      <div className="flex flex-col items-center gap-3 pt-2">
        <Link to="/arkansas-directory?category=all">
          <Button size="lg" className="gap-2 rounded-lg">
            <Search className="h-4 w-4" />
            Browse Arkansas Recovery Listings
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default SeoQuestionsSection;
