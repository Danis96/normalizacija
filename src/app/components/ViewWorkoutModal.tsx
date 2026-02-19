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
import { Edit, Scale, Calendar } from 'lucide-react';

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

  const isYoga = workout.workoutType === 'yoga';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#2a2334]">Workout Details</DialogTitle>
          <DialogDescription className="text-[#5a4b62]">
            View your workout information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="flex items-center gap-3 p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]">
            <Calendar className="w-5 h-5 text-[#2a2334]" />
            <div>
              <div className="text-sm text-[#5a4b62]">Date</div>
              <div className="font-bold text-[#2a2334]">
                {format(parseISO(workout.date), 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]">
            <div>
              <div className="text-sm text-[#5a4b62]">Workout Type</div>
              <div className="font-bold text-[#2a2334]">{isYoga ? 'Yoga' : 'Strength'}</div>
            </div>
          </div>

          {workout.bodyWeight && (
            <div className="flex items-center gap-3 p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]">
              <Scale className="w-5 h-5 text-[#2a2334]" />
              <div>
                <div className="text-sm text-[#5a4b62]">Body Weight</div>
                <div className="font-bold text-[#2a2334]">{workout.bodyWeight} kg</div>
              </div>
            </div>
          )}

          {workout.imageUrl && (
            <div>
              <div className="text-sm text-[#5a4b62] mb-2">Workout Photo</div>
              <img
                src={workout.imageUrl}
                alt="Workout"
                className="w-full h-64 object-cover rounded-[10px] border-[3px] border-[#2a2334]"
              />
            </div>
          )}

          {isYoga ? (
            <div>
              <div className="text-lg font-bold text-[#2a2334] mb-3">Yoga Flow</div>
              {workout.yogaFlowName ? (
                <p className="text-sm text-[#5a4b62] mb-2">Flow: {workout.yogaFlowName}</p>
              ) : null}
              <div className="space-y-3">
                {(workout.yogaPoses ?? []).map((pose, idx) => (
                  <div key={idx} className="p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]">
                    <div className="font-bold text-[#2a2334] mb-1">
                      {idx + 1}. {pose.name}
                    </div>
                    <div className="text-sm text-[#5a4b62]">
                      {pose.durationMinutes ? `Duration: ${pose.durationMinutes} min` : 'Duration: -'}
                    </div>
                    {pose.notes ? <div className="text-sm text-[#5a4b62]">Notes: {pose.notes}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-[#2a2334] mb-3">Exercises</div>
              <div className="space-y-3">
                {workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334]">
                    <div className="font-bold text-[#2a2334] mb-1">{exercise.name}</div>
                    <div className="text-sm text-[#5a4b62]">
                      {exercise.sets && exercise.reps ? (
                        <span className="mr-3">{exercise.sets} sets x {exercise.reps} reps</span>
                      ) : null}
                      {exercise.weight ? <span>{exercise.weight} kg</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workout.notes && (
            <div>
              <div className="text-sm text-[#5a4b62] mb-2">Notes</div>
              <div className="p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334] border-l-4 border-l-[#b9a7de]">
                <p className="text-[#2a2334] italic">"{workout.notes}"</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleEdit} className="flex-1 bg-[#b9a7de] hover:bg-[#d1c0f1]">
              <Edit className="w-4 h-4 mr-2" />
              Edit Workout
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
