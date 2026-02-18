import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO, startOfDay, subDays } from 'date-fns';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  BookOpen,
  Check,
  Clock3,
  Download,
  FileUp,
  Languages,
  Pencil,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
  X,
} from 'lucide-react';

type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'phrase' | 'other';
type QuizMode = 'flashcards' | 'multiple-choice' | 'typing';
type QuizDirection = 'word-to-translation' | 'translation-to-word';
type QuizDifficulty = 'all' | 'hardest' | 'easiest';

interface Language {
  id: string;
  name: string;
}

interface VocabularyWord {
  id: string;
  languageId: string;
  word: string;
  translation: string;
  partOfSpeech?: PartOfSpeech;
  example?: string;
  tags: string[];
  dateLearned: string;
  confidence: number;
  mastered: boolean;
  correctCount: number;
  wrongCount: number;
  lastTested?: string;
}

interface StudyLog {
  id: string;
  languageId: string;
  date: string;
  minutes: number;
  notes: string;
}

interface QuizResult {
  id: string;
  languageId: string;
  date: string;
  mode: QuizMode;
  direction: QuizDirection;
  total: number;
  correct: number;
  accuracy: number;
  score: number;
}

interface LearningData {
  languages: Language[];
  selectedLanguageId: string;
  words: VocabularyWord[];
  studyLogs: StudyLog[];
  quizResults: QuizResult[];
}

interface QuizQuestion {
  wordId: string;
  prompt: string;
  answer: string;
  options?: string[];
}

interface QuizMistake {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  wordId: string;
}

interface QuizSession {
  settings: {
    mode: QuizMode;
    direction: QuizDirection;
    difficulty: QuizDifficulty;
    count: number;
    notMasteredOnly: boolean;
  };
  questions: QuizQuestion[];
  index: number;
  correct: number;
  mistakes: QuizMistake[];
  revealed: boolean;
}

const STORAGE_KEY = 'languageLearningDataV1';

const DEFAULT_LANGUAGES: Language[] = [
  { id: 'spanish', name: 'Spanish' },
  { id: 'french', name: 'French' },
  { id: 'german', name: 'German' },
];

const POS_OPTIONS: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'phrase', 'other'];

const SEED_SPANISH: Omit<VocabularyWord, 'id' | 'languageId'>[] = [
  {
    word: 'hola',
    translation: 'hello',
    partOfSpeech: 'phrase',
    example: 'Hola, como estas?',
    tags: ['greeting'],
    dateLearned: format(new Date(), 'yyyy-MM-dd'),
    confidence: 2,
    mastered: false,
    correctCount: 0,
    wrongCount: 0,
  },
  {
    word: 'comida',
    translation: 'food',
    partOfSpeech: 'noun',
    example: 'La comida esta deliciosa.',
    tags: ['food'],
    dateLearned: format(new Date(), 'yyyy-MM-dd'),
    confidence: 3,
    mastered: false,
    correctCount: 0,
    wrongCount: 0,
  },
  {
    word: 'viajar',
    translation: 'to travel',
    partOfSpeech: 'verb',
    example: 'Me gusta viajar en verano.',
    tags: ['travel'],
    dateLearned: format(new Date(), 'yyyy-MM-dd'),
    confidence: 2,
    mastered: false,
    correctCount: 0,
    wrongCount: 0,
  },
  {
    word: 'escuela',
    translation: 'school',
    partOfSpeech: 'noun',
    example: 'La escuela empieza a las ocho.',
    tags: ['school'],
    dateLearned: format(new Date(), 'yyyy-MM-dd'),
    confidence: 1,
    mastered: false,
    correctCount: 0,
    wrongCount: 0,
  },
];

function shuffle<T>(list: T[]) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDefaultData(): LearningData {
  return {
    languages: DEFAULT_LANGUAGES,
    selectedLanguageId: 'spanish',
    words: [],
    studyLogs: [],
    quizResults: [],
  };
}

