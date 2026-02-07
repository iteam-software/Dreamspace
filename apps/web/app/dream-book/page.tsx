import { auth } from '@/lib/auth';

/**
 * Dream Book page
 * Manage dreams, goals, and year vision
 */
export default async function DreamBookPage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Please log in to access Dream Book</div>;
  }

  return (
    <main>
      <header>
        <h1>Dream Book</h1>
        <p>Create and manage your dreams</p>
      </header>

      <section>
        <h2>Year Vision</h2>
        <textarea placeholder="What is your vision for this year?" rows={4}></textarea>
      </section>

      <section>
        <h2>My Dreams</h2>
        <button>+ Add Dream</button>
        <div>
          <p>Your dreams will appear here</p>
        </div>
      </section>
    </main>
  );
}
