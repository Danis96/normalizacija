import { useState, useEffect } from 'react';
import { useApp, Exercise, WorkoutLog } from '../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  editWorkout?: WorkoutLog | null;
}

export function AddWorkoutModal({ isOpen, onClose, selectedDate, editWorkout }: AddWorkoutModalProps) {
  const { addWorkout, updateWorkout } = useApp();
  const [formData, setFormData] = useState({
    date: selectedDate || '',
    bodyWeight: '',
    notes: '',
  });
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: undefined, reps: undefined, weight: undefined },
  ]);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editWorkout) {
      setFormData({
        date: editWorkout.date,
        bodyWeight: editWorkout.bodyWeight?.toString() || '',
        notes: editWorkout.notes || '',
      });
      setExercises(
        editWorkout.exercises && editWorkout.exercises.length > 0
          ? editWorkout.exercises
          : [{ name: '', sets: undefined, reps: undefined, weight: undefined }],
      );
      setImagePreview(editWorkout.imageUrl || '');
      setImageFile(null);
      return;
    }

    setFormData({
      date: selectedDate || '',
      bodyWeight: '',
      notes: '',
    });
    setExercises([{ name: '', sets: undefined, reps: undefined, weight: undefined }]);
    setImagePreview('');
    setImageFile(null);
  }, [isOpen, editWorkout, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    const validExercises = exercises.filter((exercise) => exercise.name.trim() !== '');
    if (validExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    const workoutData = {
      date: formData.date,
      exercises: validExercises,
      bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
      notes: formData.notes,
      imageUrl: !imageFile ? imagePreview || undefined : undefined,
      imageFile,
    };

    setIsSubmitting(true);

    try {
      if (editWorkout) {
        await updateWorkout(editWorkout.id, workoutData);
        toast.success('Workout updated!');
      } else {
        await addWorkout(workoutData);
        toast.success('Workout logged!');
      }

      handleClose();
    } catch {
      toast.error('Could not save workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      date: '',
      bodyWeight: '',
      notes: '',
    });
    setExercises([{ name: '', sets: undefined, reps: undefined, weight: undefined }]);
    setImagePreview('');
    setImageFile(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: undefined, reps: undefined, weight: undefined }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises];
    if (field === 'name') {
      updated[index][field] = value as string;
    } else {
      updated[index][field] = value ? Number(value) : undefined;
    }
    setExercises(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#2a2334]">
            {editWorkout ? 'Edit Workout' : 'Log Workout'}
          </DialogTitle>
          <DialogDescription className="text-[#5a4b62]">
            Track your exercises and progress!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[#2a2334]">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyWeight" className="text-[#2a2334]">Body Weight (kg)</Label>
            <Input
              id="bodyWeight"
              type="number"
              step="0.1"
              value={formData.bodyWeight}
              onChange={(e) => setFormData({ ...formData, bodyWeight: e.target.value })}
              placeholder="Your weight today"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[#2a2334] text-lg">Exercises *</Label>
              <Button
                type="button"
                onClick={addExercise}
                size="sm"
                className="bg-[#b9a7de] hover:bg-[#d1c0f1]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Exercise
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 bg-[#f7efcf] rounded-[10px] border-2 border-[#2a2334] space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Exercise name (e.g., Bench Press)"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(index)}
                        className=""
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Sets"
                      value={exercise.sets || ''}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.reps || ''}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Weight (kg)"
                      value={exercise.weight || ''}
                      onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[#2a2334]">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did you feel? Any personal records?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#2a2334]">Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-[10px] border-[3px] border-[#2a2334]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-[3px] border-dashed border-[#2a2334] rounded-[10px] cursor-pointer hover:bg-[#ffecf7] transition-colors"
              >
                <Upload className="w-8 h-8 text-[#2a2334] mb-2" />
                <span className="text-sm text-[#5a4b62]">Click to upload a photo</span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#f3a3cd] hover:bg-[#ffbadf] text-lg h-12"
            >
              {isSubmitting ? 'Saving...' : 'Save Workout'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
