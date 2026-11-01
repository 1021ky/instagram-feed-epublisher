/**
 * @file Unit tests for hashtag extraction and aggregation service (`hashtag-service.ts`).
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HASHTAG_LIMIT,
  extractHashtagsFromCaption,
  extractHashtagsFromPosts,
  MAX_HASHTAG_LIMIT,
  normalizeHashtagLimit,
} from "./hashtag-service";

describe("hashtag-service: extractHashtagsFromCaption & extractHashtagsFromPosts", () => {
  it("日本語（漢字・ひらがな・カタカナ・長音）・英数字・アンダースコアを含む複数タグを抽出する", () => {
    const tags = extractHashtagsFromCaption(
      "今日の記録 #100日チャレンジ #京都カフェ_2026 #コーヒーのある暮らし # morning_routine",
    );
    expect(tags).toEqual(["100日チャレンジ", "京都カフェ_2026", "コーヒーのある暮らし"]);
  });

  it("同一投稿（1キャプション）内に同じタグが複数回出現しても 1 投稿につき 1 回としてカウントする", () => {
    const suggestions = extractHashtagsFromPosts([
      {
        caption: "#100日チャレンジ 今日も達成！ #100日チャレンジ #朝活",
        timestamp: "2026-10-20T09:00:00.000Z",
      },
      {
        caption: "2日目 #100日チャレンジ",
        timestamp: "2026-10-21T09:00:00.000Z",
      },
    ]);

    expect(suggestions).toEqual([
      {
        tag: "100日チャレンジ",
        count: 2,
        lastUsedAt: "2026-10-21T09:00:00.000Z",
      },
      {
        tag: "朝活",
        count: 1,
        lastUsedAt: "2026-10-20T09:00:00.000Z",
      },
    ]);
  });

  it("英字の大文字・小文字および Unicode NFD/NFC 表記ゆれを同一タグに正規化・合算する", () => {
    // "カフェ" (NFC) と "カフ\u3099ェ" 等の結合文字を含むケース（"ぷりん" NFD: "ふ\u309Aりん"）
    const nfdPurin = "#ふ\u309Aりん";
    const nfcPurin = "#ぷりん";

    const suggestions = extractHashtagsFromPosts([
      { caption: "Trip 1 #KyotoTrip", timestamp: "2026-10-18T09:00:00.000Z" },
      { caption: "Trip 2 #kyototrip", timestamp: "2026-10-19T09:00:00.000Z" },
      { caption: `おやつ1 ${nfdPurin}`, timestamp: "2026-10-17T09:00:00.000Z" },
      { caption: `おやつ2 ${nfcPurin}`, timestamp: "2026-10-20T09:00:00.000Z" },
    ]);

    expect(suggestions).toEqual([
      {
        tag: "ぷりん",
        count: 2,
        lastUsedAt: "2026-10-20T09:00:00.000Z",
      },
      {
        tag: "kyototrip",
        count: 2,
        lastUsedAt: "2026-10-19T09:00:00.000Z",
      },
    ]);
  });

  it("全角シャープ（＃）や絵文字を含むタグ、括弧・カンマ区切りのタグを正しく抽出する", () => {
    const tags = extractHashtagsFromCaption("休日メモ（＃京都カフェ）,#読書記録,#カフェ☕");
    expect(tags).toEqual(["京都カフェ", "読書記録", "カフェ☕"]);
  });

  it("URL フラグメント、HTML 数値文字参照、語中の #、アンダースコアのみ、複数連続 ## は除外する", () => {
    const tags = extractHashtagsFromCaption(
      "詳細 https://example.com#section と https://example.com/path/#top と C#言語 と It&#39;s fine と #___ と ##見出し と #有効タグ",
    );
    expect(tags).toEqual(["有効タグ"]);
  });

  it("ソート順（count 降順 → lastUsedAt 新しい順 → tag 辞書順）が決定論的に保証される", () => {
    const suggestions = extractHashtagsFromPosts([
      { caption: "#beta #alpha", timestamp: "2026-10-15T10:00:00.000Z" },
      { caption: "#gamma", timestamp: "2026-10-18T10:00:00.000Z" },
      { caption: "#popular", timestamp: "2026-10-10T10:00:00.000Z" },
      { caption: "#popular", timestamp: "2026-10-11T10:00:00.000Z" },
    ]);

    // popular (count: 2) -> gamma (count: 1, 10/18) -> alpha (count: 1, 10/15, lexical 'a') -> beta (count: 1, 10/15, lexical 'b')
    expect(suggestions.map((s) => s.tag)).toEqual(["popular", "gamma", "alpha", "beta"]);
  });

  it("投稿 0 件、caption 未定義、空文字、ハッシュタグなし投稿のみの場合は空配列を返す", () => {
    expect(extractHashtagsFromPosts([])).toEqual([]);
    expect(
      extractHashtagsFromPosts([
        { caption: undefined, timestamp: "2026-10-20T00:00:00.000Z" },
        { caption: "", timestamp: "2026-10-20T00:00:00.000Z" },
        { caption: "タグのない普通の文章です。", timestamp: "2026-10-20T00:00:00.000Z" },
      ]),
    ).toEqual([]);
  });

  it("limit の指定・デフォルト値(20)・上限クランプ(50)・小数切り捨て・不正値フォールバックが正しく機能する", () => {
    expect(normalizeHashtagLimit(undefined)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(null)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit("")).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit("abc")).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(Number.NaN)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(Number.POSITIVE_INFINITY)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(-5)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(0)).toBe(DEFAULT_HASHTAG_LIMIT);
    expect(normalizeHashtagLimit(3.9)).toBe(3);
    expect(normalizeHashtagLimit("5")).toBe(5);
    expect(normalizeHashtagLimit(100)).toBe(MAX_HASHTAG_LIMIT);

    const manyTagsCaption = Array.from(
      { length: 30 },
      (_, i) => `#tag_${String(i).padStart(2, "0")}`,
    ).join(" ");
    const posts = [{ caption: manyTagsCaption, timestamp: "2026-10-20T00:00:00.000Z" }];

    expect(extractHashtagsFromPosts(posts)).toHaveLength(20);
    expect(extractHashtagsFromPosts(posts, { limit: 5 })).toHaveLength(5);
  });

  it("実 API と同様に新しい順（降順）で投稿が並んでいる場合でも、lastUsedAt が古い投稿の日時で上書きされない", () => {
    const suggestions = extractHashtagsFromPosts([
      { caption: "最新の投稿 #京都カフェ", timestamp: "2026-10-25T12:00:00.000Z" },
      { caption: "過去の投稿 #京都カフェ", timestamp: "2026-10-10T08:00:00.000Z" },
    ]);

    expect(suggestions).toEqual([
      {
        tag: "京都カフェ",
        count: 2,
        lastUsedAt: "2026-10-25T12:00:00.000Z",
      },
    ]);
  });

  it("timestamp が空文字や不正日時文字列を含む場合でも例外を投げず決定論的にソートする", () => {
    const suggestions = extractHashtagsFromPosts([
      { caption: "#empty_ts", timestamp: "" },
      { caption: "#invalid_b", timestamp: "not-a-timestamp-1" },
      { caption: "#invalid_a", timestamp: "not-a-timestamp-2" },
    ]);

    expect(suggestions).toEqual([
      { tag: "empty_ts", count: 1, lastUsedAt: "1970-01-01T00:00:00.000Z" },
      { tag: "invalid_a", count: 1, lastUsedAt: "not-a-timestamp-2" },
      { tag: "invalid_b", count: 1, lastUsedAt: "not-a-timestamp-1" },
    ]);
  });
});
