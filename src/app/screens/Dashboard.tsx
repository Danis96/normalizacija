import { useState, useMemo, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { ViewWorkoutModal } from '../components/ViewWorkoutModal';
import { WaterTracker } from '../components/WaterTracker';
import { DraggableDashboardItem } from '../components/DraggableDashboardItem';
import { WorkoutLog } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, Heart, TrendingUp, Scale, RotateCcw, ImagePlus, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isFuture, isToday } from 'date-fns';
import { toast } from 'sonner';
import React from 'react';
const HEADER_IMAGE_URL =
  'https://placehold.co/1200x192/e8dfca/2a2334?text=Normalizacija+Desktop';
const DASHBOARD_BANNER_STORAGE_KEY = 'dashboardBannerImageV1';

const DEFAULT_SECTION_ORDER = [
  'priority-task',
  'upcoming-workout',
  'stats',
  'water-tracker',
  'calendar',
];

function loadSectionOrder(): string[] {
  try {
    const stored = localStorage.getItem('dashboardSectionOrder');
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // Merge in any new sections that might have been added
      const merged = [...parsed];
      DEFAULT_SECTION_ORDER.forEach(id => {
        if (!merged.includes(id)) merged.push(id);
      });
      // Remove any that no longer exist
      return merged.filter(id => DEFAULT_SECTION_ORDER.includes(id));
    }
  } catch {}
  return DEFAULT_SECTION_ORDER;
}

