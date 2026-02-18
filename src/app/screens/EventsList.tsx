import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AddWorkoutModal } from '../components/AddWorkoutModal';
import { WorkoutLog } from '../context/AppContext';
import { Heart, Trash2, Scale, TrendingUp, Calendar, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export function EventsList() {
  const { workouts, deleteWorkout } = useApp();
  const navigate = useNavigate();
  const [editWorkout, setEditWorkout] = useState<WorkoutLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [workouts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      await deleteWorkout(id);
      toast.success('Workout deleted!');
    } catch {
      toast.error('Could not delete workout.');
    }
  };

  const totalExercises = workouts.reduce((acc, workout) => acc + workout.exercises.length, 0);
  const averageExercisesPerWorkout = workouts.length > 0 ? (totalExercises / workouts.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen retro-desktop p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#2a2334]">Workout History</h1>
            <p className="text-[#5a4b62] mt-1 text-lg">
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} logged
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[#2a2334]" />
                <div>
                  <div className="text-2xl font-bold text-[#2a2334]">{totalExercises}</div>
                  <p className="text-sm text-[#5a4b62]">Total Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-[#2a2334] fill-[#f3a3cd]" />
                <div>
                  <div className="text-2xl font-bold text-[#2a2334]">{averageExercisesPerWorkout}</div>
                  <p className="text-sm text-[#5a4b62]">Avg per Workout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {sortedWorkouts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="w-16 h-16 text-[#2a2334] fill-[#f3a3cd] mb-4" />
              <h3 className="text-lg font-semibold text-[#2a2334] mb-2">No workouts yet!</h3>
              <p className="text-[#5a4b62] mb-6 text-center max-w-sm">
                Start your fitness journey by logging your first workout.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-[#f3a3cd] hover:bg-[#ffbadf]"
              >
                Add Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {workout.imageUrl ? (
                      <img
                        src={workout.imageUrl}
                        alt="Workout"
                        className="w-32 h-32 rounded-[10px] object-cover flex-shrink-0 border-[3px] border-[#2a2334]"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-[10px] bg-[#f7efcf] flex items-center justify-center flex-shrink-0 border-[3px] border-[#2a2334]">
                        <Heart className="w-12 h-12 text-[#2a2334] fill-[#f3a3cd]" />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-[#2a2334]" />
                            <h3 className="text-xl font-bold text-[#2a2334]">
                              {format(parseISO(workout.date), 'EEEE, MMMM d, yyyy')}
                            </h3>
                          </div>
                          {workout.bodyWeight && (
                            <div className="flex items-center gap-2 text-[#5a4b62]">
                              <Scale className="w-4 h-4" />
                              <span className="font-medium">Body Weight: {workout.bodyWeight}kg</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDelete(workout.id)}
                            className=""
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditWorkout(workout);
                              setIsModalOpen(true);
                            }}
                            className=""
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-[#2a2334]">Exercises:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {workout.exercises.map((exercise, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]"
                            >
                              <span className="text-xl">#</span>
                              <div className="flex-1">
                                <div className="font-medium text-[#2a2334]">{exercise.name}</div>
                                <div className="text-sm text-[#5a4b62]">
                                  {exercise.sets && exercise.reps && (
                                    <span>{exercise.sets} sets x {exercise.reps} reps</span>
                                  )}
                                  {exercise.weight && (
                                    <span className="ml-2">@ {exercise.weight}kg</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {workout.notes && (
                        <div className="border-l-4 border-[#b9a7de] pl-3 py-1">
                          <p className="text-sm text-[#5a4b62] italic">"{workout.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <AddWorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditWorkout(null);
        }}
        selectedDate={editWorkout?.date}
        editWorkout={editWorkout}
      />
    </div>
  );
}
