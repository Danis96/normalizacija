import { SpendingTracker } from '../components/SpendingTracker';

export function Spending() {
  return (
    <div className="min-h-screen retro-desktop p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-green-600">Spending Tracker</h1>
          <p className="text-emerald-700 mt-1 text-lg">
            Track expenses and receipts from one dedicated page.
          </p>
        </div>
        <SpendingTracker />
      </div>
    </div>
  );
}
