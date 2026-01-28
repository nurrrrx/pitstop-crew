import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { projectApi } from '../services/api';
import type { TimeCalendarData } from '../types';

interface TimeLogCalendarProps {
  projectId: number;
}

export function TimeLogCalendar({ projectId }: TimeLogCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [calendarData, setCalendarData] = useState<TimeCalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, [weekStart, projectId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const data = await projectApi.getTimeCalendar(projectId, weekStartStr);
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load time calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: new Date().toDateString() === date.toDateString()
      });
    }
    return days;
  }, [weekStart]);

  const goToPreviousWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStart(monday);
  };

  const getHoursForDay = (memberId: number, date: Date): number => {
    if (!calendarData) return 0;
    const member = calendarData.members.find(m => m.user_id === memberId);
    if (!member) return 0;
    const dateStr = date.toISOString().split('T')[0];
    const dayData = member.days.find(d => d.date === dateStr);
    return dayData?.hours || 0;
  };

  const getHourCellStyle = (hours: number): string => {
    if (hours === 0) return 'bg-gray-50 text-gray-300';
    if (hours < 4) return 'bg-blue-100 text-blue-700';
    if (hours < 8) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-500 text-white font-semibold';
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (loading && !calendarData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading calendar...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-medium text-gray-600">
          {formatWeekRange()}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 border-b font-medium text-sm text-gray-600 min-w-[150px]">
                Team Member
              </th>
              {weekDays.map((day, index) => (
                <th
                  key={index}
                  className={`text-center p-3 border-b border-l font-medium text-sm ${
                    day.isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <div>{day.dayName}</div>
                  <div className={`text-lg ${day.isToday ? 'font-bold' : ''}`}>{day.dayNum}</div>
                </th>
              ))}
              <th className="text-center p-3 border-b border-l font-medium text-sm text-gray-600 bg-gray-100">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {(!calendarData || calendarData.members.length === 0) ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  No time entries for this week
                </td>
              </tr>
            ) : (
              calendarData.members.map((member) => (
                <tr key={member.user_id} className="hover:bg-gray-50">
                  <td className="p-3 border-b font-medium text-sm">
                    {member.user_name}
                  </td>
                  {weekDays.map((day, index) => {
                    const hours = getHoursForDay(member.user_id, day.date);
                    return (
                      <td
                        key={index}
                        className={`text-center p-3 border-b border-l ${getHourCellStyle(hours)}`}
                      >
                        {hours > 0 ? hours.toFixed(1) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-center p-3 border-b border-l font-semibold bg-gray-100">
                    {member.week_total.toFixed(1)}h
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {calendarData && calendarData.members.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="p-3 border-b text-sm text-gray-600">
                  Daily Total
                </td>
                {weekDays.map((day, index) => {
                  const dayTotal = calendarData.members.reduce(
                    (sum, m) => sum + getHoursForDay(m.user_id, day.date),
                    0
                  );
                  return (
                    <td
                      key={index}
                      className="text-center p-3 border-b border-l text-sm"
                    >
                      {dayTotal > 0 ? dayTotal.toFixed(1) : '-'}
                    </td>
                  );
                })}
                <td className="text-center p-3 border-b border-l font-bold bg-gray-200">
                  {calendarData.members.reduce((sum, m) => sum + m.week_total, 0).toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Hours intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-50 border"></div>
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-100"></div>
          <span>1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-300"></div>
          <span>4-7</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>8+</span>
        </div>
      </div>
    </div>
  );
}
