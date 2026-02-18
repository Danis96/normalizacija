import { DailyTodoList } from '../components/DailyTodoList';
import { WheneverTodoList } from '../components/WheneverTodoList';

export function DailyTasks() {
  return (
    <div className="min-h-screen retro-desktop p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-pink-600">Daily Tasks</h1>
          <p className="text-purple-600 mt-1 text-lg">
            Your daily and whenever task widgets in one place.
          </p>
        </div>
        <DailyTodoList />
        <WheneverTodoList />
      </div>
    </div>
  );
}
