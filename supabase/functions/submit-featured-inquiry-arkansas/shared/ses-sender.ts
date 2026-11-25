import { INQUIRY_RECIPIENT, inquirySubject, type InquiryFields } from './featured-inquiry-delivery.ts';

// Amazon SES sender for Arkansas Get Featured inquiries. It implements the
// exact `send` signature that deliverInquiry injects, so index.ts changes are
// limited to the import and the one call site.
//
// Arkansas email runs on Amazon SES (soberarkansas.com is SES-verified:
// identity, DKIM, and custom MAIL FROM all Success). Sending uses the SESv2
// REST API signed with AWS Signature V4, from the dedicated send-only IAM
// user `ses-directory-sender` (ses:SendEmail scoped to the directory domain
// identities). Requires the project secrets AWS_SES_ACCESS_KEY_ID and
// AWS_SES_SECRET_ACCESS_KEY for that user, set only on this project.
//
// SES has no idempotency key; duplicate protection comes from the caller's
// submission row: once a send is recorded as delivered, retries return
// before reaching this sender.

const FROM = 'SoberArkansas <noreply@soberarkansas.com>';
const REGION = 'us-east-2';
const HOST = 'email.us-east-2.amazonaws.com';
const SERVICE = 'ses';

export interface SesSendOptions {
  templateData: InquiryFields;
  idempotencyKey: string;
  replyTo: string;
}

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const encoder = new TextEncoder();

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function signRequest(accessKeyId: string, secretAccessKey: string, payload: string) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(payload);
  const canonicalHeaders = `content-type:application/json\nhost:${HOST}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  const canonicalRequest = ['POST', '/v2/email/outbound-emails', '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256Hex(canonicalRequest)].join('\n');
  const kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
  };
}

export async function sendViaSES(
  recipient: string,
  options: SesSendOptions,
): Promise<{ sent: boolean }> {
  const accessKeyId = Deno.env.get('AWS_SES_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('AWS_SES_SECRET_ACCESS_KEY');
  if (!accessKeyId || !secretAccessKey) throw new Error('SES credentials are not configured');

  const fields = options.templateData;
  const to = recipient || INQUIRY_RECIPIENT;
  const subject = inquirySubject(fields);

  const lines = [
    `Facility: ${fields.facility_name}`,
    `Contact: ${fields.contact_name}`,
    `Email: ${fields.email}`,
    `Phone: ${fields.phone}`,
    `City: ${fields.city}`,
    `Listing type: ${fields.listing_type}`,
    '',
    'Message:',
    fields.message,
  ];
  const text = lines.join('\n');
  const html = '<h2>' + esc(subject) + '</h2>' +
    lines.map((line) => line === '' ? '<br>' : '<p>' + esc(line) + '</p>').join('\n');

  const payload = JSON.stringify({
    FromEmailAddress: FROM,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: text, Charset: 'UTF-8' },
          Html: { Data: html, Charset: 'UTF-8' },
        },
      },
    },
  });

  const { authorization, amzDate } = await signRequest(accessKeyId, secretAccessKey, payload);
  const response = await fetch(`https://${HOST}/v2/email/outbound-emails`, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
    },
    body: payload,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`SES send failed with ${response.status}: ${detail.slice(0, 300)}`);
  }
  return { sent: true };
}
