// FileDropzone accept — which dropped or picked files reach the caller.
import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptFiles, fileMatchesAccept, parseAccept } from "../src/primitives/FileDropzone/accept.ts";

const f = (name: string, type = "") => ({ name, type });

test("no accept string takes every file", () => {
  assert.equal(fileMatchesAccept(f("a.exe"), undefined), true);
  assert.equal(fileMatchesAccept(f("a.exe"), ""), true);
  assert.deepEqual(parseAccept(" , "), []);
});

test("extensions match case-insensitively, with or without a MIME type", () => {
  assert.equal(fileMatchesAccept(f("Scan.PDF"), ".pdf"), true);
  assert.equal(fileMatchesAccept(f("scan.pdf.txt", "text/plain"), ".pdf"), false);
  assert.equal(fileMatchesAccept(f("model.stl"), ".STL, .obj"), true);
});

test("MIME wildcards and exact types match the file's type", () => {
  assert.equal(fileMatchesAccept(f("a.png", "image/png"), "image/*"), true);
  assert.equal(fileMatchesAccept(f("a.mp4", "video/mp4"), "image/*"), false);
  assert.equal(fileMatchesAccept(f("a.bin", "application/pdf"), "application/pdf"), true);
  assert.equal(fileMatchesAccept(f("a.png", ""), "image/*"), false);
});

test("mixed rules: any one is enough", () => {
  const accept = ".csv,image/*,application/pdf";
  assert.equal(fileMatchesAccept(f("x.csv"), accept), true);
  assert.equal(fileMatchesAccept(f("x.jpg", "image/jpeg"), accept), true);
  assert.equal(fileMatchesAccept(f("x.doc", "application/msword"), accept), false);
});

test("rejected files are dropped; single-file keeps the first accepted", () => {
  const files = [f("a.txt", "text/plain"), f("b.pdf"), f("c.pdf")];
  assert.deepEqual(acceptFiles(files, ".pdf", true).map((x) => x.name), ["b.pdf", "c.pdf"]);
  assert.deepEqual(acceptFiles(files, ".pdf", false).map((x) => x.name), ["b.pdf"]);
  assert.deepEqual(acceptFiles(files, ".png", true), []);
});
