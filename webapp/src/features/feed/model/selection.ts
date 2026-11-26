import { listCarouselMediaEntries } from "@/lib/instagram/media-resolver";
import type { EpubSortOrder, FeedPostItem } from "@/types/ui";

/**
 * Step 2 投稿リストの並び順切替オプション定義。
 */
export interface FeedSortOrderOption {
  /** 並び順キー（asc: 古い順、desc: 新しい順） */
  value: EpubSortOrder;
  /** 画面に表示するラベル */
  label: string;
}

/**
 * Step 2 投稿リストで提供する並び順の選択肢一覧。
 */
export const FEED_SORT_ORDER_OPTIONS: readonly FeedSortOrderOption[] = [
  { value: "asc", label: "古い順（おすすめ）" },
  { value: "desc", label: "新しい順" },
] as const;

/**
 * 投稿が EPUB 収録対象として選択されているかを判定します。
 * `selected` が未指定（`undefined`）の場合は選択扱いとします。
 */
export function isPostSelected(post: FeedPostItem): boolean {
  return post.selected !== false;
}

/**
 * 投稿一覧から EPUB 収録対象として選択されている投稿のみを抽出します。
 */
export function getSelectedPosts(posts: readonly FeedPostItem[]): FeedPostItem[] {
  return posts.filter(isPostSelected);
}

/**
 * 投稿一覧のうち選択されている投稿件数を返します。
 */
export function countSelectedPosts(posts: readonly FeedPostItem[]): number {
  return posts.filter(isPostSelected).length;
}

/**
 * キャプションの部分一致（大文字小文字を区別しない）で投稿一覧を絞り込みます。
 */
export function filterPostsByCaptionQuery(
  posts: readonly FeedPostItem[],
  query: string,
): FeedPostItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [...posts];
  }
  return posts.filter((post) => (post.caption || "").toLowerCase().includes(trimmed));
}

/**
 * 指定された投稿 ID の選択状態を反転した新しい配列を返します。
 * カルーセル子画像がすべて解除されていた投稿を再選択した場合は、全子画像選択へ復帰させます。
 */
export function togglePostSelection(
  posts: readonly FeedPostItem[],
  postId: string,
): FeedPostItem[] {
  return posts.map((item) => {
    if (item.id !== postId) {
      return item;
    }
    const nextSelected = item.selected === false;
    return {
      ...item,
      selected: nextSelected,
      selectedChildIds:
        nextSelected && item.selectedChildIds?.length === 0 ? undefined : item.selectedChildIds,
    };
  });
}

/**
 * 指定されたカルーセル投稿の個別子画像の選択状態を切り替えた新しい配列を返します。
 * 子画像が 0 枚になると親投稿を除外し、全枚数が選択された場合は `selectedChildIds` を `undefined` に正規化します。
 */
export function toggleCarouselChildSelection(
  posts: readonly FeedPostItem[],
  postId: string,
  childId: string,
): FeedPostItem[] {
  return posts.map((item) => {
    if (item.id !== postId) {
      return item;
    }
    const allIds = listCarouselMediaEntries(item).map((entry) => entry.id);
    if (allIds.length === 0 || !allIds.includes(childId)) {
      return item;
    }

    const currentIds =
      item.selected === false && item.selectedChildIds === undefined
        ? []
        : (item.selectedChildIds ?? allIds);
    const currentSet = new Set(currentIds);
    if (currentSet.has(childId)) {
      currentSet.delete(childId);
    } else {
      currentSet.add(childId);
    }

    const nextIds = allIds.filter((id) => currentSet.has(id));
    if (nextIds.length === 0) {
      return { ...item, selected: false, selectedChildIds: [] };
    }
    return {
      ...item,
      selected: true,
      selectedChildIds: nextIds.length === allIds.length ? undefined : nextIds,
    };
  });
}

/**
 * すべての投稿を選択状態にした新しい配列を返します。
 * カルーセル子画像が 0 枚になっていた投稿は全子画像選択へ復帰させます。
 */
export function selectAllPosts(posts: readonly FeedPostItem[]): FeedPostItem[] {
  return posts.map((item) => ({
    ...item,
    selected: true,
    selectedChildIds: item.selectedChildIds?.length === 0 ? undefined : item.selectedChildIds,
  }));
}

/**
 * すべての投稿を未選択状態にした新しい配列を返します。
 */
export function deselectAllPosts(posts: readonly FeedPostItem[]): FeedPostItem[] {
  return posts.map((item) => ({ ...item, selected: false }));
}
