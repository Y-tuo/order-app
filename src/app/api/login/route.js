import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    // Fetch user from DB
    const { data: user, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    // Verify password
    if (password !== user.password) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({ sub: user.id, username: user.username, role: user.role || 'user' });

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role || 'user' } });
    response.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Customer login error:', err);
    return NextResponse.json({ error: '登录发生错误' }, { status: 500 });
  }
}
