export interface Guide { slug: string; title: string; summary: string; sections: { heading: string; body: string }[] }

export const guides: Guide[] = [
  {
    slug: 'verify-a-facility-license',
    title: "How to verify a facility's state license",
    summary: 'A few minutes of checking can protect you from unlicensed or unsafe programs.',
    sections: [
      { heading: 'Who licenses treatment in Arkansas', body: 'In Arkansas, substance use treatment programs are licensed by the Division of Provider Services and Quality Assurance (DPSQA), part of the Arkansas Department of Human Services, under the state\u2019s licensure standards for Alcohol & Other Drug Abuse Treatment Programs (20 CAR Part 433). A license is required of anyone operating a substance abuse treatment program in Arkansas, by level of care, from outpatient and intensive outpatient through residential treatment and withdrawal management. Publicly funded services are overseen separately by the DHS Office of Substance Abuse and Mental Health (OSAMH), which contracts with one provider in each of eight catchment areas covering all 75 counties. Detox inside a hospital may sit under the hospital\u2019s own license instead.' },
      { heading: 'How to check', body: 'Ask the facility for its license, then confirm it in the Department of Human Services provider search (the DPSQA \u201cFreedom of Choice\u201d provider search at humanservices.arkansas.gov). Confirm the name, address, services, and that the license is current.' },
      { heading: 'Sober living homes', body: 'Sober living homes are not licensed as treatment because they do not provide treatment, and Arkansas has no state certification statute for recovery residences. Certification is voluntary and private: the Arkansas Alliance of Recovery Residences (AARR) certifies homes that meet national recovery housing standards, and it publishes each certified residence\u2019s address, phone, and beds on its own directory (narrarkansas.org). Look for that certification, and ask about house rules, drug testing, and staff.' },
      { heading: 'Red flags', body: 'Be careful of anyone offering free travel, cash, or free rent in exchange for enrolling, programs that will not give a license number, or pressure to decide immediately.' },
    ],
  },
  {
    slug: 'levels-of-care',
    title: 'Detox, residential, PHP, IOP and sober living: what is the difference?',
    summary: 'A plain-language map of the levels of care, from most to least intensive.',
    sections: [
      { heading: 'Detox (withdrawal management)', body: 'Short-term medical support, usually 3 to 10 days, to get through withdrawal safely. Detox is a first step, not treatment by itself.' },
      { heading: 'Residential / inpatient', body: 'You live at the facility and take part in treatment most of the day, typically for 30 to 90 days.' },
      { heading: 'PHP (partial hospitalization)', body: 'Treatment about 5 to 6 hours a day, most days of the week, while you sleep at home or in sober living.' },
      { heading: 'IOP (intensive outpatient)', body: 'About 9 to 15 hours a week of groups and counseling, often in the evening so people can keep working.' },
      { heading: 'Sober living', body: 'A drug- and alcohol-free home with house rules and peer support. It is housing, not treatment, and pairs well with outpatient care.' },
    ],
  },
  {
    slug: 'how-medicaid-pays-for-treatment',
    title: 'How Medicaid pays for treatment',
    summary: 'Medicaid covers a wide range of substance use treatment in Arkansas, often at no cost to the member.',
    sections: [
      { heading: 'What is covered', body: 'Medicaid covers outpatient and intensive outpatient treatment, residential treatment, withdrawal management, medications for addiction treatment (like buprenorphine and methadone), and recovery services.' },
      { heading: 'How Medicaid is delivered', body: 'Arkansas Medicaid is run by the Arkansas Department of Human Services (DHS). Publicly funded substance use services are also delivered through the eight catchment-area providers contracted by the DHS Office of Substance Abuse and Mental Health (OSAMH), one for every part of the state. Member services can confirm which programs are in network, and programs in this directory that take Medicaid are tagged so you can filter for them.' },
      { heading: 'How to start', body: "Call a program directly and ask whether it takes Medicaid for the level of care you need. You can also call the Arkansas Mental Health & Addiction Support Line at 1-844-763-0198 (Monday through Friday, 8 am to 5 pm) to locate a provider in your area, or call or text 988 any hour." },
      { heading: 'Sober living', body: 'Medicaid generally does not pay rent at sober living homes. Ask the home about its cost and whether it is certified through AARR.' },
    ],
  },
  {
    slug: 'choosing-a-sober-living-home',
    title: 'Questions to ask before choosing a sober living home',
    summary: 'Use these questions on a tour or phone call to find a safe, supportive home.',
    sections: [
      { heading: 'Rules and safety', body: 'What are the house rules? How often is drug testing done? What happens after a relapse? Is there a curfew?' },
      { heading: 'Support', body: 'Is there a house manager on site? Are meetings or outside treatment required? Do residents help each other with jobs and rides?' },
      { heading: 'Money', body: 'What is the weekly or monthly cost, and what does it include? Is there a deposit, and is it refundable? Get it in writing.' },
      { heading: 'Certification', body: 'Is the home certified by AARR or another recovery residence organization? Can you speak with a current resident or see the home in person?' },
    ],
  },
];
