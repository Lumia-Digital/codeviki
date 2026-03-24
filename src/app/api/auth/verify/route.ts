import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Strict email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in VerificationToken using upsert to handle retries
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: otp,
        },
      },
      update: {
        expires,
      },
      create: {
        identifier: email.toLowerCase(),
        token: otp,
        expires,
      },
    });

    // Send email
    const emailRes = await sendVerificationEmail(email.toLowerCase(), otp);
    
    if (!emailRes.success) {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
