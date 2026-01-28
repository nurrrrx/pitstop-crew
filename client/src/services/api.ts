import type {
  User,
  AuthResponse,
  Project,
  CreateProjectData,
  ProjectMember,
  Milestone,
  CreateMilestoneData,
  Task,
  CreateTaskData,
  TimeEntry,
  CreateTimeEntryData,
  ProjectSummary,
  CrewMember,
  CreateCrewMemberData,
  CollaboratorInfo,
  MonthlyStats,
  CostPlan,
  AdHocRequest,
  CreateAdHocRequestData,
  RequestComment,
  AdHocStats,
  BudgetItem,
  CreateBudgetItemData,
  BudgetSummary,
  BudgetTotals,
  Stakeholder,
  CreateStakeholderData,
  ProjectFile,
  CreateProjectFileData,
  FileCategory,
  ActivityLog,
  TimeCalendarData,
  DashboardStats,
  UserProfile,
  UpdateProfileData,
  ActivityData,
  RegistrationRequest,
  ProjectWithMembers
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Get token from localStorage
const getToken = () => localStorage.getItem('pitstop_auth_token');

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  verifyToken: (token: string) =>
    apiRequest<{ user: User }>('/auth/verify', { token }),

  getCurrentUser: (token: string) =>
    apiRequest<{ user: User }>('/auth/me', { token }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string; resetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  validateResetToken: (token: string) =>
    apiRequest<{ valid: boolean }>(`/auth/validate-reset-token/${token}`),
};

export const projectApi = {
  getAll: () =>
    apiRequest<ProjectWithMembers[]>('/projects', { token: getToken() }),

  getMyProjects: () =>
    apiRequest<ProjectWithMembers[]>('/projects/my', { token: getToken() }),

  getById: (id: number) =>
    apiRequest<Project>(`/projects/${id}`, { token: getToken() }),

  create: (data: CreateProjectData) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  update: (id: number, data: Partial<CreateProjectData>) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/projects/${id}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Members
  getMembers: (projectId: number) =>
    apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, { token: getToken() }),

  addMember: (projectId: number, userId: number, role: string = 'member') =>
    apiRequest<void>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: { user_id: userId, role },
      token: getToken(),
    }),

  removeMember: (projectId: number, userId: number) =>
    apiRequest<void>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Summary
  getSummary: (projectId: number) =>
    apiRequest<ProjectSummary>(`/projects/${projectId}/summary`, { token: getToken() }),

  // Milestones
  getMilestones: (projectId: number) =>
    apiRequest<Milestone[]>(`/projects/${projectId}/milestones`, { token: getToken() }),

  createMilestone: (projectId: number, data: CreateMilestoneData) =>
    apiRequest<Milestone>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  updateMilestone: (projectId: number, milestoneId: number, data: Partial<CreateMilestoneData>) =>
    apiRequest<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  deleteMilestone: (projectId: number, milestoneId: number) =>
    apiRequest<void>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Time entries for a project
  getTimeEntries: (projectId: number) =>
    apiRequest<TimeEntry[]>(`/projects/${projectId}/time-entries`, { token: getToken() }),

  createTimeEntry: (projectId: number, data: Omit<CreateTimeEntryData, 'project_id'>) =>
    apiRequest<TimeEntry>(`/projects/${projectId}/time-entries`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  // Tasks
  getTasks: (projectId: number) =>
    apiRequest<Task[]>(`/projects/${projectId}/tasks`, { token: getToken() }),

  createTask: (projectId: number, data: CreateTaskData) =>
    apiRequest<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  updateTask: (projectId: number, taskId: number, data: Partial<CreateTaskData>) =>
    apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  updateTaskStatus: (projectId: number, taskId: number, status: Task['status']) =>
    apiRequest<Task>(`/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: { status },
      token: getToken(),
    }),

  deleteTask: (projectId: number, taskId: number) =>
    apiRequest<void>(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Budget Items
  getBudgetItems: (projectId: number) =>
    apiRequest<BudgetItem[]>(`/projects/${projectId}/budget-items`, { token: getToken() }),

  createBudgetItem: (projectId: number, data: CreateBudgetItemData) =>
    apiRequest<BudgetItem>(`/projects/${projectId}/budget-items`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  updateBudgetItem: (projectId: number, itemId: number, data: Partial<CreateBudgetItemData>) =>
    apiRequest<BudgetItem>(`/projects/${projectId}/budget-items/${itemId}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  deleteBudgetItem: (projectId: number, itemId: number) =>
    apiRequest<void>(`/projects/${projectId}/budget-items/${itemId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  getBudgetSummary: (projectId: number) =>
    apiRequest<{ summary: BudgetSummary[]; totals: BudgetTotals }>(`/projects/${projectId}/budget-summary`, { token: getToken() }),

  // Stakeholders
  getStakeholders: (projectId: number) =>
    apiRequest<Stakeholder[]>(`/projects/${projectId}/stakeholders`, { token: getToken() }),

  createStakeholder: (projectId: number, data: CreateStakeholderData) =>
    apiRequest<Stakeholder>(`/projects/${projectId}/stakeholders`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  updateStakeholder: (projectId: number, stakeholderId: number, data: Partial<CreateStakeholderData>) =>
    apiRequest<Stakeholder>(`/projects/${projectId}/stakeholders/${stakeholderId}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  deleteStakeholder: (projectId: number, stakeholderId: number) =>
    apiRequest<void>(`/projects/${projectId}/stakeholders/${stakeholderId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Project Files
  getFiles: (projectId: number, category?: FileCategory) => {
    const url = category
      ? `/projects/${projectId}/files?category=${category}`
      : `/projects/${projectId}/files`;
    return apiRequest<ProjectFile[]>(url, { token: getToken() });
  },

  createFile: (projectId: number, data: CreateProjectFileData) =>
    apiRequest<ProjectFile>(`/projects/${projectId}/files`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  updateFileCategory: (projectId: number, fileId: number, category: FileCategory) =>
    apiRequest<ProjectFile>(`/projects/${projectId}/files/${fileId}`, {
      method: 'PUT',
      body: { category },
      token: getToken(),
    }),

  deleteFile: (projectId: number, fileId: number) =>
    apiRequest<void>(`/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  // Activity Log
  getActivityLog: (projectId: number, options?: { entity_type?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.entity_type) params.append('entity_type', options.entity_type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    const queryString = params.toString();
    return apiRequest<{ logs: ActivityLog[]; total: number }>(
      `/projects/${projectId}/activity-log${queryString ? `?${queryString}` : ''}`,
      { token: getToken() }
    );
  },

  // Time Calendar
  getTimeCalendar: (projectId: number, weekStart: string) =>
    apiRequest<TimeCalendarData>(`/projects/${projectId}/time-calendar?weekStart=${weekStart}`, { token: getToken() }),
};

export const timeApi = {
  getMyTimeEntries: (startDate?: string, endDate?: string) => {
    let url = '/time/my';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return apiRequest<TimeEntry[]>(url, { token: getToken() });
  },

  create: (data: CreateTimeEntryData) =>
    apiRequest<TimeEntry>('/time', {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/time/${id}`, {
      method: 'DELETE',
      token: getToken(),
    }),
};

export const userApi = {
  getAll: () =>
    apiRequest<User[]>('/users', { token: getToken() }),

  getById: (id: number) =>
    apiRequest<User>(`/users/${id}`, { token: getToken() }),

  getProfile: () =>
    apiRequest<UserProfile>('/users/profile', { token: getToken() }),

  updateProfile: (data: UpdateProfileData) =>
    apiRequest<UserProfile>('/users/profile', {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  getActivityHeatmap: (userId: number) =>
    apiRequest<ActivityData[]>(`/users/${userId}/activity-heatmap`, { token: getToken() }),
};

export const crewApi = {
  getAll: (type?: 'fte' | 'contractor', includeInactive?: boolean) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (includeInactive) params.append('includeInactive', 'true');
    const queryString = params.toString();
    return apiRequest<CrewMember[]>(`/crew${queryString ? `?${queryString}` : ''}`, { token: getToken() });
  },

  getById: (id: number) =>
    apiRequest<CrewMember>(`/crew/${id}`, { token: getToken() }),

  create: (data: CreateCrewMemberData) =>
    apiRequest<CrewMember>('/crew', {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  update: (id: number, data: Partial<CreateCrewMemberData>) =>
    apiRequest<CrewMember>(`/crew/${id}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  archive: (id: number, endDate?: string) =>
    apiRequest<void>(`/crew/${id}/archive`, {
      method: 'POST',
      body: { end_date: endDate },
      token: getToken(),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/crew/${id}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  reactivate: (id: number) =>
    apiRequest<void>(`/crew/${id}/reactivate`, {
      method: 'POST',
      token: getToken(),
    }),

  getProjects: (id: number) =>
    apiRequest<{ id: number; name: string; status: string; role: string; hours: number }[]>(
      `/crew/${id}/projects`,
      { token: getToken() }
    ),

  getCollaborators: (id: number) =>
    apiRequest<CollaboratorInfo[]>(`/crew/${id}/collaborators`, { token: getToken() }),

  getMonthlyStats: (id: number, year?: number) =>
    apiRequest<MonthlyStats[]>(
      `/crew/${id}/monthly-stats${year ? `?year=${year}` : ''}`,
      { token: getToken() }
    ),

  getAverageCost: (id: number) =>
    apiRequest<{ average_hours: number; average_projects: number }>(
      `/crew/${id}/average-cost`,
      { token: getToken() }
    ),

  getCostPlans: (id: number, year?: number) =>
    apiRequest<CostPlan[]>(
      `/crew/${id}/cost-plans${year ? `?year=${year}` : ''}`,
      { token: getToken() }
    ),

  upsertCostPlan: (id: number, data: { year: number; month: number; planned_hours?: number; planned_rate?: number; actual_hours?: number; actual_cost?: number; notes?: string }) =>
    apiRequest<CostPlan>(`/crew/${id}/cost-plans`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  getChargeability: (id: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return apiRequest<{ billable_hours: number; total_hours: number; chargeability: number }>(
      `/crew/${id}/chargeability${queryString ? `?${queryString}` : ''}`,
      { token: getToken() }
    );
  },
};

export const adhocApi = {
  getAll: (filters?: { status?: string; assigned_to?: number; requestor?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
    if (filters?.requestor) params.append('requestor', filters.requestor);
    const queryString = params.toString();
    return apiRequest<AdHocRequest[]>(`/adhoc${queryString ? `?${queryString}` : ''}`, { token: getToken() });
  },

  getById: (id: number) =>
    apiRequest<AdHocRequest>(`/adhoc/${id}`, { token: getToken() }),

  create: (data: CreateAdHocRequestData) =>
    apiRequest<AdHocRequest>('/adhoc', {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  update: (id: number, data: Partial<CreateAdHocRequestData> & { actual_hours?: number }) =>
    apiRequest<AdHocRequest>(`/adhoc/${id}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/adhoc/${id}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  getComments: (id: number) =>
    apiRequest<RequestComment[]>(`/adhoc/${id}/comments`, { token: getToken() }),

  addComment: (id: number, comment: string) =>
    apiRequest<RequestComment>(`/adhoc/${id}/comments`, {
      method: 'POST',
      body: { comment },
      token: getToken(),
    }),

  getStats: () =>
    apiRequest<AdHocStats>('/adhoc/stats', { token: getToken() }),
};

export const favoritesApi = {
  getUserFavorites: () =>
    apiRequest<number[]>('/favorites', { token: getToken() }),

  addFavorite: (projectId: number) =>
    apiRequest<void>(`/favorites/${projectId}`, {
      method: 'POST',
      token: getToken(),
    }),

  removeFavorite: (projectId: number) =>
    apiRequest<void>(`/favorites/${projectId}`, {
      method: 'DELETE',
      token: getToken(),
    }),
};

export const statsApi = {
  getDashboard: () =>
    apiRequest<DashboardStats>('/stats/dashboard', { token: getToken() }),
};

export const adminApi = {
  getRegistrationRequests: (status?: string) => {
    const url = status ? `/admin/registration-requests?status=${status}` : '/admin/registration-requests';
    return apiRequest<RegistrationRequest[]>(url, { token: getToken() });
  },

  approveRequest: (id: number) =>
    apiRequest<{ message: string; user: User }>(`/admin/registration-requests/${id}/approve`, {
      method: 'POST',
      token: getToken(),
    }),

  rejectRequest: (id: number, reason: string) =>
    apiRequest<{ message: string }>(`/admin/registration-requests/${id}/reject`, {
      method: 'POST',
      body: { reason },
      token: getToken(),
    }),
};

// ADO Budget types
export interface ADOBudgetItem {
  id: number;
  year: number;
  item_name: string;
  budget_aed: number;
  capex: number;
  opex: number;
  category: string;
  sort_order: number;
}

export interface ADOBudgetSummary {
  items: ADOBudgetItem[];
  totals: {
    total_aed: number;
    total_capex: number;
    total_opex: number;
    fte_aed: number;
    fte_capex: number;
    fte_opex: number;
    total_cost: number;
    total_cost_capex: number;
    total_cost_opex: number;
  };
}

export interface RatesReference {
  bands: {
    G: { monthly: number; label: string };
    H: { monthly: number; label: string };
    I: { monthly: number; label: string };
  };
  rateCategories: {
    A: { daily: number; monthly: number; label: string };
    AA: { daily: number; monthly: number; label: string };
    AAA: { daily: number; monthly: number; label: string };
    AAAA: { daily: number; monthly: number; label: string };
  };
}

export const budgetApi = {
  getADOBudget: (year: number) =>
    apiRequest<ADOBudgetSummary>(`/budget/ado/${year}`, { token: getToken() }),

  updateADOBudgetItem: (id: number, data: Partial<ADOBudgetItem>) =>
    apiRequest<ADOBudgetItem>(`/budget/ado/${id}`, {
      method: 'PUT',
      body: data,
      token: getToken(),
    }),

  createADOBudgetItem: (data: Partial<ADOBudgetItem>) =>
    apiRequest<ADOBudgetItem>('/budget/ado', {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  deleteADOBudgetItem: (id: number) =>
    apiRequest<void>(`/budget/ado/${id}`, {
      method: 'DELETE',
      token: getToken(),
    }),

  getRates: () =>
    apiRequest<RatesReference>('/budget/rates', { token: getToken() }),
};
