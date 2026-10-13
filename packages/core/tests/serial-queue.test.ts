import { describe, expect, it } from "vitest"

import { SerialQueue } from "../src/utils/serial-queue"

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("SerialQueue", () => {
  it("runs queued tasks one at a time, in call order, even when later tasks are faster", async () => {
    const queue = new SerialQueue()
    const events: string[] = []

    const first = queue.run(async () => {
      events.push("first:start")
      await delay(20)
      events.push("first:end")
      return "first"
    })
    const second = queue.run(async () => {
      events.push("second:start")
      await delay(1)
      events.push("second:end")
      return "second"
    })

    expect(await first).toBe("first")
    expect(await second).toBe("second")
    // If the two tasks were allowed to run concurrently, "second:start"
    // would appear before "first:end" because the second task's delay is
    // much shorter. Serialization means first must fully finish first.
    expect(events).toEqual(["first:start", "first:end", "second:start", "second:end"])
  })

  it("simulates a read-modify-write race: without the queue, an interleaved write loses data", async () => {
    // Models workspace.json: a shared list that each task reads, appends
    // one entry to, then writes back in full.
    let sharedList: string[] = []
    const queue = new SerialQueue()

    async function appendEntry(entry: string): Promise<void> {
      const current = [...sharedList] // "read"
      await delay(entry === "A" ? 15 : 1) // A is slower, like a bigger file
      current.push(entry) // "modify"
      sharedList = current // "write" (whole-list overwrite)
    }

    // Two overlapping calls queued through the same SerialQueue must not
    // lose either entry, regardless of relative timing.
    const a = queue.run(() => appendEntry("A"))
    const b = queue.run(() => appendEntry("B"))
    await Promise.all([a, b])

    expect(sharedList.sort()).toEqual(["A", "B"])
  })

  it("does not jam the queue when a task rejects — later tasks still run", async () => {
    const queue = new SerialQueue()
    const failing = queue.run(async () => {
      throw new Error("boom")
    })
    const after = queue.run(async () => "still runs")

    await expect(failing).rejects.toThrow("boom")
    await expect(after).resolves.toBe("still runs")
  })

  it("resolves each call with its own task's result, not another queued task's", async () => {
    const queue = new SerialQueue()
    const results = await Promise.all([
      queue.run(async () => {
        await delay(5)
        return 1
      }),
      queue.run(async () => 2),
      queue.run(async () => 3),
    ])
    expect(results).toEqual([1, 2, 3])
  })
})
