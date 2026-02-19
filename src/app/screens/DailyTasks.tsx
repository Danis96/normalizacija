import { useState } from 'react';
import { DailyTodoList } from '../components/DailyTodoList';
import { WheneverTodoList } from '../components/WheneverTodoList';
import { Input } from '../components/ui/input';
import { format } from 'date-fns';
import React from 'react';

export function DailyTasks() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen retro-desktop p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[#2a2334]">Daily Tasks</h1>
          <p className="text-[#5a4b62] mt-1 text-lg">
            Your daily and whenever task widgets in one place.
          </p>
        </div>
        <div className="max-w-xs">
          <label className="block text-sm text-[#2a2334] mb-2">Selected Day</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <DailyTodoList date={selectedDate} />
        <WheneverTodoList />
      </div>
    </div>
  );
}
