import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, favoritesApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Plus,
  FolderKanban,
  Calendar,
  Star,
  Crown,
  Filter,
  X,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProjectWithMembers } from '../types';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  planning: 'secondary',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  cancelled: 'destructive',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'date_asc', label: 'Due Date (Earliest)' },
  { value: 'date_desc', label: 'Due Date (Latest)' },
  { value: 'progress_asc', label: 'Progress (Low-High)' },
  { value: 'progress_desc', label: 'Progress (High-Low)' },
  { value: 'status', label: 'Status' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [headFilter, setHeadFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name_asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];

    // Load projects
    try {
      const projectsData = await projectApi.getAll();
      console.log('Projects loaded:', projectsData.length);
      setProjects(projectsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load projects:', msg);
      errors.push(`Projects: ${msg}`);
    }

    // Load favorites
    try {
      const favoritesData = await favoritesApi.getUserFavorites();
      console.log('Favorites loaded:', favoritesData);
      setFavorites(favoritesData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load favorites:', msg);
      errors.push(`Favorites: ${msg}`);
    }

    if (errors.length > 0) {
      setError(errors.join(' | '));
    }

    setLoading(false);
  };

  // Extract unique filter options from projects
  const filterOptions = useMemo(() => {
    const domains = new Set<string>();
    const heads = new Set<string>();
    const years = new Set<string>();

    projects.forEach(project => {
      if (project.domain) domains.add(project.domain.trim());
      if (project.head) heads.add(project.head.trim());
      if (project.start_date) {
        const year = new Date(project.start_date).getFullYear().toString();
        years.add(year);
      }
      if (project.end_date) {
        const year = new Date(project.end_date).getFullYear().toString();
        years.add(year);
      }
    });

    return {
      domains: Array.from(domains).sort(),
      heads: Array.from(heads).sort(),
      years: Array.from(years).sort().reverse(),
    };
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    // First filter
    const filtered = projects.filter(project => {
      // Search filter - check name, description, domain, head
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.domain?.toLowerCase().includes(query) ||
          project.head?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (domainFilter !== 'all' && project.domain?.trim() !== domainFilter) return false;
      if (headFilter !== 'all' && project.head?.trim() !== headFilter) return false;
      if (statusFilter !== 'all' && project.status !== statusFilter) return false;
      if (yearFilter !== 'all') {
        const startYear = project.start_date ? new Date(project.start_date).getFullYear().toString() : null;
        const endYear = project.end_date ? new Date(project.end_date).getFullYear().toString() : null;
        if (startYear !== yearFilter && endYear !== yearFilter) return false;
      }
      return true;
    });

    // Then sort
    const getProgress = (p: ProjectWithMembers) => {
      if (!p.task_count || p.task_count === 0) return 0;
      return (p.completed_tasks || 0) / p.task_count;
    };

    const statusOrder = ['active', 'planning', 'on_hold', 'completed', 'cancelled'];

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_asc':
          return (a.end_date || '9999').localeCompare(b.end_date || '9999');
        case 'date_desc':
          return (b.end_date || '0000').localeCompare(a.end_date || '0000');
        case 'progress_asc':
          return getProgress(a) - getProgress(b);
        case 'progress_desc':
          return getProgress(b) - getProgress(a);
        case 'status':
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, domainFilter, headFilter, statusFilter, yearFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || domainFilter !== 'all' || headFilter !== 'all' || statusFilter !== 'all' || yearFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDomainFilter('all');
    setHeadFilter('all');
    setStatusFilter('all');
    setYearFilter('all');
  };

  const toggleFavorite = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    try {
      if (favorites.includes(projectId)) {
        await favoritesApi.removeFavorite(projectId);
        setFavorites(favorites.filter(id => id !== projectId));
      } else {
        await favoritesApi.addFavorite(projectId);
        setFavorites([...favorites, projectId]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getProjectProgress = (project: ProjectWithMembers) => {
    if (!project.task_count || project.task_count === 0) return 0;
    return Math.round(((project.completed_tasks || 0) / project.task_count) * 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const favoriteProjects = filteredProjects.filter(p => favorites.includes(p.id));
  const allProjects = filteredProjects;

  // Square Project Card Component
  const ProjectCard = ({ project }: { project: ProjectWithMembers }) => {
    const isFavorite = favorites.includes(project.id);
    const members = project.members || [];
    const displayMembers = members.slice(0, 3);
    const remainingCount = members.length - 3;

    return (
      <div
        className="bg-muted/50 aspect-square rounded-xl p-4 cursor-pointer hover:bg-muted/80 transition-all hover:scale-[1.02] flex flex-col relative group"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        {/* Top Row: Color dot + Favorite */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 transition-opacity ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => toggleFavorite(e, project.id)}
          >
            <Star
              className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
            />
          </Button>
        </div>

        {/* Project Name */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 flex-shrink-0">
          {project.name}
        </h3>

        {/* Status Badge */}
        <Badge variant={statusColors[project.status] || 'default'} className="text-xs w-fit mb-2">
          {project.status.replace('_', ' ')}
        </Badge>

        {/* Domain & Head */}
        {(project.domain || project.head) && (
          <div className="text-xs text-muted-foreground mb-1 line-clamp-1">
            {project.domain && <span>{project.domain}</span>}
            {project.domain && project.head && <span> • </span>}
            {project.head && <span>{project.head}</span>}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{getProjectProgress(project)}%</span>
          </div>
          <Progress value={getProjectProgress(project)} className="h-1.5" />
        </div>

        {/* Bottom Row: Date + Members */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.end_date)}</span>
          </div>

          {/* Team Members */}
          {members.length > 0 && (
            <TooltipProvider>
              <div className="flex -space-x-1.5">
                {displayMembers.map((member, index) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className="h-5 w-5 border border-background">
                          {member.avatar_url ? (
                            <AvatarImage src={member.avatar_url} alt={member.name} />
                          ) : null}
                          <AvatarFallback className="text-[8px]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.role === 'lead' && index === 0 && (
                          <Crown className="absolute -top-1 -right-1 h-2 w-2 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{member.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {remainingCount > 0 && (
                  <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                    <span className="text-[8px] text-muted-foreground">+{remainingCount}</span>
                  </div>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl" role="alert">
          <strong className="font-bold">Error loading data: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* ======================= SEARCH & FILTERS ======================= */}
      {/* Original styling: className="bg-muted/30 rounded-xl p-4" */}
      <section className="mb-6 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
          {/* Search Bar */}
          <ButtonGroup className="flex-1 min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
            >
              {searchQuery ? 'Clear' : 'Search'}
            </Button>
          </ButtonGroup>

          <Separator orientation="vertical" className="hidden lg:block h-6" />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {filterOptions.domains.map(domain => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={headFilter} onValueChange={setHeadFilter}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Heads</SelectItem>
                {filterOptions.heads.map(head => (
                  <SelectItem key={head} value={head}>{head}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-9 w-[90px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {filterOptions.years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-xs shrink-0" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-6" />

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        )}
      </section>

      {/* ======================= SECTION 2: FAVOURITE PROJECTS ======================= */}
      {favoriteProjects.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-semibold">Favourite Projects</h2>
            <Badge variant="secondary" className="ml-1">{favoriteProjects.length}</Badge>
          </div>

          <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {favoriteProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* ======================= SECTION 3: ALL PROJECTS ======================= */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">All Projects</h2>
            <Badge variant="secondary" className="ml-1">{allProjects.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button size="sm" onClick={() => navigate('/projects/new')}>
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-muted/50 aspect-square rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : allProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                {hasActiveFilters ? 'No projects match the current filters' : 'No projects yet'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {/* Add New Project Card */}
            <div
              className="bg-muted/30 aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/projects/new')}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">New Project</p>
            </div>

            {/* Project Cards */}
            {allProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProjects.map((project) => {
                  const isFavorite = favorites.includes(project.id);
                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <TableCell>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[project.status] || 'default'} className="text-xs">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.domain || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{project.head || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={getProjectProgress(project)} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{getProjectProgress(project)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(project.end_date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => toggleFavorite(e, project.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
