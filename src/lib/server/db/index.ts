import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database("data.db", { create: true });

sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA busy_timeout = 5000;");

export const db = drizzle(sqlite, { schema });
