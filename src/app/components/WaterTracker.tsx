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

  const handleAddWater = async () => {
    try {
      await addWaterBottle(today);
      toast.success('Water bottle added.');
    } catch {
      toast.error('Could not update water intake.');
    }
  };

  const handleRemoveWater = async () => {
    if (bottlesCount === 0) {
      return;
    }

    try {
      await removeWaterBottle(today);
      toast.success('Water bottle removed.');
    } catch {
      toast.error('Could not update water intake.');
    }
  };

  const maxBottles = 8;
  const fillPercentage = Math.min((bottlesCount / maxBottles) * 100, 100);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-32 flex-shrink-0">
            <div className="absolute inset-0 bg-[#f7efcf] border-[3px] border-[#2a2334] rounded-[10px] overflow-hidden">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#4b37ef] to-[#70a2ff] transition-all duration-500 ease-out"
                style={{ height: `${fillPercentage}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#b0c9ff] animate-pulse" />
              </div>
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#f3a3cd] rounded-t-[8px] border-[3px] border-[#2a2334]" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Droplet className="w-8 h-8 text-[#2a2334] fill-[#b8df69]" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-5 h-5 text-[#2a2334] fill-[#b8df69]" />
              <h3 className="text-xl font-bold text-[#2a2334]">Water Intake</h3>
            </div>
            <p className="text-3xl font-bold text-[#2a2334] mb-1">
              {bottlesCount} {bottlesCount === 1 ? 'bottle' : 'bottles'}
            </p>
            <p className="text-sm text-[#5a4b62] mb-3">Stay hydrated.</p>
            <div className="flex gap-2">
              <Button onClick={() => void handleAddWater()} size="sm" className="bg-[#b8df69] hover:bg-[#c9ef7a]">
                <Plus className="w-4 h-4 mr-1" />
                Add Bottle
              </Button>
              <Button
                onClick={() => void handleRemoveWater()}
                size="sm"
                disabled={bottlesCount === 0}
                className="bg-[#f3a3cd] hover:bg-[#ffbadf] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-1 flex-wrap">
          {Array.from({ length: Math.min(bottlesCount, 12) }).map((_, idx) => (
            <div
              key={idx}
              className="w-6 h-8 bg-gradient-to-t from-[#4b37ef] to-[#70a2ff] border-2 border-[#2a2334] rounded relative"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-[#f3a3cd] rounded-t border-2 border-[#2a2334]" />
            </div>
          ))}
          {bottlesCount > 12 && (
            <div className="flex items-center justify-center px-2 text-sm font-bold text-[#2a2334]">
              +{bottlesCount - 12}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
