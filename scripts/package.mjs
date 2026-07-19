import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));

const EXPECTED_ENTRIES = [
  "manifest.json",
  "dist/background.js",
  "icons/icon-16.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

const missing = EXPECTED_ENTRIES.filter((entry) => !existsSync(path.join(rootDir, entry)));
if (missing.length > 0) {
  throw new Error(`Arquivo(s) ausente(s) antes de empacotar: ${missing.join(", ")}`);
}

const outDir = path.join(rootDir, "dist-package");
const zipName = `macos-share-edge-extension-v${version}.zip`;
const zipPath = path.join(outDir, zipName);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync("zip", ["-X", zipPath, ...EXPECTED_ENTRIES], { cwd: rootDir, stdio: "inherit" });

const zipContents = execFileSync("unzip", ["-Z1", zipPath], { cwd: rootDir })
  .toString()
  .trim()
  .split("\n")
  .sort();

const expectedSorted = [...EXPECTED_ENTRIES].sort();
if (JSON.stringify(zipContents) !== JSON.stringify(expectedSorted)) {
  throw new Error(
    `Conteudo do zip nao corresponde ao esperado.\nEsperado: ${expectedSorted.join(", ")}\nObtido: ${zipContents.join(", ")}`,
  );
}

console.log(`Pacote gerado em dist-package/${zipName}`);
