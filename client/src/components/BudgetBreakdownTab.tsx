import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2, Edit2, Users, Monitor, Briefcase, Database, Server, MoreHorizontal } from 'lucide-react';
import { projectApi } from '../services/api';
import type { BudgetItem, BudgetSummary, BudgetTotals, BudgetCategory, CreateBudgetItemData } from '../types';

interface BudgetBreakdownTabProps {
  projectId: number;
  projectBudget: number;
}

const CATEGORY_CONFIG: Record<BudgetCategory, { label: string; icon: React.ElementType; color: string }> = {
  people_cost_fte: { label: 'People Cost (FTE)', icon: Users, color: '#3b82f6' },
  people_cost_contractor: { label: 'People Cost (Contractors)', icon: Users, color: '#8b5cf6' },
  licenses: { label: 'Licenses & Subscriptions', icon: Monitor, color: '#10b981' },
  external_consulting: { label: 'External Consulting', icon: Briefcase, color: '#f59e0b' },
  external_data: { label: 'External Data Costs', icon: Database, color: '#ef4444' },
  infrastructure: { label: 'Infrastructure', icon: Server, color: '#06b6d4' },
  other: { label: 'Other', icon: MoreHorizontal, color: '#6b7280' },
};

const CATEGORIES: BudgetCategory[] = [
  'people_cost_fte',
  'people_cost_contractor',
  'licenses',
  'external_consulting',
  'external_data',
  'infrastructure',
  'other'
];

export function BudgetBreakdownTab({ projectId, projectBudget }: BudgetBreakdownTabProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary[]>([]);
  const [totals, setTotals] = useState<BudgetTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<CreateBudgetItemData>({
    category: 'other',
    name: '',
    description: '',
    estimated_cost: 0,
    actual_cost: 0,
  });

  useEffect(() => {
    loadBudgetData();
  }, [projectId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [itemsData, summaryData] = await Promise.all([
        projectApi.getBudgetItems(projectId),
        projectApi.getBudgetSummary(projectId),
      ]);
      setBudgetItems(itemsData);
      setSummary(summaryData.summary);
      setTotals(summaryData.totals);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingItem) {
        await projectApi.updateBudgetItem(projectId, editingItem.id, formData);
      } else {
        await projectApi.createBudgetItem(projectId, formData);
      }
      resetForm();
      loadBudgetData();
    } catch (error) {
      console.error('Failed to save budget item:', error);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Delete this budget item?')) return;
    try {
      await projectApi.deleteBudgetItem(projectId, itemId);
      loadBudgetData();
    } catch (error) {
      console.error('Failed to delete budget item:', error);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      description: item.description || '',
      estimated_cost: item.estimated_cost,
      actual_cost: item.actual_cost,
      start_date: item.start_date || undefined,
      end_date: item.end_date || undefined,
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      name: '',
      description: '',
      estimated_cost: 0,
      actual_cost: 0,
    });
    setEditingItem(null);
    setIsAddDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getItemsByCategory = (category: BudgetCategory) => {
    return budgetItems.filter(item => item.category === category);
  };

  const getCategorySummary = (category: BudgetCategory) => {
    return summary.find(s => s.category === category) || {
      category,
      estimated_total: 0,
      actual_total: 0,
      item_count: 0
    };
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading budget data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500 mb-1">Project Budget</div>
            <div className="text-2xl font-bold">{formatCurrency(projectBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500 mb-1">Total Estimated</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals?.total_estimated || 0)}
            </div>
            <div className="text-xs text-gray-500">
              {projectBudget > 0 ? (
                ((totals?.total_estimated || 0) / projectBudget * 100).toFixed(1) + '% of budget'
              ) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500 mb-1">Total Actual</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals?.total_actual || 0)}
            </div>
            <div className="text-xs text-gray-500">
              {(totals?.total_estimated || 0) > 0 ? (
                ((totals?.total_actual || 0) / (totals?.total_estimated || 1) * 100).toFixed(1) + '% of estimated'
              ) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as BudgetCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Senior Developer, AWS Subscription"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.estimated_cost || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.actual_cost || ''}
                    onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                  {editingItem ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Categories Accordion */}
      <Accordion type="multiple" defaultValue={CATEGORIES} className="space-y-2">
        {CATEGORIES.map((category) => {
          const config = CATEGORY_CONFIG[category];
          const categorySummary = getCategorySummary(category);
          const items = getItemsByCategory(category);
          const Icon = config.icon;

          return (
            <AccordionItem key={category} value={category} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500">
                        {categorySummary.item_count} item{categorySummary.item_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium" style={{ color: config.color }}>
                      {formatCurrency(categorySummary.estimated_total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Actual: {formatCurrency(categorySummary.actual_total)}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No items in this category
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatCurrency(item.estimated_cost)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Actual: {formatCurrency(item.actual_cost)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
