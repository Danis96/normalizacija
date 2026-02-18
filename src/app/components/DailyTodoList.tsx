import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface DailyTodoListProps {
  date?: string;
}

export function DailyTodoList({ date }: DailyTodoListProps) {
  const todayDate = date || format(new Date(), 'yyyy-MM-dd');
  const { getTodosForDate, addTodo, toggleTodo, deleteTodo } = useApp();
  const [newTodoText, setNewTodoText] = useState('');
  const todos = getTodosForDate(todayDate);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) {
      return;
    }

    try {
      await addTodo(newTodoText, todayDate);
      setNewTodoText('');
      toast.success('Task added.');
    } catch {
      toast.error('Could not add task.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch {
      toast.error('Could not update task.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      toast.success('Task removed.');
    } catch {
      toast.error('Could not remove task.');
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-5 h-5 text-[#2a2334]" />
              <h3 className="text-xl font-bold text-[#2a2334]">Daily Tasks</h3>
            </div>
            <p className="text-sm text-[#5a4b62]">
              {format(parseISO(todayDate), 'MMMM d, yyyy')}
            </p>
          </div>
          {totalCount > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-[#2a2334]">
                {completedCount}/{totalCount}
              </div>
              <p className="text-xs text-[#5a4b62]">completed</p>
            </div>
          )}
        </div>

        <form onSubmit={handleAddTodo} className="mb-4">
          <div className="flex gap-2">
            <Input
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1"
            />
            <Button type="submit" size="sm" className="bg-[#f3a3cd] hover:bg-[#ffbadf]">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="text-center py-8 text-[#8b7b94]">
              <p>No tasks for today.</p>
              <p className="text-sm mt-1">Add some tasks to get started</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334] transition-colors group"
              >
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => void handleToggle(todo.id)}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`flex-1 cursor-pointer text-[#2a2334] ${
                    todo.completed ? 'line-through opacity-50' : ''
                  }`}
                >
                  {todo.text}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
