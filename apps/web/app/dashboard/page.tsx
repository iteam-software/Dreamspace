import { auth } from '@/lib/auth';
import { DashboardHeader, WeekGoalsWidget, DashboardDreamCard } from '@/components/dashboard';

/**
 * Dashboard page - Main application dashboard
 * Shows user's current week goals, dreams, and progress
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  return (
    <main>
      <DashboardHeader />

      <nav>
        <a href="/dream-book">Dream Book</a>
        <a href="/dream-connect">Dream Connect</a>
        <a href="/scorecard">Scorecard</a>
        <a href="/dream-team">Dream Team</a>
        <a href="/people">People</a>
        <a href="/build-overview">Build Overview</a>
        <a href="/health">Health Check</a>
      </nav>

      <section>
        <WeekGoalsWidget />
      </section>

      <section>
        <DashboardDreamCard />
      </section>

      <section>
        <h2>Quick Stats</h2>
        <div>
          <div>
            <h3>This Week</h3>
            <p>Goals completed: 0/0</p>
          </div>
          <div>
            <h3>This Month</h3>
            <p>Dreams updated: 0</p>
          </div>
          <div>
            <h3>Progress</h3>
            <p>On track</p>
          </div>
        </div>
      </section>
    </main>
  );
}
