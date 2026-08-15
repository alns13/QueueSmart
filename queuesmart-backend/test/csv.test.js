import assert from "node:assert/strict";
import test from "node:test";
import { serializeCsv } from "../src/modules/operations/reports.service.js";

test("CSV serialization escapes special characters and spreadsheet formulas", () => {
  const csv = serializeCsv(
    [
      { key: "service", label: "Service" },
      { key: "visits", label: "Visits" },
      { key: "note", label: "Note" },
    ],
    [
      {
        service: 'Financial Aid, "Express"',
        visits: 0,
        note: "line one\nline two",
      },
      { service: "=HYPERLINK(\"bad\")", visits: 2, note: null },
      { service: "  +SUM(1,1)", visits: 3, note: "@command" },
    ]
  );

  assert.ok(csv.startsWith("\uFEFFService,Visits,Note\r\n"));
  assert.match(csv, /"Financial Aid, ""Express""",0,"line one\nline two"/);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)",2,/);
  assert.match(csv, /"'  \+SUM\(1,1\)",3,'@command/);
  assert.ok(csv.endsWith("\r\n"));
});

test("CSV serialization returns a header row for an empty report", () => {
  const csv = serializeCsv(
    [
      { key: "service", label: "Service" },
      { key: "visits", label: "Visits" },
    ],
    []
  );

  assert.equal(csv, "\uFEFFService,Visits\r\n");
});
