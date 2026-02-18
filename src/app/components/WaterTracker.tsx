import { useApp } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Droplet, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function WaterTracker() {
  const { addWaterBottle, removeWaterBottle, getWaterForDate } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const bottlesCount = getWaterForDate(today);

  const handleAddWater = () => {
    addWaterBottle(today);
    toast.success('Water bottle added! 💧');
  };

  const handleRemoveWater = () => {
    if (bottlesCount > 0) {
      removeWaterBottle(today);
      toast.success('Water bottle removed! 🔄');
    }
  };

  // Calculate fill percentage (max 8 bottles for visual purposes)
  const maxBottles = 8;
  const fillPercentage = Math.min((bottlesCount / maxBottles) * 100, 100);

  return (
    <Card className="border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Water Bottle Visualization */}
          <div className="relative w-24 h-32 flex-shrink-0">
            {/* Bottle Container */}
            <div className="absolute inset-0 bg-white/50 border-4 border-blue-400 rounded-lg overflow-hidden">
              {/* Water Fill */}
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-cyan-300 transition-all duration-500 ease-out"
                style={{ height: `${fillPercentage}%` }}
              >
                {/* Wave effect */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-blue-300/50 animate-pulse" />
              </div>
            </div>
            {/* Bottle Cap */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-blue-400 rounded-t-lg border-4 border-blue-500" />
            
            {/* Droplet Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Droplet className="w-8 h-8 text-blue-500 fill-blue-200" />
            </div>
          </div>

          {/* Info and Button */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-blue-500 fill-blue-500" />
              <h3 className="text-xl font-bold text-blue-600">Water Intake</h3>
            </div>
            <p className="text-3xl font-bold text-cyan-600 mb-1">
              {bottlesCount} {bottlesCount === 1 ? 'bottle' : 'bottles'}
            </p>
            <p className="text-sm text-blue-600 mb-3">Stay hydrated! 💧</p>
            <div className="flex gap-2">
              <Button
                onClick={handleAddWater}
                size="sm"
                className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Bottle
              </Button>
              <Button
                onClick={handleRemoveWater}
                size="sm"
                disabled={bottlesCount === 0}
                className="bg-gradient-to-r from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Visual bottles count */}
        <div className="mt-4 flex gap-1 flex-wrap">
          {Array.from({ length: Math.min(bottlesCount, 12) }).map((_, idx) => (
            <div
              key={idx}
              className="w-6 h-8 bg-gradient-to-t from-blue-400 to-cyan-300 border-2 border-blue-400 rounded relative"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-blue-400 rounded-t border-2 border-blue-500" />
            </div>
          ))}
          {bottlesCount > 12 && (
            <div className="flex items-center justify-center px-2 text-sm font-bold text-blue-600">
              +{bottlesCount - 12}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}