import * as React from 'npm:react@18.3.1';
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22';
import type { TemplateEntry } from './registry.ts';
import { INQUIRY_RECIPIENT, inquirySubject, type InquiryFields } from '../featured-inquiry-delivery.ts';

const Email = (props: Partial<InquiryFields>) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Featured listing inquiry from {props.facility_name || 'a Arkansas facility'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#253347' }}>
      <Container style={{ padding: '28px', maxWidth: '600px' }}>
        <Heading style={{ color: '#0C4A56', fontSize: '24px' }}>SoberArkansas</Heading>
        <Text>Get Featured inquiry</Text>
        <Hr style={{ borderColor: '#e1dace' }} />
        {([
          ['Facility or home name', props.facility_name], ['Contact name', props.contact_name],
          ['Email', props.email], ['Phone', props.phone], ['City', props.city],
          ['Listing type', props.listing_type], ['Message', props.message],
        ] as const).map(([label, value]) => <Text key={label} style={{ whiteSpace: 'pre-wrap' }}><strong>{label}:</strong> {value || 'Not provided'}</Text>)}
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data) => inquirySubject({ facility_name: typeof data.facility_name === 'string' ? data.facility_name : 'Arkansas facility' }),
  to: INQUIRY_RECIPIENT,
  displayName: 'Get Featured inquiry',
  previewData: { facility_name: 'Arkansas Recovery Home', contact_name: 'Sample contact', email: 'contact@example.com', phone: '', city: 'Pittsburgh', listing_type: 'Sober living', message: 'Please contact me about featured placement.' },
} satisfies TemplateEntry;