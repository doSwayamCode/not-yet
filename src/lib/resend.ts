interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'notYET <noreply@notyet.com>',
}: SendEmailParams): Promise<{ success: boolean; id?: string; error?: any }> {
  // Fallback: Console logger
  console.log('=============== MOCK EMAIL SENT ===============');
  console.log(`From:    ${from}`);
  console.log(`To:      ${Array.isArray(to) ? to.join(', ') : to}`);
  console.log(`Subject: ${subject}`);
  console.log('---------------- Content ----------------');
  console.log(html);
  console.log('================================================');

  return { success: true, id: `mock_email_${Math.random().toString(36).substring(7)}` };
}


