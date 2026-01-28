import { useState, useEffect } from 'react';
import GanttChart from '../components/GanttChart';
import { parseProjectsFromExcel, getUniqueHeads } from '../utils/projectData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LegacyProject, HeadInfo } from '../types';
import '../App.css';

export function DashboardPage() {
  const [projects, setProjects] = useState<LegacyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'head' | 'domain'>('head');
  const [heads, setHeads] = useState<HeadInfo[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await parseProjectsFromExcel('/projects.xlsx');
        setProjects(data);
        setHeads(getUniqueHeads(data));
        setError(null);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Group by:</label>
          <Select value={groupBy} onValueChange={(value: 'head' | 'domain') => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head">Head</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium">Team Leads:</span>
        {heads.map(head => (
          <div key={head.name} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: head.color }} />
            <span>{head.name}</span>
          </div>
        ))}
        <span className="text-muted-foreground">|</span>
        <span className="font-medium">Status:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span>Not Started</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="app-main">
        <GanttChart projects={projects} groupBy={groupBy} />
      </div>
    </div>
  );
}
