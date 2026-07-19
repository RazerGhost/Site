import fs from 'node:fs';
import Database from 'better-sqlite3';

// Dumps a SQLite file to plain-text SQL (schema + INSERT statements), the
// same shape `sqlite3 <file> .dump` produces. Used for git-based backups:
// text diffs cleanly and compresses well across snapshots, unlike committing
// the raw binary .db file where a single row change can shuffle bytes across
// the whole file. Returns null if the file doesn't exist yet (e.g. a DB that
// hasn't been touched, like status.db before /notes/status is first used).
export function dumpDatabaseToSql(dbPath: string): string | null {
	if (!fs.existsSync(dbPath)) return null;

	const db = new Database(dbPath, { readonly: true, fileMustExist: true });
	try {
		const lines: string[] = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;'];

		// pragma_table_list distinguishes real tables from FTS5's internal
		// "shadow" tables (e.g. notes_fts_data, notes_fts_config) — those are
		// reserved names SQLite refuses to CREATE/INSERT into directly, and
		// they're recreated automatically alongside their parent virtual
		// table, so they must be skipped entirely rather than dumped as rows.
		const tableTypes = new Map(
			(
				db.prepare(`SELECT name, type FROM pragma_table_list()`).all() as {
					name: string;
					type: string;
				}[]
			).map((t) => [t.name, t.type])
		);

		const objects = db
			.prepare(
				`SELECT type, name, sql FROM sqlite_master
				 WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
				 ORDER BY (type = 'table') DESC, name`
			)
			.all() as { type: string; name: string; sql: string }[];

		for (const obj of objects) {
			if (tableTypes.get(obj.name) === 'shadow') continue;

			lines.push(`${obj.sql};`);

			// Virtual tables (e.g. an external-content FTS5 index) hold no data
			// of their own to dump — the app rebuilds/backfills them from the
			// real table they index on next startup.
			if (obj.type === 'table' && tableTypes.get(obj.name) !== 'virtual') {
				const rows = db.prepare(`SELECT * FROM "${obj.name}"`).all() as Record<string, unknown>[];
				const columns = rows.length > 0 ? Object.keys(rows[0]) : getTableColumns(db, obj.name);
				for (const row of rows) {
					const values = columns.map((col) => sqlQuoteValue(row[col]));
					lines.push(
						`INSERT INTO "${obj.name}" (${columns.map((c) => `"${c}"`).join(',')}) VALUES (${values.join(',')});`
					);
				}
			}
		}

		lines.push('COMMIT;');
		return lines.join('\n') + '\n';
	} finally {
		db.close();
	}
}

function getTableColumns(db: Database.Database, table: string): string[] {
	const info = db.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[];
	return info.map((c) => c.name);
}

function sqlQuoteValue(value: unknown): string {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
	if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
	// TEXT and anything else stringifiable — escape single quotes by doubling.
	return `'${String(value).replace(/'/g, "''")}'`;
}
