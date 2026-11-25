import SoberLivingCity from './SoberLivingCity';

const SoberLivingFortSmith = () => (
  <SoberLivingCity
    config={{
      city: 'Fort Smith',
      county: 'Sebastian County',
      slug: 'sober-living-fort-smith-arkansas',
      intro: ({ programs, homes }) => [
        `Fort Smith sits on the Arkansas River at the Oklahoma line, where I-40 and US-71 meet, the hub of the River Valley. This directory lists ${programs} treatment programs and ${homes} recovery housing listings in Fort Smith.`,
        `Whether you're a family member searching for placement, a discharge planner coordinating aftercare, or a professional looking for housing options, this page lists recovery resources in the Fort Smith area. Treatment programs in Arkansas are licensed by the Division of Provider Services and Quality Assurance (DPSQA) in the Department of Human Services, and certified recovery residences are listed by AARR, the Arkansas Alliance of Recovery Residences.`,
      ],
      faq: [
        { q: 'How do I find sober living in Fort Smith, Arkansas?', a: 'Browse this page for recovery housing in Fort Smith, or search the full Sober Arkansas directory and filter by city. Contact homes directly to confirm openings, pricing, and admission requirements.' },
        { q: 'What types of treatment programs are available in Fort Smith?', a: 'Fort Smith has sober living homes, inpatient residential treatment, detox, outpatient programs, and medication-assisted treatment. Search the directory to compare options by category.' },
        { q: 'Does Fort Smith have treatment programs that take Medicaid?', a: 'Many Fort Smith programs take Medicaid or private insurance. Filter the directory by "Takes Medicaid," or call a program directly and ask about coverage for the level of care you need.' },
        { q: 'I need help right now in Fort Smith. Who do I call?', a: 'Call or text 988. It is free and open 24 hours, and connects you to a trained crisis counselor. On weekdays you can also call the Arkansas DHS access line at 1-844-763-0198 to locate a treatment provider.' },
      ],
    }}
  />
);

export default SoberLivingFortSmith;
