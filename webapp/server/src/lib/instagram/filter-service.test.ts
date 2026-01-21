/**
 * @file Unit tests for feed filter service.
 */
import { expect, test } from "vitest";
import { applyFeedFilter } from "./filter-service";

const items = [
  {
    id: "1",
    caption: "#travel day",
    media_url: "x",
    permalink: "p",
    timestamp: new Date("2025-01-01T00:00:00Z").toISOString(),
  },
  {
    id: "2",
    caption: "#food",
    media_url: "y",
    permalink: "q",
    timestamp: new Date("2025-02-01T00:00:00Z").toISOString(),
  },
];

test("applyFeedFilter returns filtered items", () => {
  const result = applyFeedFilter(items, {
    hashtag: "travel",
    maxCount: 10,
  });
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe("1");
});

test("applyFeedFilter returns empty on no match", () => {
  const result = applyFeedFilter(items, {
    hashtag: "unknown",
    maxCount: 10,
  });
  expect(result).toHaveLength(0);
});
