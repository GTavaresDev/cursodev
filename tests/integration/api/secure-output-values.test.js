import fs from "node:fs";
import path from "node:path";

describe("Secure output values", () => {
  test("All API handlers must use .json(secureOutputValues)", () => {
    const apiDirectory = path.join(process.cwd(), "pages", "api");
    const unfilteredResponses = findUnfilteredJsonResponses(apiDirectory);

    expect(unfilteredResponses).toEqual([]);
  });
});

function findUnfilteredJsonResponses(directory) {
  const unfilteredResponses = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      unfilteredResponses.push(...findUnfilteredJsonResponses(entryPath));
      continue;
    }

    if (!entry.name.endsWith(".js")) {
      continue;
    }

    const sourceCode = fs.readFileSync(entryPath, "utf8");
    const matches = sourceCode.match(/\.json\s*\(\s*(?!secureOutputValues\s*\))/g);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      unfilteredResponses.push({
        file: path.relative(process.cwd(), entryPath),
        match,
      });
    }
  }

  return unfilteredResponses;
}
