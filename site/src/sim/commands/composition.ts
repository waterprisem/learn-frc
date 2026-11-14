/** When each child of a command group starts and ends, for the four WPILib compositions. Times in seconds. */
export type CompositionKind = 'sequence' | 'parallel' | 'race' | 'deadline';

export interface Child {
  name: string;
  /** How long the command takes to finish by itself. */
  duration: number;
}

export interface Bar {
  name: string;
  start: number;
  end: number;
  /** True when the group cancelled this child before it finished by itself: end(true). */
  cancelled: boolean;
}

export interface GroupRun {
  bars: Bar[];
  end: number;
}

export function runComposition(kind: CompositionKind, children: Child[], deadlineIndex = 0): GroupRun {
  if (kind === 'sequence') {
    let t = 0;
    const bars = children.map((c) => {
      const bar = { name: c.name, start: t, end: t + c.duration, cancelled: false };
      t = bar.end;
      return bar;
    });
    return { bars, end: t };
  }
  const longest = Math.max(...children.map((c) => c.duration));
  const shortest = Math.min(...children.map((c) => c.duration));
  const end = kind === 'parallel' ? longest : kind === 'race' ? shortest : children[deadlineIndex].duration;
  const bars = children.map((c) => ({
    name: c.name,
    start: 0,
    end: Math.min(c.duration, end),
    cancelled: c.duration > end,
  }));
  return { bars, end };
}
