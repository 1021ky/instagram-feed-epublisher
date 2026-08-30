/**
 * @file Unit tests for feed filter service.
 */
import { expect, test } from "vitest";
import { applyFeedFilter } from "./filter-service";

const items = [
  {
    id: "1",
    caption: "#travel day",
    media_type: "IMAGE" as const,
    media_url: "x",
    permalink: "p",
    timestamp: new Date("2025-01-01T00:00:00Z").toISOString(),
  },
  {
    id: "2",
    caption: "#food",
    media_type: "IMAGE" as const,
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

test("applyFeedFilter does not match prefix hashtag like #traveler for #travel", () => {
  const customItems = [
    {
      id: "1",
      caption: "#traveler on the road",
      media_type: "IMAGE" as const,
      media_url: "x",
      permalink: "p",
      timestamp: new Date("2025-01-01T00:00:00Z").toISOString(),
    },
    {
      id: "2",
      caption: "#travel to Kyoto",
      media_type: "IMAGE" as const,
      media_url: "y",
      permalink: "q",
      timestamp: new Date("2025-01-02T00:00:00Z").toISOString(),
    },
  ];
  const result = applyFeedFilter(customItems, {
    hashtag: "travel",
    maxCount: 10,
  });
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe("2");
});

test("applyFeedFilter sorts by sortOrder", () => {
  const ascResult = applyFeedFilter(items, {
    maxCount: 10,
    sortOrder: "asc",
  });
  expect(ascResult[0]?.id).toBe("1");
  expect(ascResult[1]?.id).toBe("2");

  const descResult = applyFeedFilter(items, {
    maxCount: 10,
    sortOrder: "desc",
  });
  expect(descResult[0]?.id).toBe("2");
  expect(descResult[1]?.id).toBe("1");
});
