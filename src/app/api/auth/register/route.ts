import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!email || !password || !otp) {
      return NextResponse.json({ error: 'Email, password, and OTP are required' }, { status: 400 });
    }

    // Verify OTP first
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: otp,
        },
      },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Delete the token immediately after use
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: otp,
        },
      },
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ user, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong during registration' }, { status: 500 });
  }
}
