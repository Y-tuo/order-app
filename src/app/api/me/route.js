import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user: session });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
