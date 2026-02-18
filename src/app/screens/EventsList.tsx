import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      deleteWorkout(id);
      toast.success('Workout deleted! ✨');
    }
  };

  const totalExercises = workouts.reduce((acc, w) => acc + w.exercises.length, 0);
  const averageExercisesPerWorkout = workouts.length > 0 ? (totalExercises / workouts.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-pink-600">✨ Workout History ✨</h1>
            <p className="text-purple-600 mt-1 text-lg">
              {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} logged
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-4 border-pink-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-pink-500" />
                <div>
                  <div className="text-2xl font-bold text-pink-600">{totalExercises}</div>
                  <p className="text-sm text-purple-600">Total Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-4 border-purple-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-purple-500 fill-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{averageExercisesPerWorkout}</div>
                  <p className="text-sm text-pink-600">Avg per Workout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {sortedWorkouts.length === 0 ? (
          <Card className="border-4 border-pink-300 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="w-16 h-16 text-pink-300 mb-4" />
              <h3 className="text-lg font-semibold text-pink-600 mb-2">No workouts yet!</h3>
              <p className="text-purple-600 mb-6 text-center max-w-sm">
                Start your fitness journey by logging your first workout 💪
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500"
              >
                ♡ Add Your First Workout ♡
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="border-4 border-pink-300 bg-white hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image or Placeholder */}
                    {workout.imageUrl ? (
                      <img
                        src={workout.imageUrl}
                        alt="Workout"
                        className="w-32 h-32 rounded-xl object-cover flex-shrink-0 border-4 border-pink-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center flex-shrink-0 border-4 border-pink-300">
                        <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
                      </div>
                    )}

                    {/* Workout Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-pink-500" />
                            <h3 className="text-xl font-bold text-pink-600">
                              {format(parseISO(workout.date), 'EEEE, MMMM d, yyyy')}
                            </h3>
                          </div>
                          {workout.bodyWeight && (
                            <div className="flex items-center gap-2 text-purple-600">
                              <Scale className="w-4 h-4" />
                              <span className="font-medium">Body Weight: {workout.bodyWeight}kg</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(workout.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Exercises */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-pink-600">Exercises:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {workout.exercises.map((exercise, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg border-2 border-pink-200"
                            >
                              <span className="text-xl">💪</span>
                              <div className="flex-1">
                                <div className="font-medium text-pink-700">{exercise.name}</div>
                                <div className="text-sm text-purple-600">
                                  {exercise.sets && exercise.reps && (
                                    <span>{exercise.sets} sets × {exercise.reps} reps</span>
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

                      {/* Notes */}
                      {workout.notes && (
                        <div className="border-l-4 border-pink-300 pl-3 py-1">
                          <p className="text-sm text-purple-600 italic">"{workout.notes}"</p>
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