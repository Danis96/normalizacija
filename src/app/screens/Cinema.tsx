import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Clapperboard, Plus, Star, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function Cinema() {
  const { cinemaItems, addCinemaItem, deleteCinemaItem } = useApp();
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImage(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !review.trim() || rating < 1) {
      toast.error('Add title, review and rating');
      return;
    }

    addCinemaItem({
      title: title.trim(),
      review: review.trim(),
      rating,
      image: image || undefined,
    });

    setTitle('');
    setReview('');
    setRating(0);
    setImage('');
    setImagePreview('');
    toast.success('Movie added to Cinema');
  };

  const handleDelete = (id: string) => {
    deleteCinemaItem(id);
    toast.success('Movie removed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-pink-200 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-rose-700">Cinema</h1>
          <p className="text-rose-600 mt-1 text-lg">Track movies, reviews and star ratings.</p>
        </div>

        <Card className="border-4 border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleAddMovie} className="space-y-4">
              <div>
                <Label htmlFor="movie-title" className="text-rose-700">Movie title</Label>
                <Input
                  id="movie-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Movie name"
                  className="border-2 border-rose-300"
                />
              </div>
              <div>
                <Label htmlFor="movie-review" className="text-rose-700">Short review</Label>
                <Textarea
                  id="movie-review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you think?"
                  className="border-2 border-rose-300 bg-white"
                />
              </div>
              <div>
                <Label className="text-rose-700">Rating</Label>
                <div className="flex gap-2 mt-1">
                  {RATING_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          value <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="movie-image" className="text-rose-700">Movie image (optional)</Label>
                <Input
                  id="movie-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="border-2 border-rose-300"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Movie preview"
                    className="w-40 h-24 object-cover rounded-lg mt-2 border-2 border-rose-300"
                  />
                )}
              </div>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="w-4 h-4 mr-1" />
                Add Movie
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {cinemaItems.length === 0 ? (
            <Card className="border-2 border-rose-200">
              <CardContent className="p-8 text-center text-rose-400">
                <Clapperboard className="w-10 h-10 mx-auto mb-2" />
                No movies yet.
              </CardContent>
            </Card>
          ) : (
            cinemaItems.map((item) => (
              <Card key={item.id} className="border-2 border-rose-200 bg-white">
                <CardContent className="p-4 flex gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-28 h-20 rounded object-cover" />
                  ) : (
                    <div className="w-28 h-20 rounded bg-rose-100 flex items-center justify-center text-rose-500">
                      <Clapperboard className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-rose-700">{item.title}</h3>
                        <p className="text-xs text-rose-500">
                          {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {RATING_OPTIONS.map((value) => (
                        <Star
                          key={value}
                          className={`w-4 h-4 ${
                            value <= item.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{item.review}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
