import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
}

export interface WorkoutLog {
  id: string;
  date: string;
  exercises: Exercise[];
  bodyWeight?: number;
  notes: string;
  imageUrl?: string;
}

export interface WaterLog {
  id: string;
  date: string;
  bottles: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date?: string; // If undefined, it's a "whenever" task
}

export interface SpendingEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  receiptImage?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  review: string;
  rating: number;
  image?: string;
  createdAt: string;
}

export interface CinemaItem {
  id: string;
  title: string;
  review: string;
  rating: number;
  image?: string;
  createdAt: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  workouts: WorkoutLog[];
  addWorkout: (workout: Omit<WorkoutLog, 'id'>) => void;
  updateWorkout: (id: string, workout: Partial<WorkoutLog>) => void;
  deleteWorkout: (id: string) => void;
  currentUser: string;
  waterLogs: WaterLog[];
  addWaterBottle: (date: string) => void;
  removeWaterBottle: (date: string) => void;
  getWaterForDate: (date: string) => number;
  todos: TodoItem[];
  addTodo: (text: string, date?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  getTodosForDate: (date: string) => TodoItem[];
  getWheneverTodos: () => TodoItem[];
  spending: SpendingEntry[];
  addSpending: (entry: Omit<SpendingEntry, 'id'>) => void;
  deleteSpending: (id: string) => void;
  getSpendingForDate: (date: string) => SpendingEntry[];
  getTotalSpending: (startDate?: string, endDate?: string) => number;
  libraryItems: LibraryItem[];
  addLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt'>) => void;
  deleteLibraryItem: (id: string) => void;
  cinemaItems: CinemaItem[];
  addCinemaItem: (item: Omit<CinemaItem, 'id' | 'createdAt'>) => void;
  deleteCinemaItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [spending, setSpending] = useState<SpendingEntry[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [cinemaItems, setCinemaItems] = useState<CinemaItem[]>([]);

  // Load auth state and workouts from localStorage on mount
  useEffect(() => {
    const authState = localStorage.getItem('isAuthenticated');
    const user = localStorage.getItem('currentUser');
    const storedWorkouts = localStorage.getItem('workoutLogs');
    const storedWaterLogs = localStorage.getItem('waterLogs');
    const storedTodos = localStorage.getItem('todos');
    const storedSpending = localStorage.getItem('spending');
    const storedLibraryItems = localStorage.getItem('libraryItems');
    const storedCinemaItems = localStorage.getItem('cinemaItems');
    
    if (authState === 'true' && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    
    if (storedWorkouts) {
      setWorkouts(JSON.parse(storedWorkouts));
    }

    if (storedWaterLogs) {
      setWaterLogs(JSON.parse(storedWaterLogs));
    }

    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }

    if (storedSpending) {
      setSpending(JSON.parse(storedSpending));
    }

    if (storedLibraryItems) {
      setLibraryItems(JSON.parse(storedLibraryItems));
    }

    if (storedCinemaItems) {
      setCinemaItems(JSON.parse(storedCinemaItems));
    }
  }, []);

  // Save workouts to localStorage whenever they change
  useEffect(() => {
    if (workouts.length > 0 || localStorage.getItem('workoutLogs')) {
      localStorage.setItem('workoutLogs', JSON.stringify(workouts));
    }
  }, [workouts]);

  // Save water logs to localStorage whenever they change
  useEffect(() => {
    if (waterLogs.length > 0 || localStorage.getItem('waterLogs')) {
      localStorage.setItem('waterLogs', JSON.stringify(waterLogs));
    }
  }, [waterLogs]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todos.length > 0 || localStorage.getItem('todos')) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]);

  // Save spending to localStorage whenever it changes
  useEffect(() => {
    if (spending.length > 0 || localStorage.getItem('spending')) {
      localStorage.setItem('spending', JSON.stringify(spending));
    }
  }, [spending]);

  useEffect(() => {
    if (libraryItems.length > 0 || localStorage.getItem('libraryItems')) {
      localStorage.setItem('libraryItems', JSON.stringify(libraryItems));
    }
  }, [libraryItems]);