export function Dashboard() {
  const { workouts, getPriorityTaskForDate } = useApp();
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewWorkout, setViewWorkout] = useState<WorkoutLog | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editWorkout, setEditWorkout] = useState<WorkoutLog | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(loadSectionOrder);
  const [bannerImageUrl, setBannerImageUrl] = useState(() => {
    const stored = localStorage.getItem(DASHBOARD_BANNER_STORAGE_KEY);
    return stored || HEADER_IMAGE_URL;
  });

  const moveSection = useCallback((dragIndex: number, hoverIndex: number) => {
    setSectionOrder(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      localStorage.setItem('dashboardSectionOrder', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, typeof workouts>();
    workouts.forEach(workout => {
      const dateKey = workout.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(workout);
    });
    return map;
  }, [workouts]);

  const upcomingWorkout = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return workouts.find(w => w.date === today) || workouts
      .filter(w => isFuture(parseISO(w.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [workouts]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const priorityTask = getPriorityTaskForDate(today);

  const latestWeight = useMemo(() => {
    const withWeight = workouts.filter(w => w.bodyWeight);
    if (withWeight.length === 0) return null;
    return withWeight.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].bodyWeight;
  }, [workouts]);

  const totalWorkouts = workouts.length;
  const totalMovements = workouts.reduce((count, workout) => {
    if (workout.workoutType === 'yoga') {
      return count + (workout.yogaPoses?.length ?? 0);
    }
    return count + workout.exercises.length;
  }, 0);

  const handleDayClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayWorkouts = workoutsByDate.get(dateString) || [];
    
    // If there's a workout on this day, show it
    if (dayWorkouts.length > 0) {
      setViewWorkout(dayWorkouts[0]);
      setIsViewModalOpen(true);
    } else {
      // Otherwise, open the add workout modal
      setEditWorkout(null);
      setSelectedDate(dateString);
      setIsModalOpen(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleAddWorkout = () => {
    setEditWorkout(null);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const handleViewWorkout = (workout: WorkoutLog) => {
    setViewWorkout(workout);
    setIsViewModalOpen(true);
  };

  const handleEditWorkout = (workout: WorkoutLog) => {
    setEditWorkout(workout);
    setSelectedDate(workout.date);
    setIsModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsModalOpen(false);
    setEditWorkout(null);
  };

  const handleResetOrder = () => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
    localStorage.setItem('dashboardSectionOrder', JSON.stringify(DEFAULT_SECTION_ORDER));
  };

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Banner image must be 2MB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextUrl = String(reader.result || '');
      if (!nextUrl) return;
      setBannerImageUrl(nextUrl);
      localStorage.setItem(DASHBOARD_BANNER_STORAGE_KEY, nextUrl);
      toast.success('Dashboard banner updated');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetBannerImage = () => {
    setBannerImageUrl(HEADER_IMAGE_URL);
    localStorage.removeItem(DASHBOARD_BANNER_STORAGE_KEY);
    toast.success('Banner reset to default');
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'priority-task':
        if (!priorityTask) return null;
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 text-xs bg-[#f3a3cd] rounded border border-[#2a2334] text-[#2a2334]">
                  Priority
                </span>
                <h2 className="text-xl font-semibold text-[#2a2334]">Today&apos;s Priority Task</h2>
              </div>
              <p className="text-lg text-[#2a2334]">{priorityTask.text}</p>
              <p className="text-sm text-[#5a4b62] mt-1">Due: {format(parseISO(today), 'MMMM d, yyyy')}</p>
            </CardContent>
          </Card>
        );
      case 'upcoming-workout':
        if (!upcomingWorkout) return null;
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-6 h-6 text-[#2a2334] fill-[#f3a3cd]" />
                <h2 className="text-xl font-semibold text-[#2a2334]">
                  {isToday(parseISO(upcomingWorkout.date)) ? "Today's Workout" : 'Next Workout'}
                </h2>
              </div>
              <div className="space-y-2">
                <p className="text-[#5a4b62] font-medium">
                  {format(parseISO(upcomingWorkout.date), 'EEEE, MMMM d, yyyy')}
                </p>
                {upcomingWorkout.workoutType === 'yoga' ? (
                  <div className="space-y-1">
                    <div className="text-sm text-[#2a2334]">
                      Yoga flow: {upcomingWorkout.yogaFlowName || 'Custom flow'}
                    </div>
                    {(upcomingWorkout.yogaPoses ?? []).slice(0, 3).map((pose, idx) => (
                      <div key={idx} className="text-sm text-[#2a2334]">
                        {idx + 1}. {pose.name}
                        {pose.durationMinutes ? ` (${pose.durationMinutes} min)` : ''}
                      </div>
                    ))}
                  </div>
                ) : upcomingWorkout.exercises.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingWorkout.exercises.slice(0, 3).map((ex, idx) => (
                      <div key={idx} className="text-sm text-[#2a2334]">
                        {ex.name} {ex.sets && ex.reps ? `- ${ex.sets}x${ex.reps}` : ''} {ex.weight ? `@ ${ex.weight}kg` : ''}
                      </div>
                    ))}
                  </div>
                ) : null}
                {upcomingWorkout.notes && (
                  <p className="text-sm text-[#5a4b62] border-l-4 border-[#b9a7de] pl-3 mt-2">
                    {upcomingWorkout.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-[#2a2334] mx-auto mb-2" />
                <div className="text-3xl font-bold text-[#2a2334]">{totalWorkouts}</div>
                <p className="text-sm text-[#5a4b62]">Total Workouts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Scale className="w-8 h-8 text-[#2a2334] mx-auto mb-2" />
                <div className="text-3xl font-bold text-[#2a2334]">
                  {latestWeight ? `${latestWeight}kg` : '--'}
                </div>
                <p className="text-sm text-[#5a4b62]">Current Weight</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-[#2a2334] fill-[#f3a3cd] mx-auto mb-2" />
                <div className="text-3xl font-bold text-[#2a2334]">
                  {totalMovements}
                </div>
                <p className="text-sm text-[#5a4b62]">Total Movements</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'water-tracker':
        return <WaterTracker />;

      case 'calendar':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#2a2334]">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevMonth}
                    className="text-[#2a2334]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="text-[#2a2334]"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextMonth}
                    className="text-[#2a2334]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleAddWorkout}
                    size="sm"
                    className="ml-4 bg-[#f3a3cd] hover:bg-[#ffbadf]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Workout
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center font-bold text-[#2a2334] py-2"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, index) => {
                  const dateString = format(day, 'yyyy-MM-dd');
                  const dayWorkouts = workoutsByDate.get(dateString) || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isSameDay(day, new Date());
                  const hasWorkout = dayWorkouts.length > 0;

                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border-2 rounded-xl cursor-pointer transition-all ${
                        isCurrentMonth
                          ? hasWorkout 
                            ? 'bg-[#ffecf7] border-[#2a2334] hover:shadow-md'
                            : 'bg-[#f7efcf] border-[#2a2334]'
                          : 'bg-[#e6dcc0] border-[#b9ad8b] text-[#8b7b94]'
                      } ${isTodayDate ? 'ring-2 ring-[#4b37ef]' : ''}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span
                          className={`text-sm font-semibold ${
                            isTodayDate
                              ? 'w-7 h-7 flex items-center justify-center bg-[#4b37ef] text-white rounded-full'
                              : hasWorkout ? 'text-[#2a2334]' : 'text-[#5a4b62]'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      {hasWorkout && (
                        <div className="space-y-1">
                          {dayWorkouts[0].workoutType === 'yoga'
                            ? (
                              <>
                                {(dayWorkouts[0].yogaPoses ?? []).slice(0, 2).map((pose, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs p-1 bg-[#b8df69] text-[#2a2334] rounded truncate"
                                    title={pose.name}
                                  >
                                    {pose.name}
                                  </div>
                                ))}
                                {(dayWorkouts[0].yogaPoses?.length ?? 0) > 2 && (
                                  <div className="text-xs text-[#5a4b62] text-center">
                                    +{(dayWorkouts[0].yogaPoses?.length ?? 0) - 2} more
                                  </div>
                                )}
                              </>
                            )
                            : (
                              <>
                                {dayWorkouts[0].exercises.slice(0, 2).map((ex, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs p-1 bg-[#b8df69] text-[#2a2334] rounded truncate"
                                    title={ex.name}
                                  >
                                    {ex.name}
                                  </div>
                                ))}
                                {dayWorkouts[0].exercises.length > 2 && (
                                  <div className="text-xs text-[#5a4b62] text-center">
                                    +{dayWorkouts[0].exercises.length - 2} more
                                  </div>
                                )}
                              </>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen retro-desktop p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with cute image - always on top, not draggable */}
          <div className="relative">
            <img 
              src={bannerImageUrl} 
              alt="Cute Header" 
              className="w-full h-48 object-cover rounded-[14px] border-[3px] border-[#2a2334] shadow-[0_5px_0_#2a2334]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f3a3cd]/35 to-transparent rounded-[14px]" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
                onClick={() => bannerInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                Change Banner
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
                onClick={resetBannerImage}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerFileChange}
              />
            </div>
            <div className="absolute bottom-4 left-6">
              <h1 className="text-4xl font-bold text-[#2a2334] drop-shadow-lg">Workout Tracker</h1>
            </div>
          </div>

          {/* Reorder hint + reset button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#5a4b62] italic">
              Hover on the left edge of any section & drag to reorder
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOrder}
              className="text-[#2a2334] gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Layout
            </Button>
          </div>

          {/* Draggable sections */}
          {sectionOrder
            .filter(sectionId => {
              // Filter out sections that render nothing
              if (sectionId === 'upcoming-workout' && !upcomingWorkout) return false;
              if (sectionId === 'priority-task' && !priorityTask) return false;
              return true;
            })
            .map((sectionId, index) => (
              <DraggableDashboardItem
                key={sectionId}
                id={sectionId}
                index={index}
                moveItem={moveSection}
              >
                {renderSection(sectionId)}
              </DraggableDashboardItem>
            ))}
        </div>

        <AddWorkoutModal
          isOpen={isModalOpen}
          onClose={handleCloseAddModal}
          selectedDate={selectedDate}
          editWorkout={editWorkout}
        />
        <ViewWorkoutModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          workout={viewWorkout}
          onEdit={handleEditWorkout}
        />
      </div>
    </DndProvider>
  );
}
