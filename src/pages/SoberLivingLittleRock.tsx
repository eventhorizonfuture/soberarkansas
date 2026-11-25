import SoberLivingCity from './SoberLivingCity';

const SoberLivingLittleRock = () => (
  <SoberLivingCity
    config={{
      city: 'Little Rock',
      county: 'Pulaski County',
      slug: 'sober-living-little-rock-arkansas',
      intro: ({ programs, homes }) => [
        `Little Rock sits on the Arkansas River where I-30 and I-40 cross, the state capital and the middle of Arkansas. This directory lists ${programs} treatment programs and ${homes} recovery housing listings in Little Rock.`,
        `Whether you're a family member searching for placement, a discharge planner coordinating aftercare, or a professional looking for housing options, this page lists recovery resources in the Little Rock area. Treatment programs in Arkansas are licensed by the Division of Provider Services and Quality Assurance (DPSQA) in the Department of Human Services, and certified recovery residences are listed by AARR, the Arkansas Alliance of Recovery Residences.`,
      ],
      faq: [
        { q: 'How do I find sober living in Little Rock, Arkansas?', a: 'Browse this page for recovery housing in Little Rock, or search the full Sober Arkansas directory and filter by city. Contact homes directly to confirm openings, pricing, and admission requirements.' },
        { q: 'What types of treatment programs are available in Little Rock?', a: 'Little Rock has sober living homes, inpatient residential treatment, detox, outpatient programs, and medication-assisted treatment. Search the directory to compare options by category.' },
        { q: 'Does Little Rock have treatment programs that take Medicaid?', a: 'Many Little Rock programs take Medicaid or private insurance. Filter the directory by "Takes Medicaid," or call a program directly and ask about coverage for the level of care you need.' },
        { q: 'I need help right now in Little Rock. Who do I call?', a: 'Call or text 988. It is free and open 24 hours, and connects you to a trained crisis counselor. On weekdays you can also call the Arkansas DHS access line at 1-844-763-0198 to locate a treatment provider.' },
      ],
    }}
  />
);

export default SoberLivingLittleRock;
