import type { DemoFeedData } from "@/types/ui";

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createAvatarDataUrl() {
  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f97316" />
          <stop offset="50%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="48" fill="url(#g)" />
      <text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fff">D100</text>
    </svg>
  `);
}

function createPostImageDataUrl(day: number) {
  const hue = (day * 17) % 360;
  return createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue} 92% 62%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 55) % 360} 88% 72%)" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" rx="96" fill="url(#bg)" />
      <circle cx="862" cy="218" r="96" fill="rgba(255,255,255,0.18)" />
      <text x="96" y="468" font-family="Arial, sans-serif" font-size="104" font-weight="700" fill="#fff">Day ${day}</text>
      <text x="96" y="602" font-family="Arial, sans-serif" font-size="50" fill="rgba(255,255,255,0.92)">#100日チャレンジ</text>
      <text x="96" y="684" font-family="Arial, sans-serif" font-size="38" fill="rgba(255,255,255,0.88)">Instagram Feed ePublisher Demo</text>
    </svg>
  `);
}

const startDate = new Date("2026-01-01T09:00:00.000Z");

export const sampleDemoFeedData: DemoFeedData = {
  username: "demo_100days",
  avatarUrl: createAvatarDataUrl(),
  hashtag: "#100日チャレンジ",
  posts: Array.from({ length: 100 }, (_, index) => {
    const day = index + 1;
    const timestamp = new Date(startDate);
    timestamp.setUTCDate(startDate.getUTCDate() + index);

    return {
      id: `demo-${String(day).padStart(3, "0")}`,
      caption: `Day ${day} の記録です。小さな積み重ねを EPUB にまとめるデモ投稿です。 #100日チャレンジ #demo`,
      media_url: createPostImageDataUrl(day),
      permalink: `https://www.instagram.com/p/demo${String(day).padStart(3, "0")}/`,
      timestamp: timestamp.toISOString(),
      selected: true,
      like_count: 20 + day,
      comments_count: (day % 8) + 1,
    };
  }),
};
