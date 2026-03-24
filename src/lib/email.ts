import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  try {
    await resend.emails.send({
      from: 'CodeViki <auth@lumiadigital.site>',
      to: email,
      subject: 'Verify your CodeViki account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Verify your identity</h1>
          <p style="color: #4a5568; line-height: 1.6;">Welcome to CodeViki! Use the following one-time password (OTP) to complete your signup process:</p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #6c5ce7;">${token}</span>
          </div>
          <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">&copy; 2026 CodeViki by Lumia Digital</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}
