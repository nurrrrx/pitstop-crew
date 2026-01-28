import * as XLSX from 'xlsx';
import type { LegacyProject, HeadInfo, DomainInfo } from '../types';

// Convert Excel serial date to JavaScript Date
const excelDateToJS = (serial: number | string | null | undefined): Date | null => {
  if (!serial || typeof serial === 'string') {
    // Try parsing string date formats
    if (typeof serial === 'string') {
      const parsed = new Date(serial);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
  // Excel epoch is January 1, 1900 (with a bug for 1900 leap year)
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date;
};

// Color palette for Heads
export const headColors: Record<string, string> = {
  'Zakariyah': '#3498db',  // Blue
  'Roberto': '#e74c3c',    // Red
  'Shivani': '#9b59b6',    // Purple
};

// Domain colors (used as secondary indicator)
export const domainColors: Record<string, string> = {
  'Finance': '#27ae60',
  'Marketing': '#f39c12',
  'Customer': '#1abc9c',
  'AI': '#8e44ad',
  'Data': '#2980b9',
  'Operations': '#d35400',
};

// Determine completion status from text
const getCompletionStatus = (implemented: string | undefined): LegacyProject['status'] => {
  if (!implemented) return 'not_started';
  const text = implemented.toLowerCase();
  if (text.includes('completed') || text.includes('delivered') || text.includes('implemented') || text.includes('live')) {
    return 'completed';
  }
  if (text.includes('in progress') || text.includes('work in progress') || text.includes('ongoing')) {
    return 'in_progress';
  }
  if (text.includes('not yet started') || text.includes('planned')) {
    return 'not_started';
  }
  // If there's any text, assume some progress
  return 'in_progress';
};

// Get progress percentage based on status
const getProgressFromStatus = (status: LegacyProject['status']): number => {
  switch (status) {
    case 'completed': return 100;
    case 'in_progress': return 50;
    case 'not_started': return 0;
    default: return 0;
  }
};

// Get color based on completion status
const getStatusColor = (head: string): string => {
  return headColors[head] || '#95a5a6';
};

// Parse the Excel file and return structured project data
export const parseProjectsFromExcel = async (filePath: string): Promise<LegacyProject[]> => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    // Skip header row
    const dataRows = rawData.slice(1);

    const projects: LegacyProject[] = [];
    let idCounter = 1;

    for (const row of dataRows) {
      const [, head, domain, projectName, phase, startDate, endDate, implemented, businessInteraction] = row as [
        unknown, string, string, string, string, number | string, number | string, string, string
      ];

      // Skip rows without essential data
      if (!projectName || !head) continue;

      const jsStartDate = excelDateToJS(startDate);
      const jsEndDate = excelDateToJS(endDate);

      // Skip projects without valid dates (ongoing projects)
      if (!jsStartDate || !jsEndDate) continue;

      const status = getCompletionStatus(implemented);
      const progress = getProgressFromStatus(status);

      // Create display name with phase if available
      const displayName = phase ? `${projectName} - ${phase}` : projectName;

      projects.push({
        id: idCounter++,
        name: displayName,
        projectName: projectName,
        phase: phase || null,
        head: head,
        domain: domain || 'Other',
        startDate: jsStartDate.toISOString().split('T')[0],
        endDate: jsEndDate.toISOString().split('T')[0],
        progress: progress,
        status: status,
        color: getStatusColor(head),
        headColor: headColors[head] || '#95a5a6',
        domainColor: domainColors[domain] || '#95a5a6',
        implemented: implemented || '',
        businessInteraction: businessInteraction || ''
      });
    }

    // Sort by head, then by start date
    projects.sort((a, b) => {
      if (a.head !== b.head) {
        return a.head.localeCompare(b.head);
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return projects;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return [];
  }
};

// Get unique heads from projects
export const getUniqueHeads = (projects: LegacyProject[]): HeadInfo[] => {
  const heads = [...new Set(projects.map(p => p.head))];
  return heads.map(head => ({
    name: head,
    color: headColors[head] || '#95a5a6'
  }));
};

// Get unique domains from projects
export const getUniqueDomains = (projects: LegacyProject[]): DomainInfo[] => {
  const domains = [...new Set(projects.map(p => p.domain))];
  return domains.map(domain => ({
    name: domain,
    color: domainColors[domain] || '#95a5a6'
  }));
};
