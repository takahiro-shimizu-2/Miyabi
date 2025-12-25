import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Miyabi</h1>
        <p className="text-muted mb-8">Autonomous AI Development Platform</p>

        <div className="grid gap-4">
          <Link
            href="/dashboard/workflows/create"
            className="block p-6 border border-border rounded-lg hover:border-accent transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Workflow Editor</h2>
            <p className="text-muted">Create and edit workflow DAGs visually</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
