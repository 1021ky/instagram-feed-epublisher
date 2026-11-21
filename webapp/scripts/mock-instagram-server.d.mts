import type http from "node:http";

export function buildDeterministicMockMedia(baseDate?: Date): Array<{
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}>;

export function createMockInstagramHandler(options?: {
  baseDate?: Date;
}): (request: Request) => Promise<Response>;

export function createMockInstagramServer(options?: {
  baseDate?: Date;
  baseUrl?: string;
}): http.Server;
