import sqlite3 from "sqlite3";
import { config } from "@/utils/config";

export class Database {
    private db: sqlite3.Database;
    private static instance: Database;

    private constructor() {
        sqlite3.verbose();
        this.db = new sqlite3.Database(config.database.path, (err) => {
            if (err) {
                console.error("Error opeing database:", err.message);
                process.exit(1);
            }
            console.log("📦 Connected to SQLite database");
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getDb(): sqlite3.Database {
        return this.db;
    }

    public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    public get(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    public all(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log("📦 Database connection closed");
                    resolve();
                }
            });
        });
    }
}

export const db = Database.getInstance();
