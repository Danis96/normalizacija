import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';

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
  date?: string;
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

export interface WorkoutInput {
  date: string;
  exercises: Exercise[];
  bodyWeight?: number;
  notes: string;
  imageUrl?: string;
  imageFile?: File | null;
}

export interface SpendingInput {
  date: string;
  amount: number;
  category: string;
  description: string;
  receiptImage?: string;
  imageFile?: File | null;
}

export interface LibraryInput {
  title: string;
  review: string;
  rating: number;
  image?: string;
  imageFile?: File | null;
}

export interface CinemaInput {
  title: string;
  review: string;
  rating: number;
  image?: string;
  imageFile?: File | null;
}

interface AppContextType {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  workouts: WorkoutLog[];
  addWorkout: (workout: WorkoutInput) => Promise<void>;
  updateWorkout: (id: string, workout: Partial<WorkoutInput>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  currentUser: string;
  waterLogs: WaterLog[];
  addWaterBottle: (date: string) => Promise<void>;
  removeWaterBottle: (date: string) => Promise<void>;
  getWaterForDate: (date: string) => number;
  todos: TodoItem[];
  addTodo: (text: string, date?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  getTodosForDate: (date: string) => TodoItem[];
  getWheneverTodos: () => TodoItem[];
  spending: SpendingEntry[];
  addSpending: (entry: SpendingInput) => Promise<void>;
  deleteSpending: (id: string) => Promise<void>;
  getSpendingForDate: (date: string) => SpendingEntry[];
  getTotalSpending: (startDate?: string, endDate?: string) => number;
  libraryItems: LibraryItem[];
  addLibraryItem: (item: LibraryInput) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;
  cinemaItems: CinemaItem[];
  addCinemaItem: (item: CinemaInput) => Promise<void>;
  deleteCinemaItem: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User is not authenticated');
  }
  return uid;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100);
}

function mapDoc<T>(docId: string, data: T): T & { id: string } {
  return { id: docId, ...data };
}

function toDateValue(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'toDate' in raw &&
    typeof (raw as { toDate: () => Date }).toDate === 'function'
  ) {
    return (raw as { toDate: () => Date }).toDate().toISOString();
  }

  return new Date().toISOString();
}