export function LanguageLearning() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<LearningData>(getDefaultData);
  const [studyStartedAt, setStudyStartedAt] = useState<number | null>(null);

  const [wordForm, setWordForm] = useState({
    id: '',
    word: '',
    translation: '',
    partOfSpeech: '',
    example: '',
    tags: '',
    dateLearned: format(new Date(), 'yyyy-MM-dd'),
    confidence: 3,
  });

  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [manualMinutes, setManualMinutes] = useState('');
  const [todayNotes, setTodayNotes] = useState('');

  const [quizSettings, setQuizSettings] = useState({
    mode: 'flashcards' as QuizMode,
    direction: 'word-to-translation' as QuizDirection,
    difficulty: 'all' as QuizDifficulty,
    count: 5,
    notMasteredOnly: false,
  });
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [lastQuizSummary, setLastQuizSummary] = useState<{
    correct: number;
    total: number;
    accuracy: number;
    mistakes: QuizMistake[];
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as LearningData;
      if (!Array.isArray(parsed.languages) || !Array.isArray(parsed.words) || !Array.isArray(parsed.studyLogs) || !Array.isArray(parsed.quizResults)) {
        return;
      }

      setData({
        languages: parsed.languages.length > 0 ? parsed.languages : DEFAULT_LANGUAGES,
        selectedLanguageId: parsed.selectedLanguageId || parsed.languages?.[0]?.id || 'spanish',
        words: parsed.words,
        studyLogs: parsed.studyLogs,
        quizResults: parsed.quizResults,
      });
    } catch {
      toast.error('Could not load language learning data');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const selectedLanguage = useMemo(
    () => data.languages.find((lang) => lang.id === data.selectedLanguageId),
    [data.languages, data.selectedLanguageId],
  );

  const wordsForLanguage = useMemo(
    () => data.words.filter((word) => word.languageId === data.selectedLanguageId),
    [data.words, data.selectedLanguageId],
  );

  const tagsForLanguage = useMemo(() => {
    const set = new Set<string>();
    wordsForLanguage.forEach((word) => word.tags.forEach((tag) => set.add(tag)));
    return [...set].sort();
  }, [wordsForLanguage]);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const log = data.studyLogs.find((item) => item.languageId === data.selectedLanguageId && item.date === today);
    setTodayNotes(log?.notes || '');
  }, [data.selectedLanguageId, data.studyLogs, today]);

  const filteredWords = useMemo(() => {
    const searched = wordsForLanguage.filter((word) => {
      const text = `${word.word} ${word.translation} ${word.tags.join(' ')}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (confidenceFilter !== 'all' && word.confidence !== Number(confidenceFilter)) return false;
      if (tagFilter !== 'all' && !word.tags.includes(tagFilter)) return false;
      if (dateFrom && word.dateLearned < dateFrom) return false;
      if (dateTo && word.dateLearned > dateTo) return false;
      return true;
    });

    const sorted = [...searched];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => a.dateLearned.localeCompare(b.dateLearned));
        break;
      case 'az':
        sorted.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'confidence':
        sorted.sort((a, b) => b.confidence - a.confidence);
        break;
      default:
        sorted.sort((a, b) => b.dateLearned.localeCompare(a.dateLearned));
    }
    return sorted;
  }, [wordsForLanguage, search, confidenceFilter, tagFilter, dateFrom, dateTo, sortBy]);

  const languageStudyLogs = useMemo(
    () => data.studyLogs.filter((log) => log.languageId === data.selectedLanguageId),
    [data.studyLogs, data.selectedLanguageId],
  );

  const languageQuizResults = useMemo(
    () => data.quizResults.filter((quiz) => quiz.languageId === data.selectedLanguageId),
    [data.quizResults, data.selectedLanguageId],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = subDays(startOfDay(now), 6);

    const wordsLearnedThisWeek = wordsForLanguage.filter((word) => {
      const date = parseISO(word.dateLearned);
      return date >= weekStart && date <= now;
    }).length;

    const masteredCount = wordsForLanguage.filter((word) => word.mastered).length;
    const avgConfidence =
      wordsForLanguage.length === 0
        ? 0
        : wordsForLanguage.reduce((sum, word) => sum + word.confidence, 0) / wordsForLanguage.length;

    const attempts = languageQuizResults.length;
    const totalCorrect = languageQuizResults.reduce((sum, item) => sum + item.correct, 0);
    const totalQuestions = languageQuizResults.reduce((sum, item) => sum + item.total, 0);
    const accuracy = totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100;
    const bestScore = languageQuizResults.length === 0 ? 0 : Math.max(...languageQuizResults.map((item) => item.accuracy));

    const totalStudyMinutes = languageStudyLogs.reduce((sum, log) => sum + log.minutes, 0);
    const thisWeekStudyMinutes = languageStudyLogs
      .filter((log) => {
        const date = parseISO(log.date);
        return date >= weekStart && date <= now;
      })
      .reduce((sum, log) => sum + log.minutes, 0);

    const activityDays = new Set<string>();
    wordsForLanguage.forEach((word) => activityDays.add(word.dateLearned));
    languageQuizResults.forEach((quiz) => activityDays.add(quiz.date));

    let streak = 0;
    let cursor = startOfDay(now);
    while (activityDays.has(format(cursor, 'yyyy-MM-dd'))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    return {
      totalWords: wordsForLanguage.length,
      wordsLearnedThisWeek,
      masteredCount,
      avgConfidence,
      attempts,
      accuracy,
      bestScore,
      totalStudyMinutes,
      thisWeekStudyMinutes,
      streak,
    };
  }, [wordsForLanguage, languageQuizResults, languageStudyLogs]);

  const wordsAddedByDay = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
    return days.map((day) => ({
      day,
      count: wordsForLanguage.filter((word) => word.dateLearned === day).length,
    }));
  }, [wordsForLanguage]);

  const quizAccuracyTrend = useMemo(() => {
    const latestFive = [...languageQuizResults].slice(-5);
    return latestFive.map((quiz, index) => ({
      label: `Q${index + 1}`,
      value: Math.round(quiz.accuracy),
    }));
  }, [languageQuizResults]);

  const updateWord = (wordId: string, patch: Partial<VocabularyWord>) => {
    setData((prev) => ({
      ...prev,
      words: prev.words.map((word) => (word.id === wordId ? { ...word, ...patch } : word)),
    }));
  };

  const addOrUpdateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordForm.word.trim() || !wordForm.translation.trim()) {
      toast.error('Word and translation are required');
      return;
    }

    const payload = {
      word: wordForm.word.trim(),
      translation: wordForm.translation.trim(),
      partOfSpeech: (wordForm.partOfSpeech as PartOfSpeech) || undefined,
      example: wordForm.example.trim() || undefined,
      tags: wordForm.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      dateLearned: wordForm.dateLearned,
      confidence: wordForm.confidence,
    };

    if (wordForm.id) {
      updateWord(wordForm.id, payload);
      toast.success('Word updated');
    } else {
      const newWord: VocabularyWord = {
        ...payload,
        id: Date.now().toString(),
        languageId: data.selectedLanguageId,
        mastered: false,
        correctCount: 0,
        wrongCount: 0,
      };
      setData((prev) => ({ ...prev, words: [newWord, ...prev.words] }));
      toast.success('Word added');
    }

    setWordForm({
      id: '',
      word: '',
      translation: '',
      partOfSpeech: '',
      example: '',
      tags: '',
      dateLearned: format(new Date(), 'yyyy-MM-dd'),
      confidence: 3,
    });
  };

  const editWord = (word: VocabularyWord) => {
    setWordForm({
      id: word.id,
      word: word.word,
      translation: word.translation,
      partOfSpeech: word.partOfSpeech || '',
      example: word.example || '',
      tags: word.tags.join(', '),
      dateLearned: word.dateLearned,
      confidence: word.confidence,
    });
  };

  const deleteWord = (wordId: string) => {
    setData((prev) => ({
      ...prev,
      words: prev.words.filter((word) => word.id !== wordId),
    }));
    toast.success('Word deleted');
  };

  const toggleMastered = (word: VocabularyWord) => {
    updateWord(word.id, { mastered: !word.mastered });
  };

  const adjustConfidence = (word: VocabularyWord, delta: number) => {
    const next = Math.max(1, Math.min(5, word.confidence + delta));
    updateWord(word.id, { confidence: next });
  };

  const addLanguage = () => {
    const name = window.prompt('Language name');
    if (!name?.trim()) return;

    const normalized = name.trim();
    const exists = data.languages.some((lang) => lang.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      toast.error('Language already exists');
      return;
    }

    const id = normalized.toLowerCase().replace(/\s+/g, '-');
    const language: Language = { id: `${id}-${Date.now()}`, name: normalized };
    setData((prev) => ({
      ...prev,
      languages: [...prev.languages, language],
      selectedLanguageId: language.id,
    }));
  };

  const saveTodayNotes = () => {
    setData((prev) => {
      const existing = prev.studyLogs.find(
        (log) => log.languageId === prev.selectedLanguageId && log.date === today,
      );

      if (existing) {
        return {
          ...prev,
          studyLogs: prev.studyLogs.map((log) =>
            log.id === existing.id ? { ...log, notes: todayNotes } : log,
          ),
        };
      }

      return {
        ...prev,
        studyLogs: [
          {
            id: Date.now().toString(),
            languageId: prev.selectedLanguageId,
            date: today,
            minutes: 0,
            notes: todayNotes,
          },
          ...prev.studyLogs,
        ],
      };
    });
    toast.success('Daily note saved');
  };

  const addStudyMinutes = (minutes: number) => {
    if (minutes <= 0) return;

    setData((prev) => {
      const existing = prev.studyLogs.find(
        (log) => log.languageId === prev.selectedLanguageId && log.date === today,
      );

      if (existing) {
        return {
          ...prev,
          studyLogs: prev.studyLogs.map((log) =>
            log.id === existing.id ? { ...log, minutes: log.minutes + minutes } : log,
          ),
        };
      }

      return {
        ...prev,
        studyLogs: [
          {
            id: Date.now().toString(),
            languageId: prev.selectedLanguageId,
            date: today,
            minutes,
            notes: '',
          },
          ...prev.studyLogs,
        ],
      };
    });
  };

  const handleManualMinutes = () => {
    const minutes = Number(manualMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error('Enter valid minutes');
      return;
    }

    addStudyMinutes(Math.round(minutes));
    setManualMinutes('');
    toast.success('Study minutes added');
  };

  const startStopStudy = () => {
    if (!studyStartedAt) {
      setStudyStartedAt(Date.now());
      toast.success('Study timer started');
      return;
    }

    const minutes = Math.max(1, Math.round((Date.now() - studyStartedAt) / 60000));
    addStudyMinutes(minutes);
    setStudyStartedAt(null);
    toast.success(`Added ${minutes} minutes`);
  };

  const buildQuizPool = () => {
    let pool = [...wordsForLanguage];

    if (quizSettings.notMasteredOnly) {
      pool = pool.filter((word) => !word.mastered);
    }

    if (quizSettings.difficulty === 'hardest') {
      pool = pool.filter((word) => word.confidence <= 2);
    }

    if (quizSettings.difficulty === 'easiest') {
      pool = pool.filter((word) => word.confidence >= 4);
    }

    if (pool.length === 0) {
      pool = [...wordsForLanguage];
    }

    return pool;
  };

  const buildQuestions = (pool: VocabularyWord[]): QuizQuestion[] => {
    const total = Math.min(quizSettings.count, pool.length);
    const selected = shuffle(pool).slice(0, total);

    return selected.map((word) => {
      const prompt =
        quizSettings.direction === 'word-to-translation' ? word.word : word.translation;
      const answer =
        quizSettings.direction === 'word-to-translation' ? word.translation : word.word;

      if (quizSettings.mode !== 'multiple-choice') {
        return { wordId: word.id, prompt, answer };
      }

      const distractorSource = wordsForLanguage.filter((item) => item.id !== word.id);
      const distractors = shuffle(
        distractorSource.map((item) =>
          quizSettings.direction === 'word-to-translation' ? item.translation : item.word,
        ),
      )
        .filter((item, idx, arr) => item !== answer && arr.indexOf(item) === idx)
        .slice(0, 3);

      if (distractors.length < 3) {
        const fallback = shuffle(
          data.words
            .filter((item) => item.id !== word.id)
            .map((item) =>
              quizSettings.direction === 'word-to-translation' ? item.translation : item.word,
            ),
        ).filter((item, idx, arr) => item !== answer && arr.indexOf(item) === idx);

        for (const option of fallback) {
          if (distractors.length >= 3) break;
          if (!distractors.includes(option)) {
            distractors.push(option);
          }
        }
      }

      const options = shuffle([answer, ...distractors.slice(0, 3)]);
      return {
        wordId: word.id,
        prompt,
        answer,
        options,
      };
    });
  };

  const startQuiz = () => {
    if (wordsForLanguage.length === 0) {
      toast.error('Add vocabulary first');
      return;
    }

    const pool = buildQuizPool();
    if (pool.length === 0) {
      toast.error('No matching words for selected quiz filters');
      return;
    }

    if (quizSettings.mode === 'multiple-choice' && wordsForLanguage.length < 4) {
      toast.error('Add at least 4 words for multiple-choice mode');
      return;
    }

    const questions = buildQuestions(pool);
    if (questions.length === 0) {
      toast.error('Not enough words for this quiz');
      return;
    }

    setLastQuizSummary(null);
    setTypingAnswer('');
    setQuizSession({
      settings: { ...quizSettings },
      questions,
      index: 0,
      correct: 0,
      mistakes: [],
      revealed: false,
    });
  };

  const finishQuiz = (session: QuizSession) => {
    const total = session.questions.length;
    const accuracy = total === 0 ? 0 : (session.correct / total) * 100;

    const result: QuizResult = {
      id: Date.now().toString(),
      languageId: data.selectedLanguageId,
      date: format(new Date(), 'yyyy-MM-dd'),
      mode: session.settings.mode,
      direction: session.settings.direction,
      total,
      correct: session.correct,
      accuracy,
      score: session.correct,
    };

    setData((prev) => ({ ...prev, quizResults: [...prev.quizResults, result] }));
    setLastQuizSummary({
      correct: session.correct,
      total,
      accuracy,
      mistakes: session.mistakes,
    });
    setQuizSession(null);
    setTypingAnswer('');
  };

  const registerWordResult = (wordId: string, isCorrect: boolean) => {
    setData((prev) => ({
      ...prev,
      words: prev.words.map((word) => {
        if (word.id !== wordId) return word;
        const nextConfidence = Math.max(1, Math.min(5, word.confidence + (isCorrect ? 1 : -1)));
        return {
          ...word,
          confidence: nextConfidence,
          correctCount: word.correctCount + (isCorrect ? 1 : 0),
          wrongCount: word.wrongCount + (isCorrect ? 0 : 1),
          lastTested: format(new Date(), 'yyyy-MM-dd'),
        };
      }),
    }));
  };

  const submitQuizAnswer = (answer: string, isCorrect: boolean) => {
    if (!quizSession) return;

    const current = quizSession.questions[quizSession.index];
    registerWordResult(current.wordId, isCorrect);

    const next: QuizSession = {
      ...quizSession,
      correct: quizSession.correct + (isCorrect ? 1 : 0),
      mistakes: isCorrect
        ? quizSession.mistakes
        : [
            ...quizSession.mistakes,
            {
              question: current.prompt,
              correctAnswer: current.answer,
              userAnswer: answer,
              wordId: current.wordId,
            },
          ],
      index: quizSession.index + 1,
      revealed: false,
    };

    if (next.index >= next.questions.length) {
      finishQuiz(next);
      return;
    }

    setQuizSession(next);
    setTypingAnswer('');
  };

  const retryMistakes = () => {
    if (!lastQuizSummary || lastQuizSummary.mistakes.length === 0) return;
    const mistakeIds = new Set(lastQuizSummary.mistakes.map((item) => item.wordId));
    const pool = wordsForLanguage.filter((word) => mistakeIds.has(word.id));
    const questions = buildQuestions(pool);

    setQuizSession({
      settings: { ...quizSettings, count: questions.length },
      questions,
      index: 0,
      correct: 0,
      mistakes: [],
      revealed: false,
    });
    setLastQuizSummary(null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `language-learning-backup-${format(new Date(), 'yyyyMMdd')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(href);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as LearningData;
        if (!Array.isArray(parsed.languages) || !Array.isArray(parsed.words) || !Array.isArray(parsed.studyLogs) || !Array.isArray(parsed.quizResults)) {
          throw new Error('Invalid backup');
        }

        setData({
          languages: parsed.languages,
          selectedLanguageId: parsed.selectedLanguageId || parsed.languages[0]?.id || 'spanish',
          words: parsed.words,
          studyLogs: parsed.studyLogs,
          quizResults: parsed.quizResults,
        });
        toast.success('Backup imported');
      } catch {
        toast.error('Import failed: invalid JSON backup');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const seedSpanish = () => {
    const spanish = data.languages.find((lang) => lang.name.toLowerCase() === 'spanish');
    if (!spanish) {
      toast.error('Spanish language is missing');
      return;
    }

    const existingWords = new Set(
      data.words
        .filter((word) => word.languageId === spanish.id)
        .map((word) => `${word.word.toLowerCase()}::${word.translation.toLowerCase()}`),
    );

    const additions = SEED_SPANISH.filter(
      (item) => !existingWords.has(`${item.word.toLowerCase()}::${item.translation.toLowerCase()}`),
    ).map((item) => ({
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      languageId: spanish.id,
    }));

    if (additions.length === 0) {
      toast.success('Spanish sample data already exists');
      return;
    }

    setData((prev) => ({ ...prev, words: [...additions, ...prev.words], selectedLanguageId: spanish.id }));
    toast.success('Spanish sample words added');
  };

  const currentQuestion = quizSession?.questions[quizSession.index];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-4xl font-bold text-indigo-700">Language Learning</h1>
            <p className="text-indigo-600 mt-1">Vocabulary, progress tracking, and practice quizzes.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-4 border-indigo-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56">
                <Label htmlFor="language-selector">Current language</Label>
                <Select
                  value={data.selectedLanguageId}
                  onValueChange={(value) => setData((prev) => ({ ...prev, selectedLanguageId: value }))}
                >
                  <SelectTrigger id="language-selector">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addLanguage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-1" />
                Add Language
              </Button>
              <Button variant="outline" onClick={seedSpanish}>
                <Languages className="w-4 h-4 mr-1" />
                Seed Spanish Data
              </Button>
              <Button variant="outline" onClick={exportJson}>
                <Download className="w-4 h-4 mr-1" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                <FileUp className="w-4 h-4 mr-1" />
                Import JSON
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImportFile}
              />
              <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300">
                {selectedLanguage?.name || 'No language selected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-4 border-pink-300">
              <CardContent className="p-4 md:p-6 space-y-4">
                <h2 className="text-2xl font-bold text-pink-700">Vocabulary Manager</h2>
                <form onSubmit={addOrUpdateWord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="word">Word *</Label>
                    <Input
                      id="word"
                      value={wordForm.word}
                      onChange={(e) => setWordForm((prev) => ({ ...prev, word: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="translation">Translation *</Label>
                    <Input
                      id="translation"
                      value={wordForm.translation}
                      onChange={(e) => setWordForm((prev) => ({ ...prev, translation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pos">Part of speech</Label>
                    <Select
                      value={wordForm.partOfSpeech || 'none'}
                      onValueChange={(value) => setWordForm((prev) => ({ ...prev, partOfSpeech: value === 'none' ? '' : value }))}
                    >
                      <SelectTrigger id="pos">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {POS_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={wordForm.tags}
                      onChange={(e) => setWordForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="travel, school, food"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-learned">Date learned</Label>
                    <Input
                      id="date-learned"
                      type="date"
                      value={wordForm.dateLearned}
                      onChange={(e) => setWordForm((prev) => ({ ...prev, dateLearned: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence: {wordForm.confidence}</Label>
                    <Input
                      id="confidence"
                      type="range"
                      min={1}
                      max={5}
                      value={wordForm.confidence}
                      onChange={(e) =>
                        setWordForm((prev) => ({ ...prev, confidence: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="example">Example sentence</Label>
                    <Textarea
                      id="example"
                      value={wordForm.example}
                      onChange={(e) => setWordForm((prev) => ({ ...prev, example: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                      {wordForm.id ? 'Update Word' : 'Add Word'}
                    </Button>
                    {wordForm.id && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setWordForm({
                            id: '',
                            word: '',
                            translation: '',
                            partOfSpeech: '',
                            example: '',
                            tags: '',
                            dateLearned: format(new Date(), 'yyyy-MM-dd'),
                            confidence: 3,
                          })
                        }
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Input
                    placeholder="Search word/translation/tag"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="lg:col-span-2"
                  />
                  <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Confidence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All confidence</SelectItem>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          Confidence {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {tagsForLanguage.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="az">A-Z</SelectItem>
                      <SelectItem value="confidence">Confidence (high-low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredWords.length === 0 ? (
                    <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center text-pink-500">
                      No words yet. Add your first word to start learning.
                    </div>
                  ) : (
                    filteredWords.map((word) => (
                      <div key={word.id} className="p-3 rounded-lg border-2 border-pink-200 bg-white">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-pink-700">{word.word}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-slate-700">{word.translation}</span>
                              {word.partOfSpeech && <Badge variant="outline">{word.partOfSpeech}</Badge>}
                              {word.mastered && <Badge className="bg-green-100 text-green-700">Mastered</Badge>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {word.dateLearned} • Confidence {word.confidence} • ✅ {word.correctCount} / ❌ {word.wrongCount}
                            </div>
                            {word.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {word.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {word.example && <p className="text-sm text-slate-600 mt-2">{word.example}</p>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant="outline" onClick={() => editWord(word)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleMastered(word)}>
                              {word.mastered ? 'Unmaster' : 'Master'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => adjustConfidence(word, 1)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => adjustConfidence(word, -1)}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => deleteWord(word.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-4 border-indigo-300">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-xl font-bold text-indigo-700">Progress Dashboard</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-indigo-50">Total words: <b>{stats.totalWords}</b></div>
                  <div className="p-2 rounded bg-indigo-50">This week: <b>{stats.wordsLearnedThisWeek}</b></div>
                  <div className="p-2 rounded bg-indigo-50">Mastered: <b>{stats.masteredCount}</b></div>
                  <div className="p-2 rounded bg-indigo-50">Avg confidence: <b>{stats.avgConfidence.toFixed(1)}</b></div>
                  <div className="p-2 rounded bg-indigo-50">Quiz attempts: <b>{stats.attempts}</b></div>
                  <div className="p-2 rounded bg-indigo-50">Accuracy: <b>{stats.accuracy.toFixed(0)}%</b></div>
                  <div className="p-2 rounded bg-indigo-50">Best score: <b>{stats.bestScore.toFixed(0)}%</b></div>
                  <div className="p-2 rounded bg-indigo-50">Streak: <b>{stats.streak} day(s)</b></div>
                  <div className="p-2 rounded bg-indigo-50">Study total: <b>{stats.totalStudyMinutes}m</b></div>
                  <div className="p-2 rounded bg-indigo-50">Study week: <b>{stats.thisWeekStudyMinutes}m</b></div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">Words added (last 7 days)</p>
                  <div className="flex items-end gap-2 h-24">
                    {wordsAddedByDay.map((item) => {
                      const max = Math.max(1, ...wordsAddedByDay.map((d) => d.count));
                      const height = (item.count / max) * 100;
                      return (
                        <div key={item.day} className="flex-1 text-center">
                          <div className="bg-indigo-400 rounded-t" style={{ height: `${Math.max(8, height)}%` }} />
                          <div className="text-[10px] text-slate-500 mt-1">{item.day.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">Quiz accuracy trend (last 5 quizzes)</p>
                  <div className="flex items-end gap-2 h-24">
                    {quizAccuracyTrend.length === 0 ? (
                      <p className="text-sm text-slate-500">No quizzes yet.</p>
                    ) : (
                      quizAccuracyTrend.map((item) => (
                        <div key={item.label} className="flex-1 text-center">
                          <div className="bg-pink-400 rounded-t" style={{ height: `${Math.max(8, item.value)}%` }} />
                          <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-emerald-300">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xl font-bold text-emerald-700">How Much I Learned</h3>
                <div className="flex gap-2">
                  <Button onClick={startStopStudy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Timer className="w-4 h-4 mr-1" />
                    {studyStartedAt ? 'Stop Study' : 'Start Study'}
                  </Button>
                  <div className="text-xs text-slate-500 self-center">
                    {studyStartedAt ? 'Timer running...' : 'Timer stopped'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Add minutes"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleManualMinutes}>
                    <Clock3 className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div>
                  <Label htmlFor="daily-note">What I learned today</Label>
                  <Textarea
                    id="daily-note"
                    value={todayNotes}
                    onChange={(e) => setTodayNotes(e.target.value)}
                    placeholder="Quick study note"
                  />
                  <Button className="mt-2" variant="outline" onClick={saveTodayNotes}>
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-violet-300">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-xl font-bold text-violet-700">Quiz / Practice</h3>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Mode</Label>
                  <Select
                    value={quizSettings.mode}
                    onValueChange={(value) =>
                      setQuizSettings((prev) => ({ ...prev, mode: value as QuizMode }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flashcards">Flashcards</SelectItem>
                      <SelectItem value="multiple-choice">Multiple choice</SelectItem>
                      <SelectItem value="typing">Typing</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Direction</Label>
                  <Select
                    value={quizSettings.direction}
                    onValueChange={(value) =>
                      setQuizSettings((prev) => ({ ...prev, direction: value as QuizDirection }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="word-to-translation">Word → Translation</SelectItem>
                      <SelectItem value="translation-to-word">Translation → Word</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Difficulty</Label>
                  <Select
                    value={quizSettings.difficulty}
                    onValueChange={(value) =>
                      setQuizSettings((prev) => ({ ...prev, difficulty: value as QuizDifficulty }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="hardest">Hardest (confidence 1-2)</SelectItem>
                      <SelectItem value="easiest">Easiest (confidence 4-5)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Questions</Label>
                  <Select
                    value={String(quizSettings.count)}
                    onValueChange={(value) =>
                      setQuizSettings((prev) => ({ ...prev, count: Number(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="not-mastered"
                      checked={quizSettings.notMasteredOnly}
                      onCheckedChange={(value) =>
                        setQuizSettings((prev) => ({ ...prev, notMasteredOnly: value === true }))
                      }
                    />
                    <Label htmlFor="not-mastered">Only not mastered</Label>
                  </div>
                </div>

                {!quizSession ? (
                  <Button onClick={startQuiz} className="bg-violet-600 hover:bg-violet-700 text-white w-full">
                    Start Quiz
                  </Button>
                ) : (
                  <div className="space-y-3 rounded border border-violet-200 p-3 bg-violet-50">
                    <div className="text-sm text-violet-700">
                      Question {quizSession.index + 1} / {quizSession.questions.length}
                    </div>
                    <div className="font-semibold text-violet-900">{currentQuestion?.prompt}</div>

                    {quizSession.settings.mode === 'flashcards' && currentQuestion && (
                      <div className="space-y-2">
                        {!quizSession.revealed ? (
                          <Button
                            variant="outline"
                            onClick={() => setQuizSession((prev) => (prev ? { ...prev, revealed: true } : prev))}
                          >
                            Reveal translation
                          </Button>
                        ) : (
                          <>
                            <div className="p-2 rounded bg-white border text-violet-800">
                              {currentQuestion.answer}
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => submitQuizAnswer('I knew it', true)}>
                                <Check className="w-4 h-4 mr-1" />I knew it
                              </Button>
                              <Button variant="outline" onClick={() => submitQuizAnswer("I didn't", false)}>
                                <X className="w-4 h-4 mr-1" />I didn't
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {quizSession.settings.mode === 'multiple-choice' && currentQuestion?.options && (
                      <div className="grid grid-cols-1 gap-2">
                        {currentQuestion.options.map((option) => (
                          <Button
                            key={option}
                            variant="outline"
                            className="justify-start"
                            onClick={() => submitQuizAnswer(option, option === currentQuestion.answer)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {quizSession.settings.mode === 'typing' && currentQuestion && (
                      <div className="space-y-2">
                        <Input
                          value={typingAnswer}
                          onChange={(e) => setTypingAnswer(e.target.value)}
                          placeholder="Type your answer"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const normalized = typingAnswer.trim().toLowerCase();
                              const expected = currentQuestion.answer.trim().toLowerCase();
                              submitQuizAnswer(typingAnswer || '(blank)', normalized === expected);
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const normalized = typingAnswer.trim().toLowerCase();
                            const expected = currentQuestion.answer.trim().toLowerCase();
                            submitQuizAnswer(typingAnswer || '(blank)', normalized === expected);
                          }}
                        >
                          Submit
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {lastQuizSummary && (
                  <div className="rounded border border-violet-200 p-3 bg-white space-y-2">
                    <div className="font-semibold text-violet-800">
                      Score: {lastQuizSummary.correct}/{lastQuizSummary.total} ({lastQuizSummary.accuracy.toFixed(0)}%)
                    </div>
                    {lastQuizSummary.mistakes.length > 0 ? (
                      <>
                        <div className="text-sm text-slate-600">Mistakes:</div>
                        <ul className="text-sm space-y-1 list-disc pl-5">
                          {lastQuizSummary.mistakes.map((item, idx) => (
                            <li key={`${item.wordId}-${idx}`}>
                              {item.question} • your answer: {item.userAnswer} • correct: {item.correctAnswer}
                            </li>
                          ))}
                        </ul>
                        <Button variant="outline" onClick={retryMistakes}>
                          <RotateCcw className="w-4 h-4 mr-1" />Retry mistakes
                        </Button>
                      </>
                    ) : (
                      <div className="text-sm text-green-700">Perfect run.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
