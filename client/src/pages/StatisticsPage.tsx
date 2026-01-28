import { useState, useEffect } from 'react';
import { statsApi } from '../services/api';
import {
  FolderKanban,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats } from '../types';

export function StatisticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await statsApi.getDashboard();
      setStats(statsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load stats:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Stat Card Component
  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
    description,
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description?: string;
  }) => (
    <div className="bg-muted/50 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon className={`h-7 w-7 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="text-4xl font-bold">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Dashboard Statistics</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl" role="alert">
          <strong className="font-bold">Error loading statistics: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-10 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Project Statistics */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              Project Overview
            </h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Projects"
                value={stats?.totalProjects || 0}
                icon={FolderKanban}
                color="text-blue-600"
                bgColor="bg-blue-100"
                description="All projects in the system"
              />
              <StatCard
                label="In Progress"
                value={stats?.inProgress || 0}
                icon={Clock}
                color="text-amber-600"
                bgColor="bg-amber-100"
                description="Active and planning projects"
              />
              <StatCard
                label="Completed YTD"
                value={stats?.closedYTD || 0}
                icon={CheckCircle2}
                color="text-green-600"
                bgColor="bg-green-100"
                description="Completed this year"
              />
              <StatCard
                label="Past Deadline"
                value={stats?.pastDeadlineNotDelivered || 0}
                icon={AlertTriangle}
                color="text-red-600"
                bgColor="bg-red-100"
                description="Overdue projects"
              />
            </div>
          </section>

          {/* Personal Statistics */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              My Statistics
            </h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="My Projects"
                value={stats?.projectsAssignedToMe || 0}
                icon={BarChart3}
                color="text-purple-600"
                bgColor="bg-purple-100"
                description="Projects I'm assigned to"
              />
              <StatCard
                label="My Tasks"
                value={stats?.tasksAssignedToMe || 0}
                icon={ListTodo}
                color="text-indigo-600"
                bgColor="bg-indigo-100"
                description="Total tasks assigned"
              />
              <StatCard
                label="Completed Tasks"
                value={stats?.myCompletedTasks || 0}
                icon={CheckCircle2}
                color="text-emerald-600"
                bgColor="bg-emerald-100"
                description="Tasks I've completed"
              />
              <StatCard
                label="Pending Tasks"
                value={stats?.myPendingTasks || 0}
                icon={ClipboardList}
                color="text-orange-600"
                bgColor="bg-orange-100"
                description="Tasks still to complete"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
