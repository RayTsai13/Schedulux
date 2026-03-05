import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'schedulux_primary',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    const client = await pool.connect();

    try {
        // Create tracking table if it doesn't exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

        // Get already-applied migrations
        const applied = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
        const appliedSet = new Set(applied.rows.map(r => r.filename));

        // Read migration files, sorted by name
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (appliedSet.has(file)) {
                console.log(`  ⏭  ${file} (already applied)`);
                continue;
            }

            console.log(`  ▶  Applying ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`  ✅ ${file} applied`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`  ❌ ${file} failed:`, err);
                throw err;
            }
        }

        console.log('Migrations complete.');
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});