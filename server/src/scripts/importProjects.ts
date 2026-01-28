import xlsx from 'xlsx';
import { pool } from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color palettes for heads and domains
const HEAD_COLORS: Record<string, string> = {
  'Zakariyah': '#3498db',
  'Sudeep': '#e74c3c',
  'Venkat': '#2ecc71',
  'Dinesh': '#9b59b6',
  'Basim': '#f39c12',
  'Faisal': '#1abc9c',
  'Vimal': '#e67e22',
  'Rami': '#34495e',
  'Ahmed': '#16a085',
  'Hozefa': '#c0392b',
  'Zahra': '#8e44ad',
};

const DOMAIN_COLORS: Record<string, string> = {
  'Finance': '#3498db',
  'Marketing': '#e74c3c',
  'Data Platform': '#2ecc71',
  'Customer Experience': '#9b59b6',
  'Operations': '#f39c12',
  'Mobility': '#1abc9c',
  'CX': '#e67e22',
  'ADO Governance': '#34495e',
  'After Sales': '#16a085',
  'Aftersales': '#16a085',
  'Automotive': '#c0392b',
  'HR': '#8e44ad',
  'HSSE': '#2c3e50',
  'Enterprise': '#27ae60',
  'AFM': '#d35400',
  'Digital Ventures': '#7f8c8d',
  'AW': '#1e3799',
};

// Generate a random color for unknown values
function getRandomColor(): string {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22', '#34495e'];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function importProjects() {
  try {
    console.log('Starting project import...');

    // Read the Excel file
    const excelPath = join(__dirname, '../../projects.xlsx');
    console.log('Reading Excel file from:', excelPath);

    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Skip header row
    const projects = data.slice(1).filter(row => row.length > 0 && row[3]); // Filter empty rows and rows without project name

    console.log(`Found ${projects.length} projects to import`);

    let imported = 0;
    let skipped = 0;

    for (const row of projects) {
      const [
        _num,
        head,
        domain,
        projectName,
        phase,
        startDate,
        endDate,
        implemented,
        businessInteraction
      ] = row;

      // Skip if no project name
      if (!projectName) {
        skipped++;
        continue;
      }

      // Parse dates - Excel dates are numeric
      let parsedStartDate: string | null = null;
      let parsedEndDate: string | null = null;

      if (startDate) {
        if (typeof startDate === 'number') {
          // Excel serial date
          const date = new Date((startDate - 25569) * 86400 * 1000);
          parsedStartDate = date.toISOString().split('T')[0];
        } else if (startDate instanceof Date) {
          parsedStartDate = startDate.toISOString().split('T')[0];
        }
      }

      if (endDate) {
        if (typeof endDate === 'number') {
          const date = new Date((endDate - 25569) * 86400 * 1000);
          parsedEndDate = date.toISOString().split('T')[0];
        } else if (endDate instanceof Date) {
          parsedEndDate = endDate.toISOString().split('T')[0];
        }
      }

      // Determine project status based on dates
      let status = 'planning';
      const today = new Date();
      if (parsedEndDate && new Date(parsedEndDate) < today) {
        status = 'completed';
      } else if (parsedStartDate && new Date(parsedStartDate) <= today) {
        status = 'active';
      }

      // Get color based on domain
      const color = DOMAIN_COLORS[domain] || getRandomColor();

      // Create the full project name (include phase if exists)
      const fullName = phase ? `${projectName} - ${phase}` : projectName;

      // Check if project already exists
      const existingProject = await pool.query(
        'SELECT id FROM projects WHERE name = $1',
        [fullName]
      );

      if (existingProject.rows.length > 0) {
        // Update existing project
        await pool.query(
          `UPDATE projects SET
            head = $1,
            domain = $2,
            phase = $3,
            start_date = $4,
            end_date = $5,
            implemented = $6,
            business_interaction = $7,
            status = $8,
            color = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE name = $10`,
          [
            head || null,
            domain || null,
            phase || null,
            parsedStartDate,
            parsedEndDate,
            implemented || null,
            businessInteraction || null,
            status,
            color,
            fullName
          ]
        );
        console.log(`Updated: ${fullName}`);
      } else {
        // Insert new project
        await pool.query(
          `INSERT INTO projects (name, description, head, domain, phase, start_date, end_date, implemented, business_interaction, status, color)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            fullName,
            implemented || null, // Use implemented as description
            head || null,
            domain || null,
            phase || null,
            parsedStartDate,
            parsedEndDate,
            implemented || null,
            businessInteraction || null,
            status,
            color
          ]
        );
        console.log(`Imported: ${fullName}`);
      }

      imported++;
    }

    console.log(`\nImport completed!`);
    console.log(`Total imported/updated: ${imported}`);
    console.log(`Skipped: ${skipped}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importProjects();
