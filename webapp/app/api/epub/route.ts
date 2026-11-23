/**
 * @file EPUB生成API。
 */
import { getLogger } from "@/lib/logger";
import { resolveInstagramAccessToken } from "@/lib/auth/session-service";
import { generateFeedEpub } from "@/lib/epub/epub-generation-service";
import { createEpubDownloadResponse, toEpubErrorResponse } from "@/lib/epub/http-response";
import { parseEpubRequestPayload } from "@/lib/epub/epub-request.schema";

const logger = getLogger("api.epub");

export const runtime = "nodejs";

/**
 * ユーザーのInstagramフィードからEPUBを生成します。
 */
export async function POST(request: Request) {
  try {
    const payload = parseEpubRequestPayload(await request.json());

    logger.info("EPUB generation started", {
      filter: payload.filter,
      title: payload.metadata.title,
    });

    const accessToken = await resolveInstagramAccessToken(request);
    const { buffer, itemCount } = await generateFeedEpub({ accessToken, payload });

    logger.info("EPUB generation completed", { itemCount });
    return createEpubDownloadResponse(buffer, "instagram-feed.epub");
  } catch (error) {
    return toEpubErrorResponse(error, logger, "EPUB generation failed");
  }
}