async function uploadUserImage(uid: string, folder: string, file: File): Promise<string> {
  const safeFileName = sanitizeFileName(file.name || 'upload');
  const imageRef = ref(
    storage,
    `users/${uid}/${folder}/${Date.now()}-${safeFileName}`,
  );

  await uploadBytes(imageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  return getDownloadURL(imageRef);
}

async function deleteStorageAsset(url?: string): Promise<void> {
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com')) {
    return;
  }

  try {
    await deleteObject(ref(storage, url));
  } catch {
    // Ignore to avoid blocking data deletion due to a stale/missing object.
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState('');
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [spending, setSpending] = useState<SpendingEntry[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [cinemaItems, setCinemaItems] = useState<CinemaItem[]>([]);

  useEffect(() => {
    let dataUnsubs: Unsubscribe[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      dataUnsubs.forEach((unsubscribe) => unsubscribe());
      dataUnsubs = [];

      if (!user) {
        setIsAuthenticated(false);
        setCurrentUser('');
        setWorkouts([]);
        setWaterLogs([]);
        setTodos([]);
        setSpending([]);
        setLibraryItems([]);
        setCinemaItems([]);
        setIsAuthLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setCurrentUser(user.email ?? user.uid);

      const userRoot = collection(db, 'users', user.uid, 'workouts');
      dataUnsubs.push(
        onSnapshot(query(userRoot, orderBy('date', 'desc')), (snapshot) => {
          setWorkouts(
            snapshot.docs.map((docSnap) =>
              mapDoc(docSnap.id, docSnap.data() as Omit<WorkoutLog, 'id'>),
            ),
          );
        }),
      );

      dataUnsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'waterLogs'), orderBy('date', 'desc')),
          (snapshot) => {
            setWaterLogs(
              snapshot.docs.map((docSnap) =>
                mapDoc(docSnap.id, docSnap.data() as Omit<WaterLog, 'id'>),
              ),
            );
          },
        ),
      );

      dataUnsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'todos'), orderBy('date', 'desc')),
          (snapshot) => {
            setTodos(
              snapshot.docs.map((docSnap) =>
                mapDoc(docSnap.id, docSnap.data() as Omit<TodoItem, 'id'>),
              ),
            );
          },
        ),
      );

      dataUnsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'spending'), orderBy('date', 'desc')),
          (snapshot) => {
            setSpending(
              snapshot.docs.map((docSnap) =>
                mapDoc(docSnap.id, docSnap.data() as Omit<SpendingEntry, 'id'>),
              ),
            );
          },
        ),
      );

      dataUnsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'libraryItems'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            setLibraryItems(
              snapshot.docs.map((docSnap) => {
                const raw = docSnap.data() as Omit<LibraryItem, 'id' | 'createdAt'> & {
                  createdAt?: unknown;
                };
                return {
                  id: docSnap.id,
                  title: raw.title,
                  review: raw.review,
                  rating: raw.rating,
                  image: raw.image,
                  createdAt: toDateValue(raw.createdAt),
                };
              }),
            );
          },
        ),
      );

      dataUnsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'cinemaItems'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            setCinemaItems(
              snapshot.docs.map((docSnap) => {
                const raw = docSnap.data() as Omit<CinemaItem, 'id' | 'createdAt'> & {
                  createdAt?: unknown;
                };
                return {
                  id: docSnap.id,
                  title: raw.title,
                  review: raw.review,
                  rating: raw.rating,
                  image: raw.image,
                  createdAt: toDateValue(raw.createdAt),
                };
              }),
            );
          },
        ),
      );

      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      dataUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (signInError) {
      const signInCode =
        typeof signInError === 'object' &&
        signInError !== null &&
        'code' in signInError
          ? String((signInError as { code: string }).code)
          : '';

      // New account flow: if sign-in fails because user does not exist, try creating it.
      if (signInCode !== 'auth/user-not-found' && signInCode !== 'auth/invalid-credential') {
        return false;
      }

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        return true;
      } catch (createError) {
        const createCode =
          typeof createError === 'object' &&
          createError !== null &&
          'code' in createError
            ? String((createError as { code: string }).code)
            : '';

        // Handle race condition: if user already exists, retry sign-in once.
        if (createCode === 'auth/email-already-in-use') {
          try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
          } catch {
            return false;
          }
        }

        return false;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addWorkout = async (workout: WorkoutInput) => {
    const uid = requireUid();
    let imageUrl = workout.imageUrl;

    if (workout.imageFile) {
      imageUrl = await uploadUserImage(uid, 'workouts', workout.imageFile);
    }

    await addDoc(collection(db, 'users', uid, 'workouts'), {
      date: workout.date,
      exercises: workout.exercises,
      bodyWeight: workout.bodyWeight ?? null,
      notes: workout.notes,
      imageUrl: imageUrl ?? null,
    });
  };

  const updateWorkout = async (id: string, updatedWorkout: Partial<WorkoutInput>) => {
    const uid = requireUid();
    const workoutRef = doc(db, 'users', uid, 'workouts', id);
    const existing = workouts.find((item) => item.id === id);

    let nextImageUrl = updatedWorkout.imageUrl;
    if (updatedWorkout.imageFile) {
      nextImageUrl = await uploadUserImage(uid, 'workouts', updatedWorkout.imageFile);
      await deleteStorageAsset(existing?.imageUrl);
    }

    await updateDoc(workoutRef, {
      ...(updatedWorkout.date !== undefined ? { date: updatedWorkout.date } : {}),
      ...(updatedWorkout.exercises !== undefined
        ? { exercises: updatedWorkout.exercises }
        : {}),
      ...(updatedWorkout.bodyWeight !== undefined
        ? { bodyWeight: updatedWorkout.bodyWeight }
        : {}),
      ...(updatedWorkout.notes !== undefined ? { notes: updatedWorkout.notes } : {}),
      ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
    });
  };

  const deleteWorkout = async (id: string) => {
    const uid = requireUid();
    const existing = workouts.find((item) => item.id === id);
    await deleteDoc(doc(db, 'users', uid, 'workouts', id));
    await deleteStorageAsset(existing?.imageUrl);
  };

  const addWaterBottle = async (date: string) => {
    const uid = requireUid();
    const waterRef = doc(db, 'users', uid, 'waterLogs', date);

    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(waterRef);
      const existing = current.exists() ? (current.data().bottles as number) : 0;
      transaction.set(
        waterRef,
        {
          date,
          bottles: existing + 1,
        },
        { merge: true },
      );
    });
  };

  const removeWaterBottle = async (date: string) => {
    const uid = requireUid();
    const waterRef = doc(db, 'users', uid, 'waterLogs', date);

    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(waterRef);
      if (!current.exists()) {
        return;
      }

      const existing = current.data().bottles as number;
      const nextValue = Math.max(existing - 1, 0);
      transaction.set(
        waterRef,
        {
          date,
          bottles: nextValue,
        },
        { merge: true },
      );
    });
  };

  const getWaterForDate = (date: string): number => {
    const log = waterLogs.find((item) => item.date === date);
    return log?.bottles ?? 0;
  };

  const addTodo = async (text: string, date?: string) => {
    const uid = requireUid();
    await addDoc(collection(db, 'users', uid, 'todos'), {
      text,
      completed: false,
      date: date ?? null,
    });
  };

  const toggleTodo = async (id: string) => {
    const uid = requireUid();
    const existing = todos.find((item) => item.id === id);
    if (!existing) {
      return;
    }

    await updateDoc(doc(db, 'users', uid, 'todos', id), {
      completed: !existing.completed,
    });
  };

  const deleteTodo = async (id: string) => {
    const uid = requireUid();
    await deleteDoc(doc(db, 'users', uid, 'todos', id));
  };

  const getTodosForDate = (date: string): TodoItem[] => {
    return todos.filter((todo) => todo.date === date);
  };

  const getWheneverTodos = (): TodoItem[] => {
    return todos.filter((todo) => !todo.date);
  };

  const addSpending = async (entry: SpendingInput) => {
    const uid = requireUid();
    let receiptImage = entry.receiptImage;

    if (entry.imageFile) {
      receiptImage = await uploadUserImage(uid, 'spending', entry.imageFile);
    }

    await addDoc(collection(db, 'users', uid, 'spending'), {
      date: entry.date,
      amount: entry.amount,
      category: entry.category,
      description: entry.description,
      receiptImage: receiptImage ?? null,
    });
  };

  const deleteSpending = async (id: string) => {
    const uid = requireUid();
    const existing = spending.find((entry) => entry.id === id);
    await deleteDoc(doc(db, 'users', uid, 'spending', id));
    await deleteStorageAsset(existing?.receiptImage);
  };

  const getSpendingForDate = (date: string): SpendingEntry[] => {
    return spending.filter((entry) => entry.date === date);
  };

  const getTotalSpending = (startDate?: string, endDate?: string): number => {
    const filtered = spending.filter((entry) => {
      const entryDate = new Date(entry.date);
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      return (!start || entryDate >= start) && (!end || entryDate <= end);
    });

    return filtered.reduce((total, entry) => total + entry.amount, 0);
  };

  const addLibraryItem = async (item: LibraryInput) => {
    const uid = requireUid();
    let image = item.image;

    if (item.imageFile) {
      image = await uploadUserImage(uid, 'library', item.imageFile);
    }

    await addDoc(collection(db, 'users', uid, 'libraryItems'), {
      title: item.title,
      review: item.review,
      rating: item.rating,
      image: image ?? null,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteLibraryItem = async (id: string) => {
    const uid = requireUid();
    const existing = libraryItems.find((item) => item.id === id);
    await deleteDoc(doc(db, 'users', uid, 'libraryItems', id));
    await deleteStorageAsset(existing?.image);
  };

  const addCinemaItem = async (item: CinemaInput) => {
    const uid = requireUid();
    let image = item.image;

    if (item.imageFile) {
      image = await uploadUserImage(uid, 'cinema', item.imageFile);
    }

    await addDoc(collection(db, 'users', uid, 'cinemaItems'), {
      title: item.title,
      review: item.review,
      rating: item.rating,
      image: image ?? null,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteCinemaItem = async (id: string) => {
    const uid = requireUid();
    const existing = cinemaItems.find((item) => item.id === id);
    await deleteDoc(doc(db, 'users', uid, 'cinemaItems', id));
    await deleteStorageAsset(existing?.image);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthLoading,
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
    }),
    [
      isAuthenticated,
      isAuthLoading,
      workouts,
      currentUser,
      waterLogs,
      todos,
      spending,
      libraryItems,
      cinemaItems,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
