import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DollarSign, Plus, Trash2, Camera, TrendingUp, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

const SPENDING_CATEGORIES = [
  { value: 'home', label: '🏠 Home', color: 'from-orange-400 to-red-400' },
  { value: 'groceries', label: '🛒 Groceries', color: 'from-green-400 to-emerald-400' },
  { value: 'makeup', label: '💄 Makeup', color: 'from-pink-400 to-rose-400' },
  { value: 'takeout', label: '🍔 Takeout', color: 'from-yellow-400 to-orange-400' },
  { value: 'fitness', label: '💪 Fitness', color: 'from-purple-400 to-pink-400' },
  { value: 'shopping', label: '🛍️ Shopping', color: 'from-blue-400 to-cyan-400' },
  { value: 'entertainment', label: '🎬 Entertainment', color: 'from-violet-400 to-purple-400' },
  { value: 'other', label: '📦 Other', color: 'from-gray-400 to-slate-400' },
];

export function SpendingTracker() {
  const { spending, addSpending, deleteSpending, getTotalSpending, getSpendingForDate } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySpending = getSpendingForDate(today);
  const todayTotal = todaySpending.reduce((sum, entry) => sum + entry.amount, 0);

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const monthTotal = getTotalSpending(monthStart, monthEnd);
  const allTimeTotal = getTotalSpending();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setReceiptFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      await addSpending({
        date: today,
        amount: numAmount,
        category,
        description,
        imageFile: receiptFile,
      });

      toast.success('Spending added! 💸');
      setAmount('');
      setCategory('');
      setDescription('');
      setImagePreview('');
      setReceiptFile(null);
      setIsOpen(false);
    } catch {
      toast.error('Could not save spending. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpending(id);
      toast.success('Spending entry deleted! 🗑️');
    } catch {
      toast.error('Could not delete spending entry.');
    }
  };

  const getCategoryInfo = (categoryValue: string) => {
    return SPENDING_CATEGORIES.find((cat) => cat.value === categoryValue) || SPENDING_CATEGORIES[SPENDING_CATEGORIES.length - 1];
  };

  return (
    <Card className="border-4 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-bold text-green-600">Spending Tracker</h3>
            </div>
            <p className="text-sm text-emerald-600">Track your expenses</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white">
                <Plus className="w-4 h-4 mr-1" />
                Add Spending
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-4 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <DialogHeader>
                <DialogTitle className="text-green-700 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Add New Spending
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-green-700">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="border-2 border-green-300 focus:border-green-400"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-green-700">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="border-2 border-green-300 focus:border-green-400">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPENDING_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-green-700">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you buy?"
                    className="border-2 border-green-300 focus:border-green-400"
                  />
                </div>
                <div>
                  <Label htmlFor="receipt" className="text-green-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Receipt Photo (Optional)
                  </Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="border-2 border-green-300 focus:border-green-400"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img src={imagePreview} alt="Receipt preview" className="w-full h-32 object-cover rounded-lg border-2 border-green-300" />
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Saving...' : 'Add Spending'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg border-2 border-green-200 p-3 text-center">
            <Calendar className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <div className="text-xs text-green-600 mb-1">Today</div>
            <div className="text-lg font-bold text-green-700">${todayTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border-2 border-emerald-200 p-3 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <div className="text-xs text-emerald-600 mb-1">This Month</div>
            <div className="text-lg font-bold text-emerald-700">${monthTotal.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border-2 border-green-300 p-3 text-center">
            <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <div className="text-xs text-green-700 mb-1">All Time</div>
            <div className="text-lg font-bold text-green-800">${allTimeTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-bold text-green-700 mb-2">Today's Expenses</h4>
          {todaySpending.length === 0 ? (
            <div className="text-center py-6 text-green-400">
              <p>No spending today! 💰</p>
              <p className="text-sm mt-1">You're doing great!</p>
            </div>
          ) : (
            todaySpending.map((entry) => {
              const categoryInfo = getCategoryInfo(entry.category);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-300 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${categoryInfo.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                    {categoryInfo.label.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-green-800 truncate">{entry.description}</div>
                    <div className="text-xs text-green-600">{categoryInfo.label.split(' ')[1]}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-green-700">${entry.amount.toFixed(2)}</div>
                    {entry.receiptImage && (
                      <div className="text-xs text-green-500">📷</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(entry.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
