import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeRepeatableTask } from "../src/services/tasksService";

vi.mock("../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { supabase } from "../src/lib/supabase";

describe("completeRepeatableTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores rescheduled due_date in YYYY-MM-DD format", async () => {
    (
      supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const task = {
      id: "task-1",
      user_id: "user-1",
      is_repeatable: true,
      repeat_frequency: "daily",
      repeat_interval: 1,
      due_date: "2026-03-14",
      status: "done",
    };

    const fetchChain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };
    fetchChain.select.mockReturnValue(fetchChain);
    fetchChain.eq.mockReturnValue(fetchChain);
    fetchChain.single.mockResolvedValue({ data: task, error: null });

    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);
    updateChain.single.mockResolvedValue({
      data: { ...task, status: "todo", due_date: "2026-03-15" },
      error: null,
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(updateChain);

    const result = await completeRepeatableTask("task-1");

    expect(result.error).toBeNull();
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "todo",
        due_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );

    const updatePayload = updateChain.update.mock.calls[0][0] as {
      due_date: string;
    };
    expect(updatePayload.due_date).not.toContain("T");
  });
});
