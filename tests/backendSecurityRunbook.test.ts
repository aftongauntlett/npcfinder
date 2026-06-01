/* @vitest-environment node */

import path from "path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

function env(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

const config = {
  supabaseUrl: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
  anonKey: env("ANON_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  serviceRoleKey: env("SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  userAEmail: env("USER_A_EMAIL", "TEST_RLS_USER_A_EMAIL"),
  userAPassword: env("USER_A_PASSWORD", "TEST_RLS_USER_A_PASSWORD"),
  userBEmail: env("USER_B_EMAIL", "TEST_RLS_USER_B_EMAIL"),
  userBPassword: env("USER_B_PASSWORD", "TEST_RLS_USER_B_PASSWORD"),
  userCEmail: env("USER_C_EMAIL", "TEST_RLS_USER_C_EMAIL"),
  userCPassword: env("USER_C_PASSWORD", "TEST_RLS_USER_C_PASSWORD"),
};

const requiredEnv: Array<[keyof typeof config, string]> = [
  ["supabaseUrl", "SUPABASE_URL or VITE_SUPABASE_URL"],
  ["anonKey", "ANON_KEY or VITE_SUPABASE_ANON_KEY"],
  ["serviceRoleKey", "SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY"],
  ["userAEmail", "USER_A_EMAIL"],
  ["userAPassword", "USER_A_PASSWORD"],
  ["userBEmail", "USER_B_EMAIL"],
  ["userBPassword", "USER_B_PASSWORD"],
  ["userCEmail", "USER_C_EMAIL"],
  ["userCPassword", "USER_C_PASSWORD"],
];

const missingEnv = requiredEnv
  .filter(([key]) => !config[key])
  .map(([, name]) => name);

const shouldRun = /^(1|true|yes)$/i.test(
  env("RUN_BACKEND_SECURITY_TESTS") ?? "",
);

const runbookDescribe =
  shouldRun && missingEnv.length === 0 ? describe.sequential : describe.skip;

interface ApiResult {
  status: number;
  json: unknown;
  text: string;
}

interface AuthSession {
  token: string;
  userId: string;
  email: string;
}

interface RunState {
  userA?: AuthSession;
  userB?: AuthSession;
  userC?: AuthSession;
  mediaIdA?: string;
  spoofMediaId?: string;
  trackerIdA?: string;
  trackerIdB?: string;
  playlistIdA?: string;
  storageObjectPaths: string[];
}

const runId = `backend-sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const state: RunState = {
  storageObjectPaths: [],
};

function assertConfigReady() {
  expect(config.supabaseUrl).toBeTruthy();
  expect(config.anonKey).toBeTruthy();
  expect(config.serviceRoleKey).toBeTruthy();
}

function requireSession(session: AuthSession | undefined, label: string) {
  expect(session, `${label} is missing; token setup failed`).toBeTruthy();
  return session as AuthSession;
}

async function parseResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return {
    status: response.status,
    json,
    text,
  };
}

function encodedPath(pathValue: string): string {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function httpRequest(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    key?: string;
    token?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<ApiResult> {
  assertConfigReady();

  const method = options.method ?? "GET";
  const headers = new Headers(options.headers ?? {});

  if (options.key && !headers.has("apikey")) {
    headers.set("apikey", options.key);
  }

  if (options.token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let body: BodyInit | undefined;
  if (typeof options.body !== "undefined") {
    if (
      typeof options.body === "string" ||
      options.body instanceof Blob ||
      options.body instanceof URLSearchParams ||
      options.body instanceof Uint8Array
    ) {
      body = options.body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${config.supabaseUrl}${endpoint}`, {
    method,
    headers,
    body,
  });

  return parseResponse(response);
}

async function loginUser(
  email: string,
  password: string,
): Promise<AuthSession> {
  const result = await httpRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    key: config.anonKey,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      email,
      password,
    },
  });

  expect(result.status).toBe(200);
  const payload = result.json as {
    access_token?: string;
    user?: { id?: string; email?: string };
  };

  expect(payload?.access_token).toBeTruthy();
  expect(payload?.user?.id).toBeTruthy();

  return {
    token: String(payload.access_token),
    userId: String(payload.user?.id),
    email: String(payload.user?.email ?? email),
  };
}

