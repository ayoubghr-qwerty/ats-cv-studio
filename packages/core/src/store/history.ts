export interface HistoryOptions {
  mergeWindowMs?: number
  maxHistory?: number
}

/**
 * Immutable-state history stack with undo/redo and optional typing grouping.
 * States are treated as immutable snapshots produced by callers.
 */
export class History<T> {
  private past: T[] = []
  private future: T[] = []
  private state: T
  private lastCommitAt = 0
  private lastGroup = ""

  constructor(
    initialState: T,
    private readonly opts: HistoryOptions = {},
  ) {
    this.state = initialState
  }

  get current(): T {
    return this.state
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  get depth(): number {
    return this.past.length
  }

  /**
   * Records a new state. When `group` matches the previous commit and it
   * happened within `mergeWindowMs`, no new checkpoint is pushed: the first
   * commit of the group already recorded the pre-group state, so a single
   * undo restores the state before the whole group (typing-friendly).
   */
  commit(next: T, group?: string): void {
    if (next === this.state) return
    const now = Date.now()
    const mergeable =
      !!group &&
      group === this.lastGroup &&
      now - this.lastCommitAt < (this.opts.mergeWindowMs ?? 800)
    if (!mergeable) {
      this.past.push(this.state)
      if (this.past.length > (this.opts.maxHistory ?? 100)) {
        this.past.shift()
      }
      this.lastGroup = group ?? ""
      this.lastCommitAt = now
    }
    this.future = []
    this.state = next
  }

  undo(): T | null {
    if (this.past.length === 0) return null
    this.future.push(this.state)
    this.state = this.past.pop() as T
    return this.state
  }

  redo(): T | null {
    if (this.future.length === 0) return null
    this.past.push(this.state)
    this.state = this.future.pop() as T
    return this.state
  }

  reset(next: T): void {
    this.past = []
    this.future = []
    this.state = next
    this.lastGroup = ""
    this.lastCommitAt = 0
  }
}
