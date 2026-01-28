import { useMemo, useState } from 'react';
import type { Milestone, Project, Task } from '../types';
import './MilestoneGanttChart.css';

interface MilestoneGanttChartProps {
  milestones: Milestone[];
  tasks: Task[];
  project: Project;
}

interface MonthInfo {
  label: string;
  days: number;
  date: Date;
}

const milestoneStatusColors: Record<string, string> = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  completed: '#22c55e',
};

const taskStatusColors: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
};

export function MilestoneGanttChart({ milestones, tasks, project }: MilestoneGanttChartProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set(milestones.map(m => m.id)));

  // Group tasks by milestone
  const tasksByMilestone = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    tasks.forEach(task => {
      if (task.milestone_id) {
        if (!grouped[task.milestone_id]) {
          grouped[task.milestone_id] = [];
        }
        grouped[task.milestone_id].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Toggle milestone expansion
  const toggleMilestone = (milestoneId: number) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  };

  // Calculate timeline range based on project dates, milestones, and tasks
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    // Get project dates as baseline
    const projectStart = project.start_date ? new Date(project.start_date) : new Date();
    const projectEnd = project.end_date ? new Date(project.end_date) : new Date();

    // Include all milestone and task dates
    const allDates = [projectStart, projectEnd];
    milestones.forEach(m => {
      if (m.start_date) allDates.push(new Date(m.start_date));
      if (m.due_date) allDates.push(new Date(m.due_date));
    });
    tasks.forEach(t => {
      if (t.start_date) allDates.push(new Date(t.start_date));
      if (t.due_date) allDates.push(new Date(t.due_date));
    });

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Pad to start of first month and end of last month
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);

    const diffTime = maxDate.getTime() - minDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Generate months for header
    const monthsList: MonthInfo[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      monthsList.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        days: daysInMonth,
        date: new Date(current)
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { startDate: minDate, endDate: maxDate, totalDays: diffDays, months: monthsList };
  }, [milestones, tasks, project]);

  // Calculate bar position and width for a milestone
  const getMilestoneBarStyle = (milestone: Milestone) => {
    const milestoneStart = milestone.start_date
      ? new Date(milestone.start_date)
      : (milestone.due_date ? new Date(milestone.due_date) : startDate);
    const milestoneEnd = milestone.due_date
      ? new Date(milestone.due_date)
      : milestoneStart;

    const startOffset = Math.max(0, Math.ceil((milestoneStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((milestoneEnd.getTime() - milestoneStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(1, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  // Calculate bar position and width for a task
  const getTaskBarStyle = (task: Task, parentMilestone: Milestone) => {
    // If task has dates, use them; otherwise fall back to milestone dates
    const taskStart = task.start_date
      ? new Date(task.start_date)
      : (parentMilestone.start_date ? new Date(parentMilestone.start_date) : startDate);
    const taskEnd = task.due_date
      ? new Date(task.due_date)
      : taskStart;

    const startOffset = Math.max(0, Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(0.5, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (milestones.length === 0) {
    return (
      <div className="milestone-gantt-empty">
        <p>No milestones with dates to display</p>
      </div>
    );
  }

  return (
    <div className="milestone-gantt-container">
      {/* Left Panel - Milestone List */}
      <div className="milestone-gantt-sidebar">
        <div className="milestone-gantt-sidebar-header">
          <span>Milestone / Task</span>
          <span className="header-status">Status</span>
        </div>
        <div className="milestone-gantt-sidebar-body">
          {milestones.map((milestone) => {
            const milestoneTasks = tasksByMilestone[milestone.id] || [];
            const isExpanded = expandedMilestones.has(milestone.id);
            const hasChildren = milestoneTasks.length > 0;

            return (
              <div key={milestone.id} className="milestone-group">
                <div
                  className={`milestone-gantt-sidebar-row ${hoveredMilestone === milestone.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {hasChildren && (
                    <button
                      className="expand-toggle"
                      onClick={() => toggleMilestone(milestone.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                  {!hasChildren && <span className="expand-placeholder" />}
                  <div
                    className="milestone-color-indicator"
                    style={{ backgroundColor: milestoneStatusColors[milestone.status] }}
                  />
                  <div className="milestone-info">
                    <span className="milestone-name" title={milestone.name}>{milestone.name}</span>
                    <span className="milestone-dates">
                      {formatDate(milestone.start_date)} - {formatDate(milestone.due_date)}
                    </span>
                  </div>
                  <div className={`status-dot ${milestone.status}`} title={milestone.status} />
                </div>

                {/* Task rows under milestone */}
                {isExpanded && milestoneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-gantt-sidebar-row"
                  >
                    <span className="task-indent" />
                    <div
                      className="task-color-indicator"
                      style={{ backgroundColor: taskStatusColors[task.status] }}
                    />
                    <div className="task-info">
                      <span className="task-name" title={task.name}>{task.name}</span>
                      <span className="task-dates">
                        {task.due_date ? formatDate(task.due_date) : 'No date'}
                      </span>
                    </div>
                    <div className={`status-dot task-status ${task.status}`} title={task.status} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Timeline */}
      <div className="milestone-gantt-timeline">
        {/* Timeline Header */}
        <div className="milestone-gantt-timeline-header">
          {months.map((month, index) => (
            <div
              key={index}
              className="milestone-timeline-month"
              style={{ width: `${(month.days / totalDays) * 100}%` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="milestone-gantt-timeline-body">
          {/* Grid lines */}
          <div className="milestone-timeline-grid">
            {months.map((month, index) => (
              <div
                key={index}
                className="milestone-timeline-grid-column"
                style={{ width: `${(month.days / totalDays) * 100}%` }}
              />
            ))}
          </div>

          {/* Today line */}
          {(() => {
            const today = new Date();
            if (today >= startDate && today <= endDate) {
              const dayOffset = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const leftPos = (dayOffset / totalDays) * 100;
              return <div className="milestone-today-line" style={{ left: `${leftPos}%` }} />;
            }
            return null;
          })()}

          {/* Milestone and Task Bars */}
          {milestones.map((milestone) => {
            const milestoneTasks = tasksByMilestone[milestone.id] || [];
            const isExpanded = expandedMilestones.has(milestone.id);

            return (
              <div key={milestone.id} className="milestone-timeline-group">
                {/* Milestone Bar Row */}
                <div
                  className={`milestone-gantt-timeline-row ${hoveredMilestone === milestone.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  <div
                    className={`milestone-gantt-bar ${milestone.status}`}
                    style={{
                      ...getMilestoneBarStyle(milestone),
                      backgroundColor: milestoneStatusColors[milestone.status]
                    }}
                  >
                    <div className="milestone-gantt-bar-content">
                      <span className="milestone-gantt-bar-label">{milestone.name}</span>
                    </div>
                    <div className="milestone-gantt-bar-tooltip">
                      <strong>{milestone.name}</strong>
                      {milestone.description && (
                        <p className="tooltip-description">{milestone.description}</p>
                      )}
                      <div className="tooltip-row">
                        <span className="tooltip-label">Start:</span> {formatDate(milestone.start_date)}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Due:</span> {formatDate(milestone.due_date)}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Status:</span>
                        <span className={`status-badge ${milestone.status}`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                      {milestoneTasks.length > 0 && (
                        <div className="tooltip-row">
                          <span className="tooltip-label">Tasks:</span> {milestoneTasks.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task Bar Rows */}
                {isExpanded && milestoneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-gantt-timeline-row"
                  >
                    {/* Connector line from milestone to task */}
                    <svg className="task-connector" style={{ left: getMilestoneBarStyle(milestone).left }}>
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="50%"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                        strokeDasharray="3,2"
                      />
                    </svg>
                    <div
                      className={`task-gantt-bar ${task.status}`}
                      style={{
                        ...getTaskBarStyle(task, milestone),
                        backgroundColor: taskStatusColors[task.status]
                      }}
                    >
                      <div className="task-gantt-bar-content">
                        <span className="task-gantt-bar-label">{task.name}</span>
                      </div>
                      <div className="task-gantt-bar-tooltip">
                        <strong>{task.name}</strong>
                        {task.description && (
                          <p className="tooltip-description">{task.description}</p>
                        )}
                        {task.start_date && (
                          <div className="tooltip-row">
                            <span className="tooltip-label">Start:</span> {formatDate(task.start_date)}
                          </div>
                        )}
                        {task.due_date && (
                          <div className="tooltip-row">
                            <span className="tooltip-label">Due:</span> {formatDate(task.due_date)}
                          </div>
                        )}
                        <div className="tooltip-row">
                          <span className="tooltip-label">Status:</span>
                          <span className={`status-badge ${task.status}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        {task.assignee_name && (
                          <div className="tooltip-row">
                            <span className="tooltip-label">Assignee:</span> {task.assignee_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