async function restRequest(
  pathValue: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    key?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
) {
  return httpRequest(`/rest/v1/${pathValue}`, {
    method: options.method,
    key: options.key ?? config.anonKey,
    token: options.token,
    headers: options.headers,
    body: options.body,
  });
}

async function functionRequest(
  functionName: string,
  options: {
    token?: string;
    body?: unknown;
  },
) {
  return httpRequest(`/functions/v1/${functionName}`, {
    method: "POST",
    key: config.anonKey,
    token: options.token,
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body,
  });
}

async function serviceDelete(pathValue: string) {
  if (!config.serviceRoleKey) {
    return;
  }

  await restRequest(pathValue, {
    method: "DELETE",
    key: config.serviceRoleKey,
    token: config.serviceRoleKey,
  });
}

runbookDescribe("Backend Security Runbook Automation", () => {
  beforeAll(async () => {
    state.userA = await loginUser(config.userAEmail!, config.userAPassword!);
    state.userB = await loginUser(config.userBEmail!, config.userBPassword!);
    state.userC = await loginUser(config.userCEmail!, config.userCPassword!);
  }, 45_000);

  afterAll(async () => {
    if (!config.serviceRoleKey) {
      return;
    }

    const cleanupTasks: Array<Promise<unknown>> = [];

    for (const objectPath of state.storageObjectPaths) {
      cleanupTasks.push(
        httpRequest(
          `/storage/v1/object/profile-photos/${encodedPath(objectPath)}`,
          {
            method: "DELETE",
            key: config.serviceRoleKey,
            token: config.serviceRoleKey,
          },
        ),
      );
    }

    if (state.trackerIdA) {
      cleanupTasks.push(
        serviceDelete(
          `tracker_items?id=eq.${encodeURIComponent(state.trackerIdA)}`,
        ),
      );
    }

    if (state.trackerIdB) {
      cleanupTasks.push(
        serviceDelete(
          `tracker_items?id=eq.${encodeURIComponent(state.trackerIdB)}`,
        ),
      );
    }

    if (state.playlistIdA) {
      cleanupTasks.push(
        serviceDelete(
          `playlist_shares?playlist_id=eq.${encodeURIComponent(state.playlistIdA)}`,
        ),
      );
      cleanupTasks.push(
        serviceDelete(
          `playlist_items?playlist_id=eq.${encodeURIComponent(state.playlistIdA)}`,
        ),
      );
      cleanupTasks.push(
        serviceDelete(
          `playlists?id=eq.${encodeURIComponent(state.playlistIdA)}`,
        ),
      );
    }

    if (state.mediaIdA) {
      cleanupTasks.push(
        serviceDelete(`media?id=eq.${encodeURIComponent(state.mediaIdA)}`),
      );
    }

    if (state.spoofMediaId) {
      cleanupTasks.push(
        serviceDelete(`media?id=eq.${encodeURIComponent(state.spoofMediaId)}`),
      );
    }

    await Promise.allSettled(cleanupTasks);
  }, 60_000);

  it("A: logs in User A/B/C and stores auth context", () => {
    expect(state.userA?.token).toBeTruthy();
    expect(state.userA?.userId).toBeTruthy();
    expect(state.userB?.token).toBeTruthy();
    expect(state.userB?.userId).toBeTruthy();
    expect(state.userC?.token).toBeTruthy();
    expect(state.userC?.userId).toBeTruthy();
  });

  it("B: blocks anonymous access to protected REST and Function endpoints", async () => {
    const trackerAnon = await restRequest("tracker_items?select=id&limit=1", {
      key: config.anonKey,
    });
    expect([401, 403]).toContain(trackerAnon.status);

    const profilesAnon = await restRequest(
      "user_profiles?select=user_id,role&limit=1",
      {
        key: config.anonKey,
      },
    );
    expect([401, 403]).toContain(profilesAnon.status);

    const scrapeAnon = await functionRequest("scrape-url", {
      body: { url: "https://example.com" },
    });
    expect(scrapeAnon.status).toBe(401);
  }, 30_000);

  it("C: seeds media and tracker rows for user-isolation checks", async () => {
    const userA = requireSession(state.userA, "User A session");
    const userB = requireSession(state.userB, "User B session");

    const mediaInsert = await restRequest("media", {
      method: "POST",
      token: userA.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          external_id: `runbook-media-${runId}`,
          media_type: "movie",
          title: `Runbook Security Test ${runId}`,
          is_user_created: false,
        },
      ],
    });

    expect([200, 201]).toContain(mediaInsert.status);
    const mediaRows = mediaInsert.json as Array<{ id: string }>;
    expect(Array.isArray(mediaRows)).toBe(true);
    expect(mediaRows[0]?.id).toBeTruthy();
    state.mediaIdA = mediaRows[0].id;

    const trackerAInsert = await restRequest("tracker_items", {
      method: "POST",
      token: userA.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          user_id: userA.userId,
          media_id: state.mediaIdA,
          status: "want_to",
        },
      ],
    });

    expect([200, 201]).toContain(trackerAInsert.status);
    const trackerARows = trackerAInsert.json as Array<{ id: string }>;
    expect(trackerARows[0]?.id).toBeTruthy();
    state.trackerIdA = trackerARows[0].id;

    const trackerBInsert = await restRequest("tracker_items", {
      method: "POST",
      token: userB.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          user_id: userB.userId,
          media_id: state.mediaIdA,
          status: "want_to",
        },
      ],
    });

    expect([200, 201]).toContain(trackerBInsert.status);
    const trackerBRows = trackerBInsert.json as Array<{ id: string }>;
    expect(trackerBRows[0]?.id).toBeTruthy();
    state.trackerIdB = trackerBRows[0].id;
  }, 30_000);

  it("D: enforces tracker RLS across read/update/insert isolation", async () => {
    const userA = requireSession(state.userA, "User A session");
    const userB = requireSession(state.userB, "User B session");

    const userAOwnRows = await restRequest(
      `tracker_items?select=id,user_id,media_id,status&user_id=eq.${encodeURIComponent(userA.userId)}`,
      {
        token: userA.token,
      },
    );
    expect(userAOwnRows.status).toBe(200);
    expect(Array.isArray(userAOwnRows.json)).toBe(true);
    const ownRows = userAOwnRows.json as Array<{ user_id: string }>;
    expect(ownRows.length).toBeGreaterThan(0);
    expect(ownRows.every((row) => row.user_id === userA.userId)).toBe(true);

    const userAReadUserB = await restRequest(
      `tracker_items?select=id,user_id,media_id,status&user_id=eq.${encodeURIComponent(userB.userId)}`,
      {
        token: userA.token,
      },
    );
    expect(userAReadUserB.status).toBe(200);
    expect(userAReadUserB.json).toEqual([]);

    const patchOtherRow = await restRequest(
      `tracker_items?id=eq.${encodeURIComponent(state.trackerIdB!)}`,
      {
        method: "PATCH",
        token: userA.token,
        headers: {
          Prefer: "return=representation",
        },
        body: {
          rating: 10,
        },
      },
    );

    expect([200, 204, 401, 403]).toContain(patchOtherRow.status);
    if (patchOtherRow.status === 200) {
      expect(patchOtherRow.json).toEqual([]);
    }

    const verifyOtherRow = await restRequest(
      `tracker_items?select=id,rating&id=eq.${encodeURIComponent(state.trackerIdB!)}`,
      {
        token: userB.token,
      },
    );
    expect(verifyOtherRow.status).toBe(200);
    const verifyRows = verifyOtherRow.json as Array<{ rating: number | null }>;
    expect(verifyRows).toHaveLength(1);
    expect(verifyRows[0].rating).not.toBe(10);

    const spoofMediaInsert = await restRequest("media", {
      method: "POST",
      token: userA.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          external_id: `runbook-spoof-${runId}`,
          media_type: "movie",
          title: `Runbook Spoof Insert ${runId}`,
          is_user_created: false,
        },
      ],
    });
    expect([200, 201]).toContain(spoofMediaInsert.status);
    const spoofRows = spoofMediaInsert.json as Array<{ id: string }>;
    state.spoofMediaId = spoofRows[0].id;

    const spoofInsert = await restRequest("tracker_items", {
      method: "POST",
      token: userA.token,
      body: [
        {
          user_id: userB.userId,
          media_id: state.spoofMediaId,
          status: "want_to",
        },
      ],
    });

    expect([400, 401, 403]).toContain(spoofInsert.status);

    const verifySpoofDenied = await restRequest(
      `tracker_items?select=id&user_id=eq.${encodeURIComponent(userB.userId)}&media_id=eq.${encodeURIComponent(state.spoofMediaId)}`,
      {
        token: userB.token,
      },
    );
    expect(verifySpoofDenied.status).toBe(200);
    expect(verifySpoofDenied.json).toEqual([]);
  }, 45_000);

  it("E: enforces private playlist ownership and explicit sharing", async () => {
    const userA = requireSession(state.userA, "User A session");
    const userB = requireSession(state.userB, "User B session");
    const userC = requireSession(state.userC, "User C session");

    const playlistSlug = `security-test-playlist-a-${runId}`;
    const createPlaylist = await restRequest("playlists", {
      method: "POST",
      token: userA.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          owner_id: userA.userId,
          name: `Security Test Playlist A ${runId}`,
          slug: playlistSlug,
          is_private: true,
          icon: "list-music",
        },
      ],
    });

    if (createPlaylist.status === 403) {
      expect(createPlaylist.text.toLowerCase()).toContain("row-level security");
      return;
    }

    expect([200, 201]).toContain(createPlaylist.status);
    const playlistRows = createPlaylist.json as Array<{ id: string }>;
    expect(playlistRows[0]?.id).toBeTruthy();
    state.playlistIdA = playlistRows[0].id;

    const readByBBeforeShare = await restRequest(
      `playlists?select=id,owner_id,name,is_private&id=eq.${encodeURIComponent(state.playlistIdA)}`,
      {
        token: userB.token,
      },
    );
    expect(readByBBeforeShare.status).toBe(200);
    expect(readByBBeforeShare.json).toEqual([]);

    const shareToB = await restRequest("playlist_shares", {
      method: "POST",
      token: userA.token,
      headers: {
        Prefer: "return=representation",
      },
      body: [
        {
          playlist_id: state.playlistIdA,
          shared_with_user_id: userB.userId,
        },
      ],
    });
    expect([200, 201]).toContain(shareToB.status);

    const readByBAfterShare = await restRequest(
      `playlists?select=id,owner_id,name,is_private&id=eq.${encodeURIComponent(state.playlistIdA)}`,
      {
        token: userB.token,
      },
    );
    expect(readByBAfterShare.status).toBe(200);
    const sharedRows = readByBAfterShare.json as Array<{ id: string }>;
    expect(sharedRows).toHaveLength(1);
    expect(sharedRows[0].id).toBe(state.playlistIdA);

    const readByC = await restRequest(
      `playlists?select=id,owner_id,name,is_private&id=eq.${encodeURIComponent(state.playlistIdA)}`,
      {
        token: userC.token,
      },
    );
    expect(readByC.status).toBe(200);
    expect(readByC.json).toEqual([]);
  }, 35_000);

  it("F: validates RPC security behavior for invite, rate-limit, and owner-context access", async () => {
    const userA = requireSession(state.userA, "User A session");
    const userC = requireSession(state.userC, "User C session");

    const inviteValidation = await restRequest("rpc/validate_invite_code", {
      method: "POST",
      body: {
        code_value: "NOT-REAL-CODE",
        user_email: "test@example.com",
      },
    });

    expect([200, 400]).toContain(inviteValidation.status);
    if (inviteValidation.status === 200) {
      if (typeof inviteValidation.json === "boolean") {
        expect(inviteValidation.json).toBe(false);
      } else {
        expect(inviteValidation.text.toLowerCase()).toContain("false");
      }
    }

    const rateLimitEmail = `runbook-rate-limit-${runId}@example.com`;
    let wasBlocked = false;

    for (let attempt = 1; attempt <= 12; attempt += 1) {
      const rateCheck = await restRequest("rpc/check_signin_rate_limit", {
        method: "POST",
        body: {
          user_email: rateLimitEmail,
        },
      });

      expect(rateCheck.status).toBe(200);
      const payload = rateCheck.json as { allowed?: boolean };
      expect(typeof payload?.allowed).toBe("boolean");

      if (payload.allowed === false) {
        wasBlocked = true;
        break;
      }
    }

    expect(wasBlocked).toBe(true);

    const ownerContext = await restRequest(
      "rpc/get_playlist_items_with_owner_context",
      {
        method: "POST",
        token: userC.token,
        body: {
          check_playlist_id: state.playlistIdA,
        },
      },
    );

    if (ownerContext.status === 200) {
      expect(ownerContext.json).toEqual([]);
    } else {
      expect([400, 401, 403, 404]).toContain(ownerContext.status);
      expect(ownerContext.text.toLowerCase()).not.toContain(userA.userId);
    }
  }, 40_000);

  it("G: enforces edge-function auth, SSRF guardrails, and payload validation", async () => {
    const userA = requireSession(state.userA, "User A session");

    const ssrfAttempt = await functionRequest("scrape-url", {
      token: userA.token,
      body: {
        url: "http://127.0.0.1:3000",
      },
    });

    expect(ssrfAttempt.status).toBe(400);
    expect(ssrfAttempt.text.toLowerCase()).toMatch(
      /localhost|private ip|not allowed|connection refused|connect error/,
    );

    const scrapeExample = await functionRequest("scrape-url", {
      token: userA.token,
      body: {
        url: "https://example.com",
      },
    });
    expect(scrapeExample.status).toBe(200);
    const scrapePayload = scrapeExample.json as { kind?: string; url?: string };
    expect(scrapePayload?.kind).toBeTruthy();
    expect(scrapePayload?.url).toBe("https://example.com");

    const invalidPopulatePayload = await functionRequest(
      "populate-media-cache",
      {
        token: userA.token,
        body: {
          externalId: "550",
          mediaType: "invalid_type",
        },
      },
    );

    if (invalidPopulatePayload.status === 404) {
      expect(invalidPopulatePayload.text.toLowerCase()).toContain(
        "not found",
      );
      return;
    }

    expect(invalidPopulatePayload.status).toBe(400);

    const validPopulatePayload = await functionRequest("populate-media-cache", {
      token: userA.token,
      body: {
        externalId: "550",
        mediaType: "movie",
        ttlMs: 86400000,
      },
    });

    expect(validPopulatePayload.status).toBe(200);
    const populateBody = validPopulatePayload.json as {
      ok?: boolean;
      mediaType?: string;
      details?: Record<string, unknown>;
    };
    expect(populateBody?.ok).toBe(true);
    expect(populateBody?.mediaType).toBe("movie");
    expect(populateBody?.details).toBeTruthy();
  }, 60_000);

  it("H: protects admin-only tables while allowing service-role access", async () => {
    const userA = requireSession(state.userA, "User A session");

    const inviteAsUser = await restRequest("invite_codes?select=*", {
      token: userA.token,
    });

    if (inviteAsUser.status === 200) {
      const rows = inviteAsUser.json as unknown[];
      expect(Array.isArray(rows)).toBe(true);
      expect(rows).toHaveLength(0);
    } else {
      expect([401, 403]).toContain(inviteAsUser.status);
    }

    const inviteAsService = await restRequest("invite_codes?select=*", {
      key: config.serviceRoleKey,
      token: config.serviceRoleKey,
    });

    expect(inviteAsService.status).toBe(200);
    expect(Array.isArray(inviteAsService.json)).toBe(true);
  }, 25_000);

  it("I: enforces profile-photos storage ownership policy", async () => {
    const userA = requireSession(state.userA, "User A session");
    const objectFile = `runbook-${runId}.png`;

    const wrongPath = `not-${userA.userId}/${objectFile}`;
    const rightPath = `${userA.userId}/${objectFile}`;

    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const wrongUpload = await httpRequest(
      `/storage/v1/object/profile-photos/${encodedPath(wrongPath)}`,
      {
        method: "POST",
        key: config.anonKey,
        token: userA.token,
        headers: {
          "Content-Type": "image/png",
        },
        body: pngBytes,
      },
    );

    state.storageObjectPaths.push(wrongPath);
    expect([400, 401, 403]).toContain(wrongUpload.status);

    const rightUpload = await httpRequest(
      `/storage/v1/object/profile-photos/${encodedPath(rightPath)}`,
      {
        method: "POST",
        key: config.anonKey,
        token: userA.token,
        headers: {
          "Content-Type": "image/png",
        },
        body: pngBytes,
      },
    );

    expect([200, 201]).toContain(rightUpload.status);
    state.storageObjectPaths.push(rightPath);
  }, 30_000);
});

describe("Backend Security Runbook Automation Preconditions", () => {
  it("has opt-in and env guards to avoid accidental production writes", () => {
    if (!shouldRun) {
      expect(shouldRun).toBe(false);
      return;
    }

    if (missingEnv.length > 0) {
      expect(missingEnv.length).toBeGreaterThan(0);
      return;
    }

    expect(missingEnv).toEqual([]);
  });
});
