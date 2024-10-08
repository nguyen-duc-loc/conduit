'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginSchema } from '@/forms/login-form';
import { z } from 'zod';

export async function login(loginFormData: z.infer<typeof LoginSchema>, rdr: boolean = true) {
  const response = await fetch(`${process.env.BACKEND_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user: {
        ...loginFormData
      }
    })
  });

  if (!response.ok) {
    if (response.status === 500) {
      return { error: 'Something went wrong. Try again later' };
    } else {
      return { error: 'Email or password is incorrect.' };
    }
  } else {
    const data: {
      user: { username: string; email: string; admin: boolean; token: string };
    } = await response.json();
    const token = data.user.token;
    cookies().set({
      name: 'AUTH_TOKEN',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: true,
      httpOnly: true
    });
    if (rdr) redirect('/');
    return null;
  }
}

export async function logout() {
  cookies().delete('AUTH_TOKEN');
  redirect('/login');
}
