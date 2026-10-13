export interface Debounced<Args extends unknown[]> {
  (...args: Args): void
  cancel: () => void
  flush: () => void
  isPending: () => boolean
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Args | undefined
  const run = () => {
    timer = undefined
    if (lastArgs) fn(...lastArgs)
    lastArgs = undefined
  }
  const debounced = (...args: Args) => {
    lastArgs = args
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(run, delayMs)
  }
  debounced.cancel = () => {
    lastArgs = undefined
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  debounced.flush = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      run()
    }
  }
  debounced.isPending = () => timer !== undefined
  return debounced
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Operation timed out")), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
