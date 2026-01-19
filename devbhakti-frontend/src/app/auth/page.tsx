import type { Metadata } from 'next';
import AuthForm from '@/components/auth/AuthForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Authentication - DevBhakti',
  description: 'Sign in or create your DevBhakti account',
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
