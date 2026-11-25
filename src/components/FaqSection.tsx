import { Search, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

export const faqItems = [
  {
    q: 'What is recovery housing (sober living) in Arkansas?',
    a: 'Recovery housing (often called sober living) is a safe, substance-free living environment that supports recovery through structure, accountability, and peer support. Homes can vary in rules, staffing, and services offered.',
  },
  {
    q: 'How do I find sober living or recovery housing near me in Arkansas?',
    a: 'Start by searching your city or county in the SoberArkansas directory and contact programs directly to confirm openings, requirements, and cost. Availability can change quickly.',
  },
  {
    q: 'Do recovery homes in Arkansas publish their street addresses?',
    a: 'Not always. Some recovery residences do not publicly list street addresses for safety and privacy reasons, so they may show a city/service area instead of a full address and may not appear on a map.',
  },
  {
    q: 'What questions should I ask before choosing a sober living home?',
    a: 'Ask about cost, rules (curfew, drug testing, visitors), required meetings, staff support, transportation, length of stay, and whether they accept MAT (Suboxone/methadone) if that applies.',
  },
  {
    q: 'Is recovery housing the same as inpatient treatment?',
    a: 'No. Inpatient treatment is a clinical level of care with medical/therapeutic services. Recovery housing is supportive housing that can be used during or after treatment to help maintain stability.',
  },
  {
    q: 'How can a provider update or add a listing on SoberArkansas?',
    a: 'Providers can request a free listing update through SoberArkansas to keep contact details, services, and program information accurate and easy to find.',
  },
  {
    q: 'What is the difference between inpatient and outpatient treatment?',
    a: 'Inpatient treatment provides structured residential care with clinical and medical support, while outpatient programs allow individuals to live at home while attending therapy, counseling, or medication management services during scheduled hours.',
  },
  {
    q: 'How do I find inpatient treatment in Arkansas?',
    a: 'Individuals and professionals can search the SoberArkansas directory by city or category to locate inpatient treatment programs. Contact programs directly to confirm admission requirements, insurance acceptance, and availability.',
  },
  {
    q: 'Does outpatient treatment help after inpatient care?',
    a: 'Outpatient treatment is often used after residential treatment to provide continued counseling, relapse prevention support, and medication-assisted treatment services while individuals transition back into daily life.',
  },
  {
    q: 'Do treatment programs accept Medicaid or insurance in Arkansas?',
    a: 'Many inpatient and outpatient treatment programs accept Medicaid or private insurance, but coverage varies by provider. Contact programs directly to confirm accepted insurance plans and eligibility requirements.',
  },
  {
    q: 'Are sober living homes in Arkansas certified?',
    a: 'Some are. Arkansas has no state certification for recovery residences; certification is voluntary. AARR, the Arkansas Alliance of Recovery Residences, certifies homes that meet national recovery housing standards, and it publishes each certified residence\u2019s address and phone on its own directory. Certification is one signal of a well-run home, and an uncertified home is not automatically a bad one — ask the questions above either way.',
  },
  {
    q: 'Who do I call for help finding treatment in Arkansas right now?',
    a: 'Call or text 988 if someone is in crisis. It is free, open 24 hours, and connects you to a trained crisis counselor. On weekdays, the Arkansas DHS access line at 1-844-763-0198 can also help you locate a treatment provider in your area.',
  },
];
const FaqSection = () => {
  return (
    <section className="px-4 py-8 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Arkansas Treatment and Recovery Questions Answered
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          SoberArkansas connects individuals, families, and professionals with recovery housing, inpatient treatment programs, and outpatient recovery services across Arkansas.
        </p>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quick answers to common questions about treatment and recovery options across Arkansas.
        </p>
      </div>

      <Accordion type="multiple" className="w-full">
        {faqItems.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm sm:text-base font-semibold">
              <h3 className="font-semibold">{item.q}</h3>
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>


      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/list-your-home">
          <Button variant="outline" className="gap-2">
            <FileEdit className="h-4 w-4" />
            List or Update Your Listing (Free)
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default FaqSection;
