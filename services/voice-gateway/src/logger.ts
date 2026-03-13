type Level = "debug" | "info" | "warn" | "error"

const levelPriority: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const minLevel: Level = (process.env.LOG_LEVEL as Level) || "info"

export function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (levelPriority[level] < levelPriority[minLevel]) return
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry))
}

