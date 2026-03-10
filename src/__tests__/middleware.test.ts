// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
}));

const mockNext = vi.fn();
const mockJson = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => mockNext(),
    json: (body: unknown, init?: ResponseInit) => mockJson(body, init),
  },
}));

import { middleware } from "@/middleware";
import { verifySession } from "@/lib/auth";

const mockVerifySession = vi.mocked(verifySession);

function makeRequest(pathname: string) {
  return {
    nextUrl: { pathname },
  } as Parameters<typeof middleware>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNext.mockReturnValue({ type: "next" });
  mockJson.mockImplementation((body, init) => ({ body, status: init?.status }));
});

describe("middleware", () => {
  describe("protected paths — unauthenticated", () => {
    test("returns 401 for /api/projects when no session", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/api/projects"));

      expect(mockJson).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("returns 401 for /api/filesystem when no session", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/api/filesystem"));

      expect(mockJson).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("returns 401 for sub-paths of /api/projects", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/api/projects/abc123"));

      expect(mockJson).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
    });

    test("returns 401 for sub-paths of /api/filesystem", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/api/filesystem/somefile.ts"));

      expect(mockJson).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
    });
  });

  describe("protected paths — authenticated", () => {
    test("passes through /api/projects when session exists", async () => {
      mockVerifySession.mockResolvedValue({ userId: "u1" } as never);

      await middleware(makeRequest("/api/projects"));

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    test("passes through /api/filesystem when session exists", async () => {
      mockVerifySession.mockResolvedValue({ userId: "u1" } as never);

      await middleware(makeRequest("/api/filesystem"));

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("unprotected paths", () => {
    test("passes through /api/chat without a session", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/api/chat"));

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    test("passes through / without a session", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/"));

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    test("passes through a project route without a session", async () => {
      mockVerifySession.mockResolvedValue(null);

      await middleware(makeRequest("/some-project-id"));

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });
});
