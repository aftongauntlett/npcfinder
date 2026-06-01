import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

type SeedUser = {
  label: string;
  email: string;
  password: string;
};

type AuthAdminUser = {
  id: string;
  email?: string;
};

type JsonObject = Record<string, unknown>;

function env(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function requireEnv(...keys: string[]): string {
  const value = env(...keys);
  if (!value) {
    throw new Error(`Missing env var. Expected one of: ${keys.join(", ")}`);
  }
  return value;
}

async function parseJsonResponse(response: Response): Promise<JsonObject> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as JsonObject;
  } catch {
    return { raw: text };
  }
}

async function getUserByEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<AuthAdminUser | null> {
  let page = 1;

  while (page <= 10) {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=100`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const payload = await parseJsonResponse(response);
      throw new Error(
        `Failed to list users (status ${response.status}): ${JSON.stringify(payload)}`,
      );
    }

    const payload = (await parseJsonResponse(response)) as {
      users?: AuthAdminUser[];
    };
    const users = Array.isArray(payload.users) ? payload.users : [];

    const found = users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (found) {
      return found;
    }

    if (users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function createUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  user: SeedUser,
): Promise<AuthAdminUser> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        display_name: `${user.label} Security Test`,
      },
    }),
  });

  const payload = (await parseJsonResponse(response)) as AuthAdminUser;

  if (!response.ok || !payload.id) {
    throw new Error(
      `Failed to create ${user.label} (${user.email}) status ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

async function updateUserPassword(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  user: SeedUser,
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        display_name: `${user.label} Security Test`,
      },
    }),
  });

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new Error(
      `Failed to update ${user.label} (${user.email}) status ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
}

async function verifyLogin(
  supabaseUrl: string,
  anonKey: string | undefined,
  user: SeedUser,
): Promise<void> {
  if (!anonKey) {
    return;
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    },
  );

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new Error(
      `Failed login verification for ${user.label} (${user.email}) status ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
}

async function ensureSeedUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  anonKey: string | undefined,
  user: SeedUser,
): Promise<AuthAdminUser> {
  const existingUser = await getUserByEmail(
    supabaseUrl,
    serviceRoleKey,
    user.email,
  );

  if (!existingUser) {
    const createdUser = await createUser(supabaseUrl, serviceRoleKey, user);
    await verifyLogin(supabaseUrl, anonKey, user);
    return createdUser;
  }

  await updateUserPassword(supabaseUrl, serviceRoleKey, existingUser.id, user);
  await verifyLogin(supabaseUrl, anonKey, user);
  return existingUser;
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRoleKey = requireEnv(
    "SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const anonKey = env(
    "ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
  );

  const users: SeedUser[] = [
    {
      label: "User A",
      email: requireEnv("USER_A_EMAIL", "TEST_RLS_USER_A_EMAIL"),
      password: requireEnv("USER_A_PASSWORD", "TEST_RLS_USER_A_PASSWORD"),
    },
    {
      label: "User B",
      email: requireEnv("USER_B_EMAIL", "TEST_RLS_USER_B_EMAIL"),
      password: requireEnv("USER_B_PASSWORD", "TEST_RLS_USER_B_PASSWORD"),
    },
    {
      label: "User C",
      email: requireEnv("USER_C_EMAIL", "TEST_RLS_USER_C_EMAIL"),
      password: requireEnv("USER_C_PASSWORD", "TEST_RLS_USER_C_PASSWORD"),
    },
  ];

  const results: Array<{ label: string; id: string; email: string }> = [];

  for (const user of users) {
    const result = await ensureSeedUser(
      supabaseUrl,
      serviceRoleKey,
      anonKey,
      user,
    );

    results.push({
      label: user.label,
      id: result.id,
      email: user.email,
    });
  }

  console.log("Backend security test users ready:");
  for (const result of results) {
    console.log(`- ${result.label}: ${result.email} (${result.id})`);
  }
  console.log(
    "Roles are not changed by this script. Keep role assignment in admin tooling if needed.",
  );
}

main().catch((error) => {
  console.error("Failed to seed backend security test users:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
