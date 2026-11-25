import { describe, expect, it, vi } from 'vitest';
import { deliverInquiry, inquirySubject } from '../../supabase/functions/_shared/featured-inquiry-delivery';

const fields = { facility_name: 'Arkansas Recovery Home', contact_name: 'Test Contact', email: 'contact@example.com', phone: '937-204-8897', city: 'Kansas City', listing_type: 'Sober living', message: 'Interested in placement.' };

describe('Get Featured email delivery', () => {
  it('sends every submitted field to the required fixed recipient', async () => {
    const send = vi.fn().mockResolvedValue({ sent: true });
    expect(await deliverInquiry(fields, 'submission-1', send)).toBe(true);
    expect(send).toHaveBeenCalledWith('ContactSoberOhio@gmail.com', {
      templateData: fields, idempotencyKey: 'get-featured-inquiry-submission-1', replyTo: fields.email,
    });
  });
  it('uses the exact requested subject with the facility name', () => {
    expect(inquirySubject(fields)).toBe('Get Featured inquiry (Arkansas) — Arkansas Recovery Home');
  });
  it('never reports success when the recipient is suppressed', async () => {
    expect(await deliverInquiry(fields, 'submission-1', async () => ({ sent: false }))).toBe(false);
  });
  it('propagates sending failures instead of reporting success', async () => {
    await expect(deliverInquiry(fields, 'submission-1', async () => { throw new Error('Send rejected'); })).rejects.toThrow('Send rejected');
  });
  it('waits for email acceptance before resolving success', async () => {
    let accept: ((value: { sent: boolean }) => void) | undefined;
    const accepted = new Promise<{ sent: boolean }>((resolve) => { accept = resolve; });
    let finished = false;
    const result = deliverInquiry(fields, 'submission-1', () => accepted).then((sent) => { finished = true; return sent; });
    await Promise.resolve();
    expect(finished).toBe(false);
    accept?.({ sent: true });
    expect(await result).toBe(true);
  });
});