import { auth } from '@/lib/auth';

/**
 * Scorecard page
 * Track activity points and progress history
 */
export default async function ScorecardPage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Please log in to access Scorecard</div>;
  }

  return (
    <main>
      <header>
        <h1>Scorecard</h1>
        <p>Track your activity and progress</p>
      </header>

      <section>
        <h2>Summary</h2>
        <div>
          <div>
            <h3>Total Score</h3>
            <p>0 points</p>
          </div>
          <div>
            <h3>This Week</h3>
            <p>0 points</p>
          </div>
          <div>
            <h3>This Month</h3>
            <p>0 points</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Activity History</h2>
        <div>
          <p>Your activity history will appear here</p>
        </div>
      </section>

      <section>
        <h2>Year Breakdown</h2>
        <div>
          <p>Yearly trends will appear here</p>
        </div>
      </section>
    </main>
  );
}
