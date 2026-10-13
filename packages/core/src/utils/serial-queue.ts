/**
 * Serializes async tasks so they never overlap: each call to `run()` waits
 * for every previously queued task on the same instance to settle before
 * starting. Intended for read-modify-write cycles against a single shared
 * resource (e.g. rewriting a whole JSON file) where two concurrent callers
 * would otherwise interleave and the later write could silently clobber
 * the earlier one's change.
 *
 * A rejected task does not jam the queue: the failure propagates through
 * that task's own returned promise, but the next queued task still runs.
 */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve()

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task)
    this.tail = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
}
