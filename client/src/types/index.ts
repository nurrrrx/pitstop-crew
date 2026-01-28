// Legacy Project type for Excel data (Gantt chart)
export interface LegacyProject {
  id: number;
  name: string;
  projectName: string;
  phase: string | null;
  head: string;
  domain: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'not_started';
  color: string;
  headColor: string;
  domainColor: string;
  implemented: string;
  businessInteraction: string;
}

// Database-backed Project type
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  owner_id: number | null;
  color: string;
  created_at: string;
  updated_at: string;
  // Fields from Excel import
  head?: string | null;
  domain?: string | null;
  phase?: string | null;
  implemented?: string | null;
  business_interaction?: string | null;
  // Joined fields
  owner_name?: string;
  member_count?: number;
  task_count?: number;
  completed_tasks?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  start_date?: string;
  end_date?: string;
  budget?: number;
  color?: string;
  members?: number[];
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  added_at: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneData {
  name: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  status?: Milestone['status'];
}

export interface Task {
  id: number;
  project_id: number;
  milestone_id: number | null;
  assignee_id: number | null;
  name: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  milestone_name?: string;
}

export interface CreateTaskData {
  name: string;
  description?: string;
  milestone_id?: number;
  assignee_id?: number;
  status?: Task['status'];
  priority?: Task['priority'];
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
}

export interface TimeEntry {
  id: number;
  project_id: number;
  user_id: number;
  hours: number;
  description: string | null;
  date: string;
  billable: boolean;
  hourly_rate: number | null;
  created_at: string;
  // Joined fields
  user_name?: string;
  project_name?: string;
}

export interface CreateTimeEntryData {
  project_id: number;
  hours: number;
  description?: string;
  date: string;
  billable?: boolean;
  hourly_rate?: number;
}

