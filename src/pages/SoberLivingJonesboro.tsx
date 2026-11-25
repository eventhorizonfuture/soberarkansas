import SoberLivingCity from './SoberLivingCity';

const SoberLivingJonesboro = () => (
  <SoberLivingCity
    config={{
      city: 'Jonesboro',
      county: 'Craighead County',
      slug: 'sober-living-jonesboro-arkansas',
      intro: ({ programs, homes }) => [
        `Jonesboro sits on Crowley's Ridge in northeast Arkansas, where I-555 and US-63 meet, the hub of the northeast corner of the state. This directory lists ${programs} treatment programs and ${homes} recovery housing listings in Jonesboro.`,
        `Whether you're a family member searching for placement, a discharge planner coordinating aftercare, or a professional looking for housing options, this page lists recovery resources in the Jonesboro area. Treatment programs in Arkansas are licensed by the Division of Provider Services and Quality Assurance (DPSQA) in the Department of Human Services, and certified recovery residences are listed by AARR, the Arkansas Alliance of Recovery Residences.`,
      ],
      faq: [
        { q: 'How do I find sober living in Jonesboro, Arkansas?', a: 'Browse this page for recovery housing in Jonesboro, or search the full Sober Arkansas directory and filter by city. Contact homes directly to confirm openings, pricing, and admission requirements.' },
        { q: 'What types of treatment programs are available in Jonesboro?', a: 'Jonesboro has sober living homes, inpatient residential treatment, detox, outpatient programs, and medication-assisted treatment. Search the directory to compare options by category.' },
        { q: 'Does Jonesboro have treatment programs that take Medicaid?', a: 'Many Jonesboro programs take Medicaid or private insurance. Filter the directory by "Takes Medicaid," or call a program directly and ask about coverage for the level of care you need.' },
        { q: 'I need help right now in Jonesboro. Who do I call?', a: 'Call or text 988. It is free and open 24 hours, and connects you to a trained crisis counselor. On weekdays you can also call the Arkansas DHS access line at 1-844-763-0198 to locate a treatment provider.' },
      ],
    }}
  />
);

export default SoberLivingJonesboro;
