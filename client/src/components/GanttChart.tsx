import { useState, useMemo } from 'react';
import type { LegacyProject } from '../types';
import './GanttChart.css';

interface GanttChartProps {
  projects: LegacyProject[];
  groupBy?: 'head' | 'domain';
}

interface MonthInfo {
  label: string;
  days: number;
  date: Date;
}

const GanttChart = ({ projects, groupBy = 'head' }: GanttChartProps) => {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group projects by the specified field
  const groupedProjects = useMemo(() => {
    const groups: Record<string, LegacyProject[]> = {};
    projects.forEach(project => {
      const key = project[groupBy] || 'Other';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(project);
    });
    return groups;
  }, [projects, groupBy]);

  // Calculate timeline range
  const { startDate, endDate, totalDays, months } = useMemo(() => {
    if (!projects.length) return { startDate: new Date(), endDate: new Date(), totalDays: 0, months: [] as MonthInfo[] };

    const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);

    const diffTime = maxDate.getTime() - minDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
  }, [projects]);

  // Calculate bar position and width
  const getBarStyle = (project: LegacyProject) => {
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);

    const startOffset = Math.ceil((projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: LegacyProject['status']) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      case 'in_progress':
        return <span className="status-badge in-progress">In Progress</span>;
      case 'not_started':
        return <span className="status-badge not-started">Not Started</span>;
      default:
        return null;
    }
  };

  const getBarColor = (project: LegacyProject) => {
    // Color based on completion status with head-specific hue
    const baseColor = project.headColor || project.color;
    switch (project.status) {
      case 'completed':
        return baseColor; // Full saturation
      case 'in_progress':
        return baseColor; // Same color, progress shown differently
      case 'not_started':
        return `${baseColor}99`; // Slightly transparent
      default:
        return baseColor;
    }
  };

  return (
    <div className="gantt-container">
      {/* Left Panel - Projects List */}
      <div className="gantt-sidebar">
        <div className="gantt-sidebar-header">
          <span>Project Name</span>
          <span className="header-status">Status</span>
        </div>
        <div className="gantt-sidebar-body">
          {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
            <div key={groupName} className="project-group">
              <div
                className="group-header"
                onClick={() => toggleGroup(groupName)}
                style={{ borderLeftColor: groupProjects[0]?.headColor }}
              >
                <span className="collapse-icon">
                  {collapsedGroups.has(groupName) ? '▶' : '▼'}
                </span>
                <span className="group-name">{groupName}</span>
                <span className="group-count">{groupProjects.length}</span>
              </div>
              {!collapsedGroups.has(groupName) && groupProjects.map((project) => (
                <div
                  key={project.id}
                  className={`gantt-sidebar-row ${hoveredProject === project.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <div
                    className="project-color-indicator"
                    style={{ backgroundColor: project.headColor }}
                  />
                  <div className="project-info">
                    <span className="project-name" title={project.name}>{project.name}</span>
                    <span className="project-domain">{project.domain}</span>
                  </div>
                  <div className={`status-dot ${project.status}`} title={project.status} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Timeline */}
      <div className="gantt-timeline">
        {/* Timeline Header */}
        <div className="gantt-timeline-header">
          {months.map((month, index) => (
            <div
              key={index}
              className="timeline-month"
              style={{ width: `${(month.days / totalDays) * 100}%` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="gantt-timeline-body">
          {/* Grid lines */}
          <div className="timeline-grid">
            {months.map((month, index) => (
              <div
                key={index}
                className="timeline-grid-column"
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
              return <div className="today-line" style={{ left: `${leftPos}%` }} />;
            }
            return null;
          })()}

          {/* Project Bars by Group */}
          {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
            <div key={groupName} className="timeline-group">
              <div className="timeline-group-header" />
              {!collapsedGroups.has(groupName) && groupProjects.map((project) => (
                <div
                  key={project.id}
                  className={`gantt-timeline-row ${hoveredProject === project.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <div
                    className={`gantt-bar ${project.status}`}
                    style={{
                      ...getBarStyle(project),
                      backgroundColor: getBarColor(project)
                    }}
                  >
                    {/* Progress fill */}
                    <div
                      className="gantt-bar-progress-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                    <div className="gantt-bar-content">
                      <span className="gantt-bar-label">{project.name}</span>
                    </div>
                    <div className="gantt-bar-tooltip">
                      <strong>{project.name}</strong>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Head:</span> {project.head}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Domain:</span> {project.domain}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Start:</span> {formatDate(project.startDate)}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">End:</span> {formatDate(project.endDate)}
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Status:</span> {getStatusBadge(project.status)}
                      </div>
                      {project.implemented && (
                        <div className="tooltip-details">
                          <span className="tooltip-label">Details:</span>
                          <p>{project.implemented.substring(0, 150)}{project.implemented.length > 150 ? '...' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
