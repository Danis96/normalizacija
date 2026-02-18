import { WorkoutLog } from '../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { format, parseISO } from 'date-fns';
import { Edit, Scale, Calendar, Heart } from 'lucide-react';

interface ViewWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutLog | null;
  onEdit: (workout: WorkoutLog) => void;
}

export function ViewWorkoutModal({ isOpen, onClose, workout, onEdit }: ViewWorkoutModalProps) {
  if (!workout) return null;

  const handleEdit = () => {
    onEdit(workout);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-pink-50 border-4 border-pink-300">
        <DialogHeader>
          <DialogTitle className="text-2xl text-pink-600">✨ Workout Details ✨</DialogTitle>
          <DialogDescription className="text-purple-600">
            View your workout information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Date */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-pink-200">
            <Calendar className="w-5 h-5 text-pink-500" />
            <div>
              <div className="text-sm text-purple-600">Date</div>
              <div className="font-bold text-pink-700">
                {format(parseISO(workout.date), 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Body Weight */}
          {workout.bodyWeight && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-pink-200">
              <Scale className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-sm text-purple-600">Body Weight</div>
                <div className="font-bold text-pink-700">{workout.bodyWeight} kg</div>
              </div>
            </div>
          )}

          {/* Image */}
          {workout.imageUrl && (
            <div>
              <div className="text-sm text-purple-600 mb-2">Workout Photo</div>
              <img
                src={workout.imageUrl}
                alt="Workout"
                className="w-full h-64 object-cover rounded-lg border-4 border-pink-200"
              />
            </div>
          )}

          {/* Exercises */}
          <div>
            <div className="text-lg font-bold text-pink-600 mb-3">Exercises</div>
            <div className="space-y-3">
              {workout.exercises.map((exercise, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-lg border-2 border-pink-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💪</span>
                    <div className="flex-1">
                      <div className="font-bold text-pink-700 mb-1">{exercise.name}</div>
                      <div className="text-sm text-purple-600">
                        {exercise.sets && exercise.reps && (
                          <span className="mr-3">
                            📊 {exercise.sets} sets × {exercise.reps} reps
                          </span>
                        )}
                        {exercise.weight && (
                          <span>⚖️ {exercise.weight} kg</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {workout.notes && (
            <div>
              <div className="text-sm text-purple-600 mb-2">Notes</div>
              <div className="p-4 bg-white rounded-lg border-2 border-pink-200 border-l-4">
                <p className="text-pink-700 italic">"{workout.notes}"</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEdit}
              className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Workout
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-pink-300"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
