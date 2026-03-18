import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const templatePath = path.join(process.cwd(), "data", "demo-template.json");
const databasePath = path.join(process.cwd(), "data", "demo-db.json");

const template = await readFile(templatePath, "utf8");
await mkdir(path.dirname(databasePath), { recursive: true });
await writeFile(databasePath, template);

console.log("Demo database reset:", databasePath);
