import { useState, useEffect } from 'react';
import { budgetApi, type ADOBudgetItem, type ADOBudgetSummary } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, Building } from 'lucide-react';

export function ADOBudgetPage() {
  const [budgetData, setBudgetData] = useState<ADOBudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ADOBudgetItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    budget_aed: 0,
    capex: 0,
    opex: 0,
    category: 'aed',
    sort_order: 0,
  });

  useEffect(() => {
    loadBudget();
  }, [selectedYear]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const data = await budgetApi.getADOBudget(selectedYear);
      setBudgetData(data);
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (item: ADOBudgetItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      budget_aed: item.budget_aed,
      capex: item.capex,
      opex: item.opex,
      category: item.category,
      sort_order: item.sort_order,
    });
    setShowEditDialog(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      budget_aed: 0,
      capex: 0,
      opex: 0,
      category: 'aed',
      sort_order: budgetData?.items.length || 0,
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        await budgetApi.updateADOBudgetItem(editingItem.id, formData);
      } else {
        await budgetApi.createADOBudgetItem({ ...formData, year: selectedYear });
      }
      setShowEditDialog(false);
      loadBudget();
    } catch (error) {
      console.error('Failed to save budget item:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return;
    try {
      await budgetApi.deleteADOBudgetItem(id);
      loadBudget();
    } catch (error) {
      console.error('Failed to delete budget item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading budget data...</p>
      </div>
    );
  }

  const aedItems = budgetData?.items.filter(item => item.category === 'aed') || [];
  const fteItems = budgetData?.items.filter(item => item.category === 'fte') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ADO Budget {selectedYear}</h1>
          <p className="text-muted-foreground">Annual budget breakdown by category (CAPEX / OPEX)</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget (AED)</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetData?.totals.total_cost || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total CAPEX</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetData?.totals.total_cost_capex || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total OPEX</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetData?.totals.total_cost_opex || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>ADO Budget {selectedYear} Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-yellow-100">
                <TableHead className="font-bold text-black">ADO Budget {selectedYear} Items</TableHead>
                <TableHead className="text-right font-bold text-black">Budget AED</TableHead>
                <TableHead className="text-right font-bold text-black">CAPEX</TableHead>
                <TableHead className="text-right font-bold text-black">OPEX</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* AED Items */}
              {aedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.budget_aed)}</TableCell>
                  <TableCell className="text-right">{item.capex > 0 ? formatCurrency(item.capex) : ''}</TableCell>
                  <TableCell className="text-right">{item.opex > 0 ? formatCurrency(item.opex) : ''}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
                  </TableCell>
                </TableRow>
              ))}

              {/* Total AED Row */}
              <TableRow className="bg-yellow-100 font-bold">
                <TableCell>Total AED</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_aed || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_capex || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_opex || 0)}</TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* FTE Items */}
              {fteItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.budget_aed)}</TableCell>
                  <TableCell className="text-right">{item.capex > 0 ? formatCurrency(item.capex) : ''}</TableCell>
                  <TableCell className="text-right">{item.opex > 0 ? formatCurrency(item.opex) : ''}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Cost Row */}
              <TableRow className="bg-yellow-100 font-bold">
                <TableCell>TOTAL COST</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_cost || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_cost_capex || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(budgetData?.totals.total_cost_opex || 0)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g., Consulting, Licenses"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aed">AED</SelectItem>
                  <SelectItem value="fte">FTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Budget (AED)</Label>
                <Input
                  type="number"
                  value={formData.budget_aed || ''}
                  onChange={(e) => setFormData({ ...formData, budget_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>CAPEX</Label>
                <Input
                  type="number"
                  value={formData.capex || ''}
                  onChange={(e) => setFormData({ ...formData, capex: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>OPEX</Label>
                <Input
                  type="number"
                  value={formData.opex || ''}
                  onChange={(e) => setFormData({ ...formData, opex: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order || ''}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
