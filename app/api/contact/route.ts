import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { senderEmail, subject, message } = await req.json();

    if (!senderEmail || !message) {
      return NextResponse.json(
        { error: 'Email and message are required.' },
        { status: 400 }
      );
    }

    // Send email to your inbox
    const data = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: 'thepriyanshucodes@gmail.com', 
      replyTo: senderEmail,
      subject: subject || `Portfolio Inquiry from ${senderEmail}`,
      text: `Sender: ${senderEmail}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email.' },
      { status: 500 }
    );
  }
}