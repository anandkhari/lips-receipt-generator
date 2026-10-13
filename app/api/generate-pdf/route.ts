import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptPdf } from '@/lib/pdf';
import { Student, Payment, ReceiptType } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function generateReceiptFilename(receiptNumber?: string, studentName?: string): string {
  const cleanStudent = (studentName || 'STUDENT')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let cleanReceiptNo = (receiptNumber || '001')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Normalize prefix so we always produce LIPS-STP-{receiptNumber}-{studentName}.pdf
  if (cleanReceiptNo.startsWith('LIPS-STP-')) {
    cleanReceiptNo = cleanReceiptNo.replace(/^LIPS-STP-/, '');
  } else if (cleanReceiptNo.startsWith('STP-')) {
    cleanReceiptNo = cleanReceiptNo.replace(/^STP-/, '');
  }

  return `LIPS-STP-${cleanReceiptNo}-${cleanStudent}.pdf`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student,
      payment,
      receiptNumber,
      admissionFee,
      receiptType,
    }: {
      student?: Student;
      payment?: Payment;
      receiptNumber?: string;
      admissionFee?: number;
      receiptType?: ReceiptType;
    } = body;

    // Validate required student data
    if (!student || !student.studentName?.trim()) {
      return NextResponse.json(
        { error: 'Student data with a valid student name is required.' },
        { status: 400 }
      );
    }

    if (!receiptNumber || !receiptNumber.trim()) {
      return NextResponse.json(
        { error: 'Receipt number is required.' },
        { status: 400 }
      );
    }

    // Determine base URL for static assets (images, fonts)
    const host = request.headers.get('host') || 'localhost:3000';
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = forwardedProto || (isLocal ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    // Generate PDF using server-rendered ReceiptTemplate
    const pdfBuffer = await generateReceiptPdf({
      student,
      payment,
      receiptNumber: receiptNumber.trim(),
      admissionFee: Number(admissionFee ?? 0),
      receiptType,
      baseUrl,
    });

    const filename = generateReceiptFilename(receiptNumber, student.studentName);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);

    // Return safe, user-facing error response
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? `PDF generation failed: ${error.message}`
            : 'Unable to generate PDF. Please try again.',
      },
      { status: 500 }
    );
  }
}
