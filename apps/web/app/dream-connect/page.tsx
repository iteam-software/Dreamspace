import { auth } from '@/lib/auth';

/**
 * Dream Connect page
 * Network with others who share similar goals and interests
 */
export default async function DreamConnectPage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Please log in to access Dream Connect</div>;
  }

  return (
    <main>
      <header>
        <h1>Dream Connect</h1>
        <p>Connect with others who share your dreams</p>
      </header>

      <section>
        <h2>Connection Filters</h2>
        <div>
          <label>
            Filter by category:
            <select>
              <option>All</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2>Suggested Connections</h2>
        <div>
          <p>Connection suggestions will appear here</p>
        </div>
      </section>

      <section>
        <h2>Recent Connections</h2>
        <div>
          <p>Your recent connections will appear here</p>
        </div>
      </section>
    </main>
  );
}
