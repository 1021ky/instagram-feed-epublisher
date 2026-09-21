/**
 * @file Unit tests for UI foundation, Lucide icons import, and shared types.
 */
import { createElement } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Sparkles,
} from "lucide-react";
import { describe, expect, it } from "vitest";
import type {
  AppMode,
  CoverTheme,
  CoverThemeId,
  DemoFeedData,
  EpubCustomSettings,
  EpubSortOrder,
  FeedFilterOptions,
  FeedPostItem,
  StepNumber,
} from "@/types/ui";

describe("Lucide Icons Integration", () => {
  it("successfully imports and instantiates Lucide icon components", () => {
    const icons = [
      BookOpen,
      Calendar,
      Check,
      ChevronRight,
      Download,
      ExternalLink,
      Filter,
      Sparkles,
    ];

    for (const Icon of icons) {
      expect(Icon).toBeDefined();
      const element = createElement(Icon, { size: 24, className: "w-6 h-6" });
      expect(element).toBeDefined();
      expect(element.props.size).toBe(24);
      expect(element.props.className).toBe("w-6 h-6");
    }
  });
});

describe("Shared UI Types", () => {
  it("validates FeedPostItem structure", () => {
    const post: FeedPostItem = {
      id: "media-101",
      media_url: "https://example.com/image.jpg",
      permalink: "https://instagram.com/p/example",
      timestamp: "2026-09-21T00:00:00.000Z",
      caption: "Day 1 #100日チャレンジ",
      like_count: 42,
      comments_count: 5,
      selected: true,
    };

    expect(post.id).toBe("media-101");
    expect(post.selected).toBe(true);
    expect(post.like_count).toBe(42);
  });

  it("validates EpubCustomSettings and CoverTheme structure", () => {
    const themeId: CoverThemeId = "navy";
    const sortOrder: EpubSortOrder = "asc";

    const settings: EpubCustomSettings = {
      title: "100日チャレンジの記録",
      subtitle: "Day 1 - Day 100",
      author: "creator",
      coverTheme: themeId,
      sortOrder,
    };

    const theme: CoverTheme = {
      id: "navy",
      name: "濃紺: チャレンジ",
      description: "挑戦と誠実さを表現するクラシックネイビー",
      bgClass: "bg-slate-900",
      textClass: "text-amber-300",
      accentClass: "border-amber-400",
      previewBg: "#0f172a",
      previewAccent: "#f59e0b",
    };

    expect(settings.coverTheme).toBe("navy");
    expect(settings.sortOrder).toBe("asc");
    expect(theme.id).toBe("navy");
  });

  it("validates DemoFeedData and AppMode", () => {
    const mode: AppMode = "demo";
    const step: StepNumber = 1;
    const filter: FeedFilterOptions = {
      hashtag: "100日チャレンジ",
      maxCount: 100,
    };

    const demoData: DemoFeedData = {
      username: "demo_creator",
      avatarUrl: "https://example.com/avatar.jpg",
      hashtag: "#100日チャレンジ",
      posts: [
        {
          id: "demo-1",
          media_url: "https://example.com/1.jpg",
          permalink: "https://instagram.com/p/1",
          timestamp: "2026-09-01T12:00:00.000Z",
          selected: true,
        },
      ],
    };

    expect(mode).toBe("demo");
    expect(step).toBe(1);
    expect(filter.hashtag).toBe("100日チャレンジ");
    expect(demoData.posts).toHaveLength(1);
  });
});
