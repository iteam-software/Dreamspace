import { auth } from '@/lib/auth';
import { getUserProfile } from '@/services/users';

/**
 * Dashboard page - Main application dashboard
 * Shows user's current week goals, dreams, and progress
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const result = await getUserProfile(session.user.id);

  if (result.failed) {
    return <div>Error loading profile: {result.errors?._errors?.join(', ') || 'Unknown error'}</div>;
  }

  const profile = result.data;

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {profile.displayName || profile.name || 'Dreamer'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your dreams and achieve your goals
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dashboard widgets will go here */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Current Week</h2>
            <p className="text-gray-600">Your weekly goals will appear here</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Dream Book</h2>
            <p className="text-gray-600">Your dreams will appear here</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Progress</h2>
            <p className="text-gray-600">Your progress will appear here</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🚧 Monorepo Migration in Progress
          </h3>
          <p className="text-blue-800">
            The application is being migrated to a modern NextJS monorepo architecture.
            This dashboard is a placeholder that will be fully implemented as we migrate
            the remaining Azure Functions to server actions.
          </p>
          <p className="text-blue-800 mt-2">
            <strong>User ID:</strong> {session.user.id}
          </p>
          <p className="text-blue-800">
            <strong>Email:</strong> {session.user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