  useEffect(() => {
    if (cinemaItems.length > 0 || localStorage.getItem('cinemaItems')) {
      localStorage.setItem('cinemaItems', JSON.stringify(cinemaItems));
    }
  }, [cinemaItems]);

  const login = (email: string, password: string): boolean => {
    // Simple mock authentication - in real app, this would call an API
    if (email && password) {
      setIsAuthenticated(true);
      setCurrentUser(email);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  };

  const addWorkout = (workout: Omit<WorkoutLog, 'id'>) => {
    const newWorkout: WorkoutLog = {
      ...workout,
      id: Date.now().toString(),
    };
    setWorkouts(prev => [...prev, newWorkout]);
  };

  const updateWorkout = (id: string, updatedWorkout: Partial<WorkoutLog>) => {
    setWorkouts(prev =>
      prev.map(workout => (workout.id === id ? { ...workout, ...updatedWorkout } : workout))
    );
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== id));
  };

  const addWaterBottle = (date: string) => {
    setWaterLogs(prev => {
      const existing = prev.find(log => log.date === date);
      if (existing) {
        return prev.map(log =>
          log.date === date ? { ...log, bottles: log.bottles + 1 } : log
        );
      } else {
        return [...prev, { id: Date.now().toString(), date, bottles: 1 }];
      }
    });
  };

  const removeWaterBottle = (date: string) => {
    setWaterLogs(prev => {
      const existing = prev.find(log => log.date === date);
      if (existing && existing.bottles > 0) {
        return prev.map(log =>
          log.date === date ? { ...log, bottles: log.bottles - 1 } : log
        );
      } else {
        return prev;
      }
    });
  };

  const getWaterForDate = (date: string): number => {
    const log = waterLogs.find(log => log.date === date);
    return log ? log.bottles : 0;
  };

  const addTodo = (text: string, date?: string) => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      date,
    };
    setTodos(prev => [...prev, newTodo]);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const getTodosForDate = (date: string): TodoItem[] => {
    return todos.filter(todo => todo.date === date);
  };

  const getWheneverTodos = (): TodoItem[] => {
    return todos.filter(todo => !todo.date);
  };

  const addSpending = (entry: Omit<SpendingEntry, 'id'>) => {
    const newEntry: SpendingEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setSpending(prev => [...prev, newEntry]);
  };

  const deleteSpending = (id: string) => {
    setSpending(prev => prev.filter(entry => entry.id !== id));
  };

  const getSpendingForDate = (date: string): SpendingEntry[] => {
    return spending.filter(entry => entry.date === date);
  };

  const getTotalSpending = (startDate?: string, endDate?: string): number => {
    const filteredSpending = spending.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      return (!start || entryDate >= start) && (!end || entryDate <= end);
    });
    return filteredSpending.reduce((total, entry) => total + entry.amount, 0);
  };

  const addLibraryItem = (item: Omit<LibraryItem, 'id' | 'createdAt'>) => {
    const newItem: LibraryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setLibraryItems((prev) => [newItem, ...prev]);
  };

  const deleteLibraryItem = (id: string) => {
    setLibraryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addCinemaItem = (item: Omit<CinemaItem, 'id' | 'createdAt'>) => {
    const newItem: CinemaItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCinemaItems((prev) => [newItem, ...prev]);
  };

  const deleteCinemaItem = (id: string) => {
    setCinemaItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        workouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        currentUser,
        waterLogs,
        addWaterBottle,
        removeWaterBottle,
        getWaterForDate,
        todos,
        addTodo,
        toggleTodo,
        deleteTodo,
        getTodosForDate,
        getWheneverTodos,
        spending,
        addSpending,
        deleteSpending,
        getSpendingForDate,
        getTotalSpending,
        libraryItems,
        addLibraryItem,
        deleteLibraryItem,
        cinemaItems,
        addCinemaItem,
        deleteCinemaItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
