# Docs Content Style Guide

Standards for writing documentation in the `docs/` directory.

## Purpose

This guide covers:
- Writing plans in `docs/plans/`
- Writing workflow documentation in `docs/workflows/`
- Writing agent documentation in `docs/agents/`
- General documentation best practices

## General Principles

### Clarity First

- Write for readers with zero context
- Explain jargon on first use
- Use concrete examples
- Break complex topics into sections

### Structure

- Use clear heading hierarchy
- Include table of contents for long docs
- Add front matter when relevant
- Use consistent formatting

### Links

- Use relative links for internal docs
- Check that all links work
- Prefer stable heading IDs for anchors

## Documentation Types

### Plans

See [plan-format.md](./plan-format.md) for detailed guidelines on writing implementation plans.

### Workflows

Write workflow docs in `docs/workflows/`:

- Describe the process step-by-step
- Include inputs and outputs for each step
- Show how steps connect
- Provide examples

### Agent Documentation

Write agent docs in `docs/agents/`:

- Describe agent purpose
- List inputs and outputs
- Show example usage
- Document configuration options

## Markdown Standards

### Headings

```markdown
# Document Title (H1 - only one per doc)

## Main Section (H2)

### Subsection (H3)

#### Detail (H4 - sparingly)
```

### Code Blocks

Always specify language:

```markdown
\`\`\`typescript
const example = 'code';
\`\`\`

\`\`\`bash
pnpm install
\`\`\`
```

### Lists

Use `-` for unordered lists:

```markdown
- Item one
- Item two
  - Nested item
```

Use numbers for ordered lists:

```markdown
1. First step
2. Second step
3. Third step
```

### Emphasis

- `**bold**` for important terms
- `*italic*` for emphasis
- `` `code` `` for inline code, file names, commands

### Links

```markdown
[Link Text](./relative/path.md)
[External Link](https://example.com)
[Heading Link](#heading-id)
```

## File Naming

- Use kebab-case: `plan-format.md`
- Be descriptive: `content-validation-workflow.md`
- Follow plan naming for plans: see [plan-format.md](./plan-format.md)

## Front Matter

Optional YAML front matter for metadata:

```yaml
---
title: "Document Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
---
```

## Examples

### Good Documentation Structure

```markdown
# Feature Name

Brief description of what this feature does.

## Overview

1-2 paragraph explanation of the feature.

## How It Works

Step-by-step explanation:

1. First step
2. Second step
3. Third step

## Usage

\`\`\`typescript
// Code example
import { Feature } from './feature';
\`\`\`

## Configuration

Available options:
- `option1` - Description
- `option2` - Description

## See Also

- [Related Doc](./related.md)
```

## Related Guides

- [Plan Format](./plan-format.md)
