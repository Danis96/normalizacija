import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { BookOpen, Plus, Star, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function Library() {
  const { libraryItems, addLibraryItem, deleteLibraryItem } = useApp();
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !review.trim() || rating < 1) {
      toast.error('Add title, review and rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await addLibraryItem({
        title: title.trim(),
        review: review.trim(),
        rating,
        imageFile,
      });

      setTitle('');
      setReview('');
      setRating(0);
      setImageFile(null);
      setImagePreview('');
      toast.success('Book added to Library');
    } catch {
      toast.error('Could not add book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLibraryItem(id);
      toast.success('Book removed');
    } catch {
      toast.error('Could not remove book.');
    }
  };

  return (
    <div className="min-h-screen retro-desktop p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[#2a2334]">Library</h1>
          <p className="text-[#5a4b62] mt-1 text-lg">Track books, reviews and ratings.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <Label htmlFor="book-title" className="text-[#2a2334]">Book title</Label>
                <Input
                  id="book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Book name"
                />
              </div>
              <div>
                <Label htmlFor="book-review" className="text-[#2a2334]">Short review</Label>
                <Textarea
                  id="book-review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What did you think?"
                />
              </div>
              <div>
                <Label className="text-[#2a2334]">Rating</Label>
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
                <Label htmlFor="book-image" className="text-[#2a2334]">Book image (optional)</Label>
                <Input
                  id="book-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Book preview"
                    className="w-28 h-40 object-cover rounded-[10px] mt-2 border-2 border-[#2a2334]"
                  />
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="bg-[#b9a7de] hover:bg-[#d1c0f1]">
                <Plus className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Saving...' : 'Add Book'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {libraryItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-[#5a4b62]">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-[#2a2334]" />
                No books yet.
              </CardContent>
            </Card>
          ) : (
            libraryItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-20 h-28 rounded-[10px] object-cover border-2 border-[#2a2334]" />
                  ) : (
                    <div className="w-20 h-28 rounded-[10px] bg-[#f7efcf] border-2 border-[#2a2334] flex items-center justify-center text-[#2a2334]">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#2a2334]">{item.title}</h3>
                        <p className="text-xs text-[#5a4b62]">
                          {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(item.id)}
                        className=""
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
                    <p className="text-sm text-[#2a2334] mt-2">{item.review}</p>
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
