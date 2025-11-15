/**
 * Database Migration Runner
 * Handles running migrations in order and tracking migration status
 */
import fs from 'fs';
import path from 'path';
export class MigrationRunner {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Initialize migration tracking table
     */
    async initMigrationTable() {
        await this.db
            .prepare(`CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at INTEGER NOT NULL DEFAULT (unixepoch())
        )`)
            .run();
    }
    /**
     * Get list of applied migrations
     */
    async getAppliedMigrations() {
        const result = await this.db
            .prepare('SELECT * FROM migrations ORDER BY id ASC')
            .all();
        return result.results || [];
    }
    /**
     * Load migration files from directory
     */
    loadMigrations(migrationsDir) {
        const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
        return files.map((file) => {
            const match = file.match(/^(\d+)_(.+)\.sql$/);
            if (!match || !match[1] || !match[2]) {
                throw new Error(`Invalid migration filename: ${file}`);
            }
            const id = parseInt(match[1], 10);
            const name = match[2];
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            return { id, name, sql };
        });
    }
    /**
     * Run pending migrations
     */
    async runMigrations(migrationsDir) {
        await this.initMigrationTable();
        const appliedMigrations = await this.getAppliedMigrations();
        const appliedIds = new Set(appliedMigrations.map((m) => m.id));
        const allMigrations = this.loadMigrations(migrationsDir);
        const pendingMigrations = allMigrations.filter((m) => !appliedIds.has(m.id));
        if (pendingMigrations.length === 0) {
            console.log('No pending migrations');
            return 0;
        }
        console.log(`Running ${pendingMigrations.length} pending migrations...`);
        for (const migration of pendingMigrations) {
            console.log(`Applying migration ${migration.id}: ${migration.name}`);
            try {
                // Execute migration SQL
                await this.db.exec(migration.sql);
                // Record migration
                await this.db
                    .prepare('INSERT INTO migrations (id, name) VALUES (?, ?)')
                    .bind(migration.id, migration.name)
                    .run();
                console.log(`✓ Migration ${migration.id} applied successfully`);
            }
            catch (error) {
                console.error(`✗ Migration ${migration.id} failed:`, error);
                throw error;
            }
        }
        console.log(`Successfully applied ${pendingMigrations.length} migrations`);
        return pendingMigrations.length;
    }
    /**
     * Rollback last migration (use with caution!)
     */
    async rollbackLast() {
        const appliedMigrations = await this.getAppliedMigrations();
        if (appliedMigrations.length === 0) {
            console.log('No migrations to rollback');
            return;
        }
        const lastMigration = appliedMigrations[appliedMigrations.length - 1];
        if (!lastMigration) {
            console.log('No migrations to rollback');
            return;
        }
        console.warn(`Rolling back migration ${lastMigration.id}: ${lastMigration.name}`);
        console.warn('Note: This will delete the migration record but NOT undo schema changes!');
        await this.db
            .prepare('DELETE FROM migrations WHERE id = ?')
            .bind(lastMigration.id)
            .run();
        console.log('Migration record removed. Manual schema cleanup may be required.');
    }
    /**
     * Get migration status
     */
    async getStatus() {
        await this.initMigrationTable();
        const applied = await this.getAppliedMigrations();
        return {
            applied,
            total: applied.length,
        };
    }
}
/**
 * Helper function to run migrations with a D1 database instance
 */
export async function migrate(db, migrationsDir) {
    const runner = new MigrationRunner(db);
    return await runner.runMigrations(migrationsDir);
}
