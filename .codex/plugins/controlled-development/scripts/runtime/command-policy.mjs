import { RULE_IDS } from './enforcement-rule-ids.mjs';

const READ_ONLY_PATTERNS = [
  /^git\s+(?:status|diff|show|log|rev-parse|branch\s+--show-current)(?:\s|$)/i,
  /^rg(?:\s|$)/i,
  /^(?:Get-Content|Select-String|Get-ChildItem)(?:\s|$)/i,
  /^(?:node|npm|npx|python|python3|pwsh|powershell)\s+--version(?:\s|$)/i,
];

export function authorizeCommand(command, grants = [], platform = process.platform) {
  if (typeof command !== 'string' || !command.trim()) return result(false, RULE_IDS.COMMAND_NOT_GRANTED, command);
  const normalized = command.trim().replace(/\s+/g, ' ');
  if (hasCompoundSyntax(command)) return result(false, RULE_IDS.COMMAND_COMPOUND_DENY, normalized);
  if (READ_ONLY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return result(true, RULE_IDS.COMMAND_READ_ALLOWED, normalized);
  }
  const granted = grants.some((grant) => {
    if (typeof grant === 'string') return grant === normalized;
    return grant?.command === normalized && (!Array.isArray(grant.platforms) || grant.platforms.includes(platform));
  });
  return result(granted, granted ? RULE_IDS.COMMAND_GRANTED : RULE_IDS.COMMAND_NOT_GRANTED, normalized);
}

function hasCompoundSyntax(command) {
  return /(?:\r|\n|&&|\|\||[;|<>])/.test(command);
}

function result(allowed, ruleId, command) {
  return {
    allowed,
    ruleId,
    reason: allowed ? 'Command is authorized by the execution policy' : 'Command is not authorized by the execution policy',
    audit: { command },
  };
}
