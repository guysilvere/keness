export interface ScanWarning {
  code:    string;
  message: string;
  line?:   number;
}

export interface ScanResult {
  suspicious: boolean;
  warnings:   ScanWarning[];
}

/**
 * Patterns that indicate content may be unsafe to install as an AI coding
 * skill / agent / rule. All checks are heuristic (not a security guarantee).
 */
const PATTERNS: Array<{ code: string; re: RegExp; msg: string }> = [
  // curl | bash / wget | sh — common code-execution injection
  {
    code: 'EXEC_PIPE',
    re:   /\bcurl\b.+\|\s*(ba)?sh\b|\bwget\b.+\|\s*(ba)?sh\b/i,
    msg:  'Pipes output of curl/wget directly into a shell interpreter',
  },
  // eval with external content
  {
    code: 'EVAL_DYNAMIC',
    re:   /\beval\s*\(\s*(?:fetch|require|fs\.read|execSync|child_process)/i,
    msg:  'Uses eval() with dynamically loaded content',
  },
  // fork bomb
  {
    code: 'FORK_BOMB',
    re:   /:\(\)\s*\{[^}]*:\|:\s*&/,
    msg:  'Matches the classic Unix fork-bomb pattern',
  },
  // recursive rm
  {
    code: 'RM_RF',
    re:   /\brm\s+(-\w*f\w*r\w*|-\w*r\w*f\w*)\s+(\/|~|\.\.)/i,
    msg:  'Contains rm -rf targeting root, home, or parent directory',
  },
  // dd overwrite
  {
    code: 'DD_OVERWRITE',
    re:   /\bdd\b.*\bof=\/dev\//i,
    msg:  'Uses dd to write to a raw device',
  },
  // plaintext credentials pattern (key=value or key: value with secret-sounding names)
  {
    code: 'PLAINTEXT_SECRET',
    re:   /(?:password|passwd|secret|api[-_]?key|auth[-_]?token|private[-_]?key)\s*[:=]\s*["']?[A-Za-z0-9+/=_\-]{10,}["']?/i,
    msg:  'Contains what looks like a hard-coded credential or API key',
  },
  // destructive SQL
  {
    code: 'DESTRUCTIVE_SQL',
    re:   /\b(DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+\s*;)/i,
    msg:  'Contains destructive SQL statement (DROP/TRUNCATE/DELETE)',
  },
];

/**
 * Scan the content of a skill / agent / rule for suspicious patterns.
 * Returns { suspicious: true, warnings } when any pattern matches.
 * `suspicious` is false when no patterns fire.
 */
export function scanContent(content: string): ScanResult {
  const warnings: ScanWarning[] = [];
  const lines = content.split('\n');

  for (const { code, re, msg } of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i]!)) {
        warnings.push({ code, message: msg, line: i + 1 });
        break; // one warning per pattern is enough
      }
    }
  }

  return { suspicious: warnings.length > 0, warnings };
}
