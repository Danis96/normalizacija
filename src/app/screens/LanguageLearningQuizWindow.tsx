import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';
import { AlertCircle, Check, Clock3, Expand, Gauge, RotateCcw, Trophy, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { LANGUAGE_LEARNING_STORAGE_KEY, LANGUAGE_QUIZ_LAUNCH_KEY, type QuizLaunchPayload } from './LanguageLearning';

type QuizMode = 'flashcards' | 'multiple-choice' | 'typing';
type QuizDirection = 'word-to-translation' | 'translation-to-word';
type QuizDifficulty = 'all' | 'hardest' | 'easiest';
type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'phrase' | 'other';

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
  example?: string;
  confidence: number;
}

interface QuizMistake {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  wordId: string;
}

interface AnswerLog {
  wordId: string;
  userAnswer: string;
  isCorrect: boolean;
  question: string;
  correctAnswer: string;
  elapsedMs: number;
}

interface QuizSessionState {
  settings: QuizLaunchPayload['settings'];
  languageId: string;
  languageName: string;
  questions: QuizQuestion[];
  index: number;
  revealed: boolean;
  answered: boolean;
  selectedAnswer: string;
  correct: number;
  mistakes: QuizMistake[];
  answers: AnswerLog[];
  startedAt: number;
  questionStartedAt: number;
}

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
    languages: [],
    selectedLanguageId: 'spanish',
    words: [],
    studyLogs: [],
    quizResults: [],
  };
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function LanguageLearningQuizWindow() {
  const navigate = useNavigate();
  const [data, setData] = useState<LearningData>(getDefaultData);
  const [launch, setLaunch] = useState<QuizLaunchPayload | null>(null);
  const [session, setSession] = useState<QuizSessionState | null>(null);
  const [typingAnswer, setTypingAnswer] = useState('');
  const [now, setNow] = useState(Date.now());
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const storedData = localStorage.getItem(LANGUAGE_LEARNING_STORAGE_KEY);
    const storedLaunch = localStorage.getItem(LANGUAGE_QUIZ_LAUNCH_KEY);

    if (!storedData || !storedLaunch) {
      setLoadError('Missing quiz launch data. Start the quiz from the Language Learning page.');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as LearningData;
      const parsedLaunch = JSON.parse(storedLaunch) as QuizLaunchPayload;

      if (!Array.isArray(parsedData.languages) || !Array.isArray(parsedData.words) || !Array.isArray(parsedData.studyLogs) || !Array.isArray(parsedData.quizResults)) {
        throw new Error('Invalid learning data format');
      }

      if (!parsedLaunch.languageId || !parsedLaunch.settings) {
        throw new Error('Invalid quiz launch data');
      }

      setData(parsedData);
      setLaunch(parsedLaunch);
    } catch {
      setLoadError('Could not load quiz data. Please restart the quiz.');
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!launch || session) return;

    const language = data.languages.find((item) => item.id === launch.languageId);
    const languageWords = data.words.filter((word) => word.languageId === launch.languageId);

    let pool = [...languageWords];
    if (launch.settings.notMasteredOnly) {
      pool = pool.filter((word) => !word.mastered);
    }
    if (launch.settings.difficulty === 'hardest') {
      pool = pool.filter((word) => word.confidence <= 2);
    }
    if (launch.settings.difficulty === 'easiest') {
      pool = pool.filter((word) => word.confidence >= 4);
    }
    if (pool.length === 0) {
      pool = [...languageWords];
    }

    if (pool.length === 0) {
      setLoadError('No words available for this quiz. Add vocabulary and try again.');
      return;
    }

    if (launch.settings.mode === 'multiple-choice' && languageWords.length < 4) {
      setLoadError('Multiple-choice mode requires at least 4 words.');
      return;
    }

    const total = Math.min(launch.settings.count, pool.length);
    const selected = shuffle(pool).slice(0, total);
    const questions: QuizQuestion[] = selected.map((word) => {
      const prompt =
        launch.settings.direction === 'word-to-translation' ? word.word : word.translation;
      const answer =
        launch.settings.direction === 'word-to-translation' ? word.translation : word.word;

      if (launch.settings.mode !== 'multiple-choice') {
        return {
          wordId: word.id,
          prompt,
          answer,
          example: word.example,
          confidence: word.confidence,
        };
      }

      const distractorSource = languageWords.filter((item) => item.id !== word.id);
      const distractors = shuffle(
        distractorSource.map((item) =>
          launch.settings.direction === 'word-to-translation' ? item.translation : item.word,
        ),
      )
        .filter((item, idx, arr) => item !== answer && arr.indexOf(item) === idx)
        .slice(0, 3);

      const options = shuffle([answer, ...distractors]);
      return {
        wordId: word.id,
        prompt,
        answer,
        options,
        example: word.example,
        confidence: word.confidence,
      };
    });

    const startedAt = Date.now();
    setSession({
      settings: launch.settings,
      languageId: launch.languageId,
      languageName: language?.name || 'Language',
      questions,
      index: 0,
      revealed: false,
      answered: false,
      selectedAnswer: '',
      correct: 0,
      mistakes: [],
      answers: [],
      startedAt,
      questionStartedAt: startedAt,
    });

    window.setTimeout(() => {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    }, 0);
  }, [data.languages, data.words, launch, session]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!session) return;
      const current = session.questions[session.index];
      if (!current || session.answered) return;

      if (session.settings.mode === 'multiple-choice' && current.options?.length) {
        const asNumber = Number(event.key);
        if (asNumber >= 1 && asNumber <= current.options.length) {
          const option = current.options[asNumber - 1];
          submitAnswer(option);
        }
      }

      if (event.key === 'Enter' && session.settings.mode === 'typing') {
        submitAnswer(typingAnswer);
      }

      if (event.key === ' ' && session.settings.mode === 'flashcards') {
        event.preventDefault();
        setSession((prev) => (prev ? { ...prev, revealed: true } : prev));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, typingAnswer]);

  const currentQuestion = session?.questions[session.index];

  const totalElapsedSeconds = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((now - session.startedAt) / 1000));
  }, [now, session]);

  const currentQuestionSeconds = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((now - session.questionStartedAt) / 1000));
  }, [now, session]);

  const accuracy = useMemo(() => {
    if (!session || session.index === 0) return session?.answered ? (session.correct / 1) * 100 : 0;
    const answeredCount = session.answers.length;
    if (answeredCount === 0) return 0;
    return (session.correct / answeredCount) * 100;
  }, [session]);

  const submitAnswer = (rawAnswer: string) => {
    if (!session || !currentQuestion || session.answered) return;

    const userAnswer = rawAnswer.trim();
    const isCorrect = normalizeText(userAnswer) === normalizeText(currentQuestion.answer);
    const answeredAt = Date.now();

    setSession((prev) => {
      if (!prev || prev.answered) return prev;

      const answerLog: AnswerLog = {
        wordId: currentQuestion.wordId,
        userAnswer: userAnswer || '(blank)',
        isCorrect,
        question: currentQuestion.prompt,
        correctAnswer: currentQuestion.answer,
        elapsedMs: Math.max(0, answeredAt - prev.questionStartedAt),
      };

      return {
        ...prev,
        answered: true,
        selectedAnswer: userAnswer || '(blank)',
        correct: prev.correct + (isCorrect ? 1 : 0),
        mistakes: isCorrect
          ? prev.mistakes
          : [
              ...prev.mistakes,
              {
                question: currentQuestion.prompt,
                correctAnswer: currentQuestion.answer,
                userAnswer: userAnswer || '(blank)',
                wordId: currentQuestion.wordId,
              },
            ],
        answers: [...prev.answers, answerLog],
      };
    });
  };

  const completeQuiz = () => {
    if (!session) return;

    const total = session.questions.length;
    const accuracyValue = total === 0 ? 0 : (session.correct / total) * 100;

    const updatedWords = data.words.map((word) => {
      const wordAnswers = session.answers.filter((item) => item.wordId === word.id);
      if (wordAnswers.length === 0) return word;

      let confidence = word.confidence;
      let correctCount = word.correctCount;
      let wrongCount = word.wrongCount;

      wordAnswers.forEach((answer) => {
        confidence = Math.max(1, Math.min(5, confidence + (answer.isCorrect ? 1 : -1)));
        if (answer.isCorrect) {
          correctCount += 1;
        } else {
          wrongCount += 1;
        }
      });

      return {
        ...word,
        confidence,
        correctCount,
        wrongCount,
        lastTested: format(new Date(), 'yyyy-MM-dd'),
      };
    });

    const quizResult: QuizResult = {
      id: Date.now().toString(),
      languageId: session.languageId,
      date: format(new Date(), 'yyyy-MM-dd'),
      mode: session.settings.mode,
      direction: session.settings.direction,
      total,
      correct: session.correct,
      accuracy: accuracyValue,
      score: session.correct,
    };

    const nextData: LearningData = {
      ...data,
      words: updatedWords,
      quizResults: [...data.quizResults, quizResult],
    };

    localStorage.setItem(LANGUAGE_LEARNING_STORAGE_KEY, JSON.stringify(nextData));
    setData(nextData);
    setSession((prev) => (prev ? { ...prev, index: prev.questions.length } : prev));
  };

  const goNext = () => {
    if (!session) return;
    if (!session.answered) return;

    if (session.index >= session.questions.length - 1) {
      completeQuiz();
      return;
    }

    const nextStartedAt = Date.now();
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        index: prev.index + 1,
        revealed: false,
        answered: false,
        selectedAnswer: '',
        questionStartedAt: nextStartedAt,
      };
    });
    setTypingAnswer('');
  };

  if (loadError) {
    return (
      <div className="min-h-screen retro-desktop p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full border-4 border-red-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <h1 className="text-xl font-bold">Quiz could not start</h1>
            </div>
            <p className="text-slate-700">{loadError}</p>
            <Button onClick={() => navigate('/language-learning')}>Back to Language Learning</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen retro-desktop p-8 flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardContent className="p-6">Preparing quiz...</CardContent>
        </Card>
      </div>
    );
  }

  if (session.index >= session.questions.length) {
    const total = session.questions.length;
    const accuracyValue = total === 0 ? 0 : (session.correct / total) * 100;
    const averageSeconds =
      session.answers.length === 0
        ? 0
        : Math.round(
            session.answers.reduce((sum, answer) => sum + answer.elapsedMs, 0) /
              session.answers.length /
              1000,
          );

    return (
      <div className="min-h-screen retro-desktop p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-4 border-emerald-300 bg-emerald-50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Trophy className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Quiz Complete</h1>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded bg-white border">Score: <b>{session.correct}/{total}</b></div>
                <div className="p-3 rounded bg-white border">Accuracy: <b>{accuracyValue.toFixed(0)}%</b></div>
                <div className="p-3 rounded bg-white border">Total time: <b>{totalElapsedSeconds}s</b></div>
                <div className="p-3 rounded bg-white border">Avg/question: <b>{averageSeconds}s</b></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => window.location.reload()}>
                  <RotateCcw className="w-4 h-4 mr-1" />Restart Quiz Window
                </Button>
                <Button variant="outline" onClick={() => navigate('/language-learning')}>Back to Language Learning</Button>
                <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
              </div>
            </CardContent>
          </Card>

          {session.mistakes.length > 0 ? (
            <Card className="border-4 border-amber-300">
              <CardContent className="p-6 space-y-3">
                <h2 className="text-xl font-bold text-amber-700">Mistakes Review</h2>
                <div className="space-y-2">
                  {session.mistakes.map((mistake, index) => (
                    <div key={`${mistake.wordId}-${index}`} className="p-3 rounded border bg-white">
                      <div className="font-medium">{mistake.question}</div>
                      <div className="text-sm text-red-700">Your answer: {mistake.userAnswer}</div>
                      <div className="text-sm text-emerald-700">Correct answer: {mistake.correctAnswer}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  const progress = ((session.index + 1) / session.questions.length) * 100;
  const isCorrect =
    session.answered && normalizeText(session.selectedAnswer) === normalizeText(currentQuestion.answer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff1e6] via-[#e8f7ff] to-[#f4ecff] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <Card className="border-4 border-slate-800 shadow-[0_6px_0_#111]">
          <CardContent className="p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">Quiz Arena</h1>
                <p className="text-sm text-slate-600">{session.languageName} | {session.settings.mode} | {session.settings.direction}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>
                  <Expand className="w-4 h-4 mr-1" />Fullscreen
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/language-learning')}>Exit</Button>
              </div>
            </div>

            <Progress value={progress} className="h-3" />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className="p-2 rounded bg-slate-100 border">Question <b>{session.index + 1}/{session.questions.length}</b></div>
              <div className="p-2 rounded bg-slate-100 border">Correct <b>{session.correct}</b></div>
              <div className="p-2 rounded bg-slate-100 border">Accuracy <b>{accuracy.toFixed(0)}%</b></div>
              <div className="p-2 rounded bg-slate-100 border"><Clock3 className="inline w-4 h-4 mr-1" />Quiz <b>{totalElapsedSeconds}s</b></div>
              <div className="p-2 rounded bg-slate-100 border"><Gauge className="inline w-4 h-4 mr-1" />This Q <b>{currentQuestionSeconds}s</b></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-violet-400 shadow-[0_5px_0_#7c3aed]">
          <CardContent className="p-5 md:p-7 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-violet-100 text-violet-900 border border-violet-300">Confidence {currentQuestion.confidence}/5</Badge>
              {currentQuestion.example ? (
                <Badge className="bg-cyan-100 text-cyan-900 border border-cyan-300">Has example</Badge>
              ) : null}
            </div>
            <div className="text-3xl md:text-5xl font-black text-violet-900 tracking-tight">{currentQuestion.prompt}</div>

            {session.settings.mode === 'flashcards' ? (
              <div className="space-y-3">
                {!session.revealed ? (
                  <Button onClick={() => setSession((prev) => (prev ? { ...prev, revealed: true } : prev))}>Reveal answer (Space)</Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border-2 border-violet-300 bg-white text-2xl font-bold text-violet-900">
                      {currentQuestion.answer}
                    </div>
                    {!session.answered ? (
                      <div className="flex gap-2">
                        <Button onClick={() => submitAnswer(currentQuestion.answer)}>
                          <Check className="w-4 h-4 mr-1" />I knew it
                        </Button>
                        <Button variant="outline" onClick={() => submitAnswer('(did not know)')}>
                          <X className="w-4 h-4 mr-1" />I missed it
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {session.settings.mode === 'multiple-choice' && currentQuestion.options ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => {
                  const selected = normalizeText(session.selectedAnswer) === normalizeText(option);
                  const correctOption = normalizeText(currentQuestion.answer) === normalizeText(option);
                  const variantClass = session.answered
                    ? correctOption
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : selected
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-slate-300 bg-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50';

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={session.answered}
                      onClick={() => submitAnswer(option)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${variantClass}`}
                    >
                      <div className="text-xs text-slate-500 mb-1">Option {index + 1}</div>
                      <div className="font-semibold">{option}</div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {session.settings.mode === 'typing' ? (
              <div className="space-y-3 max-w-xl">
                <Input
                  value={typingAnswer}
                  onChange={(event) => setTypingAnswer(event.target.value)}
                  placeholder="Type your answer and press Enter"
                  disabled={session.answered}
                />
                <Button disabled={session.answered} onClick={() => submitAnswer(typingAnswer)}>
                  Submit
                </Button>
              </div>
            ) : null}

            {session.answered ? (
              <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                <div className="font-semibold flex items-center gap-2">
                  {isCorrect ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                  {isCorrect ? 'Correct' : 'Not quite'}
                </div>
                {!isCorrect ? (
                  <div className="text-sm mt-1">Correct answer: <b>{currentQuestion.answer}</b></div>
                ) : null}
                {currentQuestion.example ? (
                  <div className="text-sm mt-1 text-slate-700">Example: {currentQuestion.example}</div>
                ) : null}
                <Button className="mt-3" onClick={goNext}>Next Question</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
