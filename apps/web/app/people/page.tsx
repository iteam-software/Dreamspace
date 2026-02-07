import { auth } from '@/lib/auth';

/**
 * People Dashboard page
 * Admin view for managing coaches and users
 */
export default async function PeoplePage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Please log in to access People Dashboard</div>;
  }

  return (
    <main>
      <header>
        <h1>People Dashboard</h1>
        <p>Manage coaches and team members</p>
      </header>

      <nav>
        <button>Coaches</button>
        <button>Users</button>
      </nav>

      <section>
        <h2>Coaches</h2>
        <div>
          <p>Coach list will appear here</p>
        </div>
      </section>

      <section>
        <h2>Team Metrics</h2>
        <div>
          <div>
            <h3>Total Users</h3>
            <p>0</p>
          </div>
          <div>
            <h3>Active Dreams</h3>
            <p>0</p>
          </div>
          <div>
            <h3>Completed This Week</h3>
            <p>0</p>
          </div>
        </div>
      </section>
    </main>
  );
}
