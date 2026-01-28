import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Home page - redirects to dashboard if authenticated, otherwise to sign in
 */
export default async function Home() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">Dreamspace</h1>
        <p className="text-xl text-white/90 mb-8">
          Transform your dreams into reality with goal tracking and team coaching
        </p>
        <a
          href="/api/auth/signin"
          className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
        >
          Sign In with Microsoft
        </a>
      </div>
    </div>
  );
}
