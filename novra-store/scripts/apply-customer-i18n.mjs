#!/usr/bin/env node
/**
 * Merges customer-facing page i18n into messages/{ro,en,de}.json
 * Run: node scripts/apply-customer-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { additions } from "./customer-pages-i18n-data.mjs";
import { legalAdditions } from "./legal-i18n-data.mjs";

const root = path.resolve(".");

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

for (const locale of ["ro", "en", "de"]) {
  const filePath = path.join(root, "messages", `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  deepMerge(data, additions[locale]);
  deepMerge(data, legalAdditions[locale]);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated messages/${locale}.json`);
}
