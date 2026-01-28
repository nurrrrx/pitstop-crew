import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

export const budgetRouter = Router();

// All routes require authentication
budgetRouter.use(authenticateToken);

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

// Get ADO budget for a specific year
budgetRouter.get('/ado/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(String(req.params.year));

    const result = await query(
      `SELECT * FROM ado_budget WHERE year = $1 ORDER BY sort_order, id`,
      [year]
    );

    const items: ADOBudgetItem[] = result.rows;

    // Calculate totals
    const aedItems = items.filter(item => item.category === 'aed');
    const fteItems = items.filter(item => item.category === 'fte');

    const totals = {
      total_aed: aedItems.reduce((sum, item) => sum + Number(item.budget_aed), 0),
      total_capex: aedItems.reduce((sum, item) => sum + Number(item.capex), 0),
      total_opex: aedItems.reduce((sum, item) => sum + Number(item.opex), 0),
      fte_aed: fteItems.reduce((sum, item) => sum + Number(item.budget_aed), 0),
      fte_capex: fteItems.reduce((sum, item) => sum + Number(item.capex), 0),
      fte_opex: fteItems.reduce((sum, item) => sum + Number(item.opex), 0),
      total_cost: 0,
      total_cost_capex: 0,
      total_cost_opex: 0,
    };

    // Calculate grand totals
    totals.total_cost = totals.total_aed + totals.fte_aed;
    totals.total_cost_capex = totals.total_capex + totals.fte_capex;
    totals.total_cost_opex = totals.total_opex + totals.fte_opex;

    const summary: ADOBudgetSummary = { items, totals };

    res.json(summary);
  } catch (error) {
    console.error('Error getting ADO budget:', error);
    res.status(500).json({ error: 'Failed to get ADO budget' });
  }
});

// Update ADO budget item
budgetRouter.put('/ado/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { item_name, budget_aed, capex, opex, category, sort_order } = req.body;

    const result = await query(
      `UPDATE ado_budget
       SET item_name = COALESCE($1, item_name),
           budget_aed = COALESCE($2, budget_aed),
           capex = COALESCE($3, capex),
           opex = COALESCE($4, opex),
           category = COALESCE($5, category),
           sort_order = COALESCE($6, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [item_name, budget_aed, capex, opex, category, sort_order, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Budget item not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ADO budget item:', error);
    res.status(500).json({ error: 'Failed to update budget item' });
  }
});

// Create new ADO budget item
budgetRouter.post('/ado', async (req: Request, res: Response) => {
  try {
    const { year, item_name, budget_aed, capex, opex, category, sort_order } = req.body;

    const result = await query(
      `INSERT INTO ado_budget (year, item_name, budget_aed, capex, opex, category, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [year || 2026, item_name, budget_aed || 0, capex || 0, opex || 0, category || 'aed', sort_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ADO budget item:', error);
    res.status(500).json({ error: 'Failed to create budget item' });
  }
});

// Delete ADO budget item
budgetRouter.delete('/ado/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));

    await query('DELETE FROM ado_budget WHERE id = $1', [id]);

    res.json({ message: 'Budget item deleted' });
  } catch (error) {
    console.error('Error deleting ADO budget item:', error);
    res.status(500).json({ error: 'Failed to delete budget item' });
  }
});

// Get band and rate category costs reference
budgetRouter.get('/rates', async (_req: Request, res: Response) => {
  try {
    const rates = {
      // FTE bands with monthly cost
      bands: {
        G: { monthly: 10000, label: 'Band G' },
        H: { monthly: 20000, label: 'Band H' },
        I: { monthly: 30000, label: 'Band I' },
      },
      // Consultant rate categories with daily/monthly rates
      rateCategories: {
        A: { daily: 1000, monthly: 21000, label: 'Category A' },
        AA: { daily: 1500, monthly: 31500, label: 'Category AA' },
        AAA: { daily: 2000, monthly: 42000, label: 'Category AAA' },
        AAAA: { daily: 3000, monthly: 63000, label: 'Category AAAA' },
      },
    };

    res.json(rates);
  } catch (error) {
    console.error('Error getting rates:', error);
    res.status(500).json({ error: 'Failed to get rates' });
  }
});
