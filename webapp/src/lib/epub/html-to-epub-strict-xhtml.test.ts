/**
 * @file html-to-epub patched behavior tests.
 */
import { describe, expect, test } from "vitest";
import { EPub } from "@lesjoursfr/html-to-epub";

function renderChapterData(strictXhtml?: boolean): string {
  const epub = new EPub(
    {
      title: "Sample Title",
      description: "Sample Description",
      strictXhtml,
      content: [
        {
          title: "Chapter 1",
          data: '<p>hello<img src="https://example.com/sample.jpg" alt="sample"><br><hr></p>',
        },
      ],
    },
    "/tmp/sample.epub",
  );

  return epub.content[0]?.data ?? "";
}

describe("html-to-epub strictXhtml option", () => {
  test("strictXhtml OFF (default) では従来どおり非self-closingのvoid elementを維持する", () => {
    const html = renderChapterData();

    expect(html).toMatch(/<img\b[^>]*>/);
    expect(html).toMatch(/<br>/);
    expect(html).toMatch(/<hr>/);
    expect(html).not.toMatch(/<img\b[^>]*\/>/);
    expect(html).not.toMatch(/<br\s*\/>/);
    expect(html).not.toMatch(/<hr\s*\/>/);
  });

  test("strictXhtml ON の場合のみvoid elementをself-closingで出力する", () => {
    const html = renderChapterData(true);

    expect(html).toMatch(/<img\b[^>]*\/>/);
    expect(html).toMatch(/<br\s*\/>/);
    expect(html).toMatch(/<hr\s*\/>/);
  });
});
