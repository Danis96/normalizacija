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
    { name: '', sets: undefined, reps: undefined, weight: undefined }
  ]);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Reset form when modal opens or editWorkout changes
  useEffect(() => {
    if (isOpen) {
      if (editWorkout) {
        setFormData({
          date: editWorkout.date,
          bodyWeight: editWorkout.bodyWeight?.toString() || '',
          notes: editWorkout.notes || '',
        });
        setExercises(
          editWorkout.exercises && editWorkout.exercises.length > 0
            ? editWorkout.exercises
            : [{ name: '', sets: undefined, reps: undefined, weight: undefined }]
        );
        setImagePreview(editWorkout.imageUrl || '');
      } else {
        setFormData({
          date: selectedDate || '',
          bodyWeight: '',
          notes: '',
        });
        setExercises([{ name: '', sets: undefined, reps: undefined, weight: undefined }]);
        setImagePreview('');
      }
    }
  }, [isOpen, editWorkout, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
    
    if (validExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    const workoutData = {
      date: formData.date,
      exercises: validExercises,
      bodyWeight: formData.bodyWeight ? parseFloat(formData.bodyWeight) : undefined,
      notes: formData.notes,
      imageUrl: imagePreview,
    };

    if (editWorkout) {
      updateWorkout(editWorkout.id, workoutData);
      toast.success('Workout updated! 💪');
    } else {
      addWorkout(workoutData);
      toast.success('Workout logged! 💪');
    }

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      date: '',
      bodyWeight: '',
      notes: '',
    });
    setExercises([{ name: '', sets: undefined, reps: undefined, weight: undefined }]);
    setImagePreview('');
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-pink-50 border-4 border-pink-300">
        <DialogHeader>
          <DialogTitle className="text-2xl text-pink-600">
            ✨ {editWorkout ? 'Edit Workout' : 'Log Your Workout'} ✨
          </DialogTitle>
          <DialogDescription className="text-purple-600">
            Track your exercises and progress!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-pink-700">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border-2 border-pink-300 focus:border-pink-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyWeight" className="text-pink-700">Body Weight (kg)</Label>
            <Input
              id="bodyWeight"
              type="number"
              step="0.1"
              value={formData.bodyWeight}
              onChange={(e) => setFormData({ ...formData, bodyWeight: e.target.value })}
              placeholder="Your weight today"
              className="border-2 border-pink-300 focus:border-pink-400"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-pink-700 text-lg">Exercises *</Label>
              <Button
                type="button"
                onClick={addExercise}
                size="sm"
                className="bg-purple-400 hover:bg-purple-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Exercise
              </Button>
            </div>
            
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border-2 border-pink-200 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Exercise name (e.g., Bench Press)"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      className="flex-1 border-2 border-pink-200"
                    />
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(index)}
                        className="text-red-500 hover:text-red-700"
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
                      className="border-2 border-pink-200"
                    />
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.reps || ''}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      className="border-2 border-pink-200"
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Weight (kg)"
                      value={exercise.weight || ''}
                      onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      className="border-2 border-pink-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-pink-700">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did you feel? Any PRs? 💪"
              rows={3}
              className="border-2 border-pink-300 focus:border-pink-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-pink-700">Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-4 border-pink-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImagePreview('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-pink-100 transition-colors"
              >
                <Upload className="w-8 h-8 text-pink-400 mb-2" />
                <span className="text-sm text-pink-600">Click to upload a photo</span>
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
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white text-lg h-12"
            >
              ♡ Save Workout ♡
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-2 border-pink-300"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}