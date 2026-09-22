const SUPPORTED_EVENTS = new Set(['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']);

export function parseHookEvent(input) {
  let event;
  try {
    event = typeof input === 'string' ? JSON.parse(input) : input;
  } catch {
    throw new Error('hook input must be valid JSON');
  }
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('hook input must be a JSON object');
  }
  if (!SUPPORTED_EVENTS.has(event.hook_event_name)) {
    throw new Error('hook_event_name is unsupported');
  }
  if (typeof event.cwd !== 'string' || !event.cwd.trim()) {
    throw new Error('hook cwd is required');
  }
  return event;
}
