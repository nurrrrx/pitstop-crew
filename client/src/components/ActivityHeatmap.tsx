import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActivityData } from '../types';

interface ActivityHeatmapProps {
  data: ActivityData[];
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColorIntensity(count: number, maxCount: number): string {
  if (count === 0) return 'bg-gray-100';
  const intensity = Math.ceil((count / maxCount) * 4);
  switch (intensity) {
    case 1: return 'bg-green-200';
    case 2: return 'bg-green-300';
    case 3: return 'bg-green-400';
    case 4: return 'bg-green-500';
    default: return 'bg-green-500';
  }
}

export function ActivityHeatmap({ data, className = '' }: ActivityHeatmapProps) {
  const { weeks, maxCount, monthLabels, totalActivity } = useMemo(() => {
    // Create a map of date -> count
    const activityMap = new Map<string, number>();
    let max = 0;
    let total = 0;

    data.forEach(item => {
      activityMap.set(item.date, item.count);
      if (item.count > max) max = item.count;
      total += item.count;
    });

    // Generate the last 52 weeks of dates
    const today = new Date();
    const weeks: { date: Date; count: number }[][] = [];
    const labels: { month: string; weekIndex: number }[] = [];

    // Start from 52 weeks ago, on a Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Go back ~52 weeks
    // Adjust to previous Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; count: number }[] = [];
    let weekIndex = 0;
    let lastMonth = -1;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;

      currentWeek.push({
        date: new Date(currentDate),
        count,
      });

      // Check for month change for labels
      if (currentDate.getMonth() !== lastMonth && currentDate.getDay() === 0) {
        if (lastMonth !== -1 || weekIndex === 0) {
          labels.push({
            month: MONTHS[currentDate.getMonth()],
            weekIndex,
          });
        }
        lastMonth = currentDate.getMonth();
      }

      // If it's Saturday or we've reached today, push the week
      if (currentDate.getDay() === 6 || currentDate.toDateString() === today.toDateString()) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add any remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount: max, monthLabels: labels, totalActivity: total };
  }, [data]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {totalActivity} contributions in the last year
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{
                  position: 'relative',
                  left: `${label.weekIndex * 13}px`,
                  width: '40px',
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-around pr-2 text-xs text-muted-foreground">
              <span className="h-3">{DAYS[1]}</span>
              <span className="h-3">{DAYS[3]}</span>
              <span className="h-3">{DAYS[5]}</span>
            </div>

            {/* Grid */}
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {/* Fill empty days at the start of the first week */}
                    {weekIndex === 0 && week[0]?.date.getDay() > 0 && (
                      Array(week[0].date.getDay()).fill(null).map((_, i) => (
                        <div key={`empty-${i}`} className="w-[10px] h-[10px]" />
                      ))
                    )}
                    {week.map((day, dayIndex) => (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-[10px] h-[10px] rounded-sm cursor-pointer ${getColorIntensity(day.count, maxCount)} hover:ring-1 hover:ring-gray-400`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">
                            {day.count} contribution{day.count !== 1 ? 's' : ''} on {formatDate(day.date)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-[10px] h-[10px] rounded-sm bg-gray-100" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-200" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-300" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-400" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
