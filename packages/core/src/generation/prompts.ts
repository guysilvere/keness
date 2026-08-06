import type { ElementType } from '../types.js';

const SKILL_TEMPLATE = `You are an expert at writing AI coding assistant instructions.

Generate a high-quality skill document for an AI coding assistant based on the following description:

<description>
{{DESCRIPTION}}
</description>

Requirements:
- Write clear, concise instructions an AI assistant should follow
- Use imperative mood ("Do X", "When Y, always Z")
- Be specific about behaviors, not vague
- Cover edge cases and common patterns
- Keep it under 500 words

Output ONLY the skill content (no frontmatter, no wrapper), starting directly with the skill instructions. The content should work as a standalone instruction document.`;

const AGENT_TEMPLATE = `You are an expert at designing AI coding agents.

Generate an agent specification based on the following description:

<description>
{{DESCRIPTION}}
</description>

Requirements:
- Define the agent's primary goal clearly
- Specify the approach and methodology
- List key behaviors and constraints
- Define success criteria
- Keep it focused and actionable

Output ONLY the agent specification content, starting directly with the specification. No frontmatter or wrapper.`;

const RULE_TEMPLATE = `You are an expert at writing coding rules and guidelines.

Generate a coding rule or guideline based on the following description:

<description>
{{DESCRIPTION}}
</description>

Requirements:
- State the rule clearly and unambiguously
- Explain WHY this rule exists
- Provide examples of correct and incorrect usage when helpful
- Keep it concise but complete

Output ONLY the rule content, starting directly with the rule statement. No frontmatter or wrapper.`;

const MCP_TEMPLATE = `You are an expert at designing MCP (Model Context Protocol) server configurations.

Generate an MCP server description based on the following:

<description>
{{DESCRIPTION}}
</description>

Requirements:
- Describe the MCP server's purpose and capabilities
- List the tools it provides and what they do
- Specify any required configuration or environment variables
- Explain when and why to use this MCP server

Output ONLY the MCP server description in plain text, starting directly with the description. No JSON/YAML, no wrapper.`;

const TEMPLATES: Record<ElementType, string> = {
  skill: SKILL_TEMPLATE,
  agent: AGENT_TEMPLATE,
  rule:  RULE_TEMPLATE,
  mcp:   MCP_TEMPLATE,
};

export function buildPrompt(type: ElementType, description: string): string {
  return TEMPLATES[type].replace('{{DESCRIPTION}}', description);
}
