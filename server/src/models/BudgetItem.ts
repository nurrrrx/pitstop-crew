import { query } from '../config/database.js';

export interface BudgetItem {
  id: number;
  project_id: number;
  category: string;
  name: string;
  description: string | null;
  estimated_cost: number;
  actual_cost: number;
  start_date: string | null;
  end_date: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBudgetItemData {
  category: string;
  name: string;
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: string;
  end_date?: string;
}

export interface BudgetSummary {
  category: string;
  estimated_total: number;
  actual_total: number;
  item_count: number;
}

export const BudgetItemModel = {
  async findByProject(projectId: number): Promise<BudgetItem[]> {
    const result = await query(`
      SELECT * FROM project_budget_items
      WHERE project_id = $1
      ORDER BY category, name
    `, [projectId]);
    return result.rows;
  },

  async findById(id: number): Promise<BudgetItem | null> {
    const result = await query(`
      SELECT * FROM project_budget_items WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async create(projectId: number, data: CreateBudgetItemData): Promise<BudgetItem> {
    const result = await query(`
      INSERT INTO project_budget_items (project_id, category, name, description, estimated_cost, actual_cost, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      projectId,
      data.category,
      data.name,
      data.description || null,
      data.estimated_cost || 0,
      data.actual_cost || 0,
      data.start_date || null,
      data.end_date || null
    ]);
    return result.rows[0];
  },

  async update(id: number, data: Partial<CreateBudgetItemData>): Promise<BudgetItem | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.estimated_cost !== undefined) {
      fields.push(`estimated_cost = $${paramCount++}`);
      values.push(data.estimated_cost);
    }
    if (data.actual_cost !== undefined) {
      fields.push(`actual_cost = $${paramCount++}`);
      values.push(data.actual_cost);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(data.end_date);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE project_budget_items
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query(`
      DELETE FROM project_budget_items WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getBudgetSummary(projectId: number): Promise<BudgetSummary[]> {
    const result = await query(`
      SELECT
        category,
        COALESCE(SUM(estimated_cost), 0) as estimated_total,
        COALESCE(SUM(actual_cost), 0) as actual_total,
        COUNT(*) as item_count
      FROM project_budget_items
      WHERE project_id = $1
      GROUP BY category
      ORDER BY category
    `, [projectId]);
    return result.rows;
  },

  async getProjectTotals(projectId: number): Promise<{ estimated: number; actual: number }> {
    const result = await query(`
      SELECT
        COALESCE(SUM(estimated_cost), 0) as estimated,
        COALESCE(SUM(actual_cost), 0) as actual
      FROM project_budget_items
      WHERE project_id = $1
    `, [projectId]);
    return result.rows[0] || { estimated: 0, actual: 0 };
  }
};
