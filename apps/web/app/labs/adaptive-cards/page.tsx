import { auth } from '@/lib/auth';

/**
 * Adaptive Cards Lab page
 * Experimental features and testing
 */
export default async function AdaptiveCardsLabPage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Please log in to access Labs</div>;
  }

  return (
    <main>
      <header>
        <h1>Adaptive Cards Lab</h1>
        <p>Experimental features and UI components</p>
      </header>

      <section>
        <h2>Card Templates</h2>
        <div>
          <p>Adaptive card templates will appear here</p>
        </div>
      </section>

      <section>
        <h2>Testing Area</h2>
        <div>
          <button>Test Card 1</button>
          <button>Test Card 2</button>
          <button>Test Card 3</button>
        </div>
      </section>

      <section>
        <h2>Preview</h2>
        <div>
          <p>Card preview will appear here</p>
        </div>
      </section>
    </main>
  );
}