export interface ProjectSummary {
  total_hours: number;
  total_cost: number;
  contributors: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string;
  hourly_rate?: number;
  is_admin?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface HeadInfo {
  name: string;
  color: string;
}

export interface DomainInfo {
  name: string;
  color: string;
}

// Band types for FTE cost calculation
export type FTEBand = 'G' | 'H' | 'I';

// Rate category types for consultants
export type RateCategory = 'A' | 'AA' | 'AAA' | 'AAAA';

// Band costs (monthly)
export const BAND_COSTS: Record<FTEBand, number> = {
  G: 10000,
  H: 20000,
  I: 30000,
};

// Rate category costs (daily / monthly)
export const RATE_CATEGORY_COSTS: Record<RateCategory, { daily: number; monthly: number }> = {
  A: { daily: 1000, monthly: 21000 },
  AA: { daily: 1500, monthly: 31500 },
  AAA: { daily: 2000, monthly: 42000 },
  AAAA: { daily: 3000, monthly: 63000 },
};

// Crew types
export interface CrewMember {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  hourly_rate: number;
  employment_type: 'fte' | 'contractor';
  department: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  total_hours?: number;
  total_projects?: number;
  current_projects?: number;
  chargeability?: number;
  // New fields for cost calculation
  band?: FTEBand | null; // For FTE
  rate_category?: RateCategory | null; // For consultants
  daily_rate?: number;
  monthly_rate?: number;
}

export interface CreateCrewMemberData {
  email: string;
  name: string;
  password?: string;
  role?: string;
  hourly_rate?: number;
  employment_type?: 'fte' | 'contractor';
  department?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  // New fields for cost calculation
  band?: FTEBand;
  rate_category?: RateCategory;
  daily_rate?: number;
  monthly_rate?: number;
}

export interface CollaboratorInfo {
  user_id: number;
  name: string;
  projects_together: number;
  hours_together: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  hours: number;
  cost: number;
  projects: number;
}

export interface CostPlan {
  id: number;
  user_id: number;
  year: number;
  month: number;
  planned_hours: number;
  planned_rate: number;
  actual_hours: number;
  actual_cost: number;
  notes: string | null;
}

// Ad-hoc request types
export interface AdHocRequest {
  id: number;
  title: string;
  description: string | null;
  requestor_name: string;
  requestor_email: string | null;
  requestor_department: string | null;
  assigned_to: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  project_id: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  project_name?: string;
  comment_count?: number;
}

export interface CreateAdHocRequestData {
  title: string;
  description?: string;
  requestor_name: string;
  requestor_email?: string;
  requestor_department?: string;
  assigned_to?: number;
  priority?: AdHocRequest['priority'];
  status?: AdHocRequest['status'];
  due_date?: string;
  estimated_hours?: number;
  project_id?: number;
}

export interface RequestComment {
  id: number;
  request_id: number;
  user_id: number | null;
  comment: string;
  created_at: string;
  user_name?: string;
}

export interface AdHocStats {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
}

// Budget Item types
export type BudgetCategory = 'people_cost_fte' | 'people_cost_contractor' | 'licenses' | 'external_consulting' | 'external_data' | 'infrastructure' | 'other';

export interface BudgetItem {
  id: number;
  project_id: number;
  category: BudgetCategory;
  name: string;
  description: string | null;
  estimated_cost: number;
  actual_cost: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetItemData {
  category: BudgetCategory;
  name: string;
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: string;
  end_date?: string;
}

export interface BudgetSummary {
  category: BudgetCategory;
  estimated_total: number;
  actual_total: number;
  item_count: number;
}

export interface BudgetTotals {
  total_estimated: number;
  total_actual: number;
  total_items: number;
}

// Stakeholder types
export type StakeholderRole = 'sponsor' | 'business_owner' | 'steering_committee' | 'subject_matter_expert' | 'end_user' | 'other';

export interface Stakeholder {
  id: number;
  project_id: number;
  user_id: number | null;
  external_name: string | null;
  external_email: string | null;
  external_organization: string | null;
  role: StakeholderRole;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

export interface CreateStakeholderData {
  user_id?: number;
  external_name?: string;
  external_email?: string;
  external_organization?: string;
  role: StakeholderRole;
  is_primary?: boolean;
  notes?: string;
}

// Project File types
export type FileCategory = 'business_case' | 'proposal' | 'charter' | 'budget' | 'status_report' | 'design' | 'other';

export interface ProjectFile {
  id: number;
  project_id: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: FileCategory;
  uploaded_by: number | null;
  uploaded_at: string;
  // Joined fields
  uploader_name?: string;
}

export interface CreateProjectFileData {
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  category?: FileCategory;
}

// Activity Log types
export type EntityType = 'project' | 'task' | 'milestone' | 'member' | 'stakeholder' | 'budget_item' | 'file';
export type ActionType = 'created' | 'updated' | 'deleted' | 'status_changed';

export interface ActivityLog {
  id: number;
  project_id: number;
  entity_type: EntityType;
  entity_id: number;
  action: ActionType;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by: number | null;
  performed_at: string;
  metadata: Record<string, unknown> | null;
  // Joined fields
  performer_name?: string;
}

// Time Calendar types
export interface TimeCalendarDay {
  date: string;
  hours: number;
}

export interface TimeCalendarMember {
  user_id: number;
  user_name: string;
  days: TimeCalendarDay[];
  week_total: number;
}

export interface TimeCalendarData {
  week_start: string;
  week_end: string;
  members: TimeCalendarMember[];
}

// Dashboard Stats types
export interface DashboardStats {
  totalProjects: number;
  closedYTD: number;
  inProgress: number;
  pastDeadlineNotDelivered: number;
  projectsAssignedToMe: number;
  tasksAssignedToMe: number;
  myCompletedTasks: number;
  myPendingTasks: number;
}

// User Profile types
export interface UserProfile extends User {
  bio?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  employment_type?: string;
  department?: string;
  title?: string;
  start_date?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  department?: string;
  title?: string;
}

// Activity Heatmap types
export interface ActivityData {
  date: string;
  count: number;
}

// Registration Request types
export interface RegistrationRequest {
  id: number;
  email: string;
  name: string;
  department?: string;
  title?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewer_name?: string;
}

// Project with members for cards
export interface ProjectWithMembers extends Project {
  members?: {
    id: number;
    name: string;
    avatar_url?: string;
    role: string;
  }[];
}
