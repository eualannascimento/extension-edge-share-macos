import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));

describe("script npm run package", () => {
  it("CA04: encadeia o build antes de empacotar (falha no build impede o zip)", () => {
    expect(packageJson.scripts.package).toMatch(/^npm run build &&/);
  });

  it("CA03: gera um zip contendo exatamente manifest.json, dist/background.js e icons/*.png", () => {
    const outDir = path.join(rootDir, "dist-package");
    rmSync(outDir, { recursive: true, force: true });

    execFileSync("npm", ["run", "package"], { cwd: rootDir, stdio: "pipe" });

    expect(existsSync(outDir)).toBe(true);
    const zipFiles = readdirSync(outDir).filter((f: string) => f.endsWith(".zip"));
    expect(zipFiles).toHaveLength(1);

    const listing = execFileSync("unzip", ["-Z1", path.join(outDir, zipFiles[0])], {
      cwd: rootDir,
    })
      .toString()
      .trim()
      .split("\n")
      .sort();

    expect(listing).toEqual(
      [
        "manifest.json",
        "dist/background.js",
        "icons/icon-16.png",
        "icons/icon-48.png",
        "icons/icon-128.png",
      ].sort(),
    );
  });

  it("CA04: node scripts/package.mjs falha (nao gera zip) se dist/background.js estiver ausente", () => {
    const outDir = path.join(rootDir, "dist-package");
    rmSync(outDir, { recursive: true, force: true });

    const distDir = path.join(rootDir, "dist");
    const backupDir = path.join(rootDir, "dist.bak-test");
    rmSync(backupDir, { recursive: true, force: true });
    renameSync(distDir, backupDir);

    try {
      expect(() => execFileSync("node", ["scripts/package.mjs"], { cwd: rootDir, stdio: "pipe" })).toThrow();
      expect(existsSync(outDir)).toBe(false);
    } finally {
      rmSync(distDir, { recursive: true, force: true });
      renameSync(backupDir, distDir);
    }
  });
});
