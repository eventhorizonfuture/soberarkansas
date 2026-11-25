export const INQUIRY_RECIPIENT = 'ContactSoberOhio@gmail.com';
export interface InquiryFields {
  facility_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  listing_type: string;
  message: string;
}
export const inquirySubject = (fields: Pick<InquiryFields, 'facility_name'>) =>
  `Get Featured inquiry (Arkansas) — ${fields.facility_name}`;

// A saved backup alone is never a successful send.
export async function deliverInquiry(
  fields: InquiryFields,
  submissionId: string,
  send: (recipient: string, options: { templateData: InquiryFields; idempotencyKey: string; replyTo: string }) => Promise<{ sent: boolean }>,
) {
  const result = await send(INQUIRY_RECIPIENT, {
    templateData: fields,
    idempotencyKey: `get-featured-inquiry-${submissionId}`,
    replyTo: fields.email,
  });
  return result.sent === true;
}
