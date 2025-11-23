# Formatting Style Guide

This guide defines markdown conventions, document structure, and visual formatting standards for all Razorweave content. Consistent formatting ensures readability across different rendering contexts and maintains professional presentation.

---

## Heading Conventions

### Heading Hierarchy

Use a strict heading hierarchy with no skipped levels:

| Level | Usage | Example |
|-------|-------|---------|
| `#` (H1) | Chapter title only | `# 1. Welcome to the Game` |
| `##` (H2) | Major sections | `## When to Roll (and When Not To)` |
| `###` (H3) | Subsections | `### Declaring Intent and Approach` |
| `####` (H4) | Minor subsections | `#### Basic Gear Package` |

### Heading Rules

- **One H1 per document** - Each chapter file has exactly one H1 heading
- **Number chapter H1s** - Use format `# N. Chapter Title` for main chapters
- **Use H2 for section breaks** - Major topic changes use H2
- **Keep H4 usage minimal** - Prefer restructuring over deep nesting
- **No H5 or H6** - If you need H5, restructure the content

### Heading Formatting

- Use Title Case for all headings
- Do not end headings with punctuation (except question marks when appropriate)
- Keep headings concise (aim for 3-7 words)
- Avoid starting headings with articles (The, A, An)

**Do:**
```markdown
## Core Combat Actions
### Strike
### Maneuver
```

**Avoid:**
```markdown
## The Core Combat Actions.
### The Strike Action
### How to Maneuver:
```

---

## Blockquote Callouts

Use blockquotes with bold labels for callouts. This creates visually distinct sections for examples, guidance, and warnings.

### Example Callout

```markdown
> **Example**
> A character wants to leap between rooftops during a chase in heavy rain.
> The GM calls for a Check because the outcome is uncertain and the stakes
> are serious.
```

Renders as:
> **Example**
> A character wants to leap between rooftops during a chase in heavy rain.
> The GM calls for a Check because the outcome is uncertain and the stakes
> are serious.

### Labeled Example Callout

Use descriptive labels for complex examples:

```markdown
> **Example - Clock and Checks**
> *Trigger:* The group works to evacuate a district before floodwaters arrive.
> *Clocks:* "Evacuation Complete" (6 segments) and "Flood Waters Rise" (4 segments).
> *Outcome:* Which clock fills first determines the district's fate.
```

### GM Guidance Callout

```markdown
> **GM Guidance**
> Start small. You do not need Tags, Conditions, and Clocks on every scene.
> Add complexity only when it clarifies the fiction rather than cluttering it.
```

### Note Callout

```markdown
> **Note**
> Edge and Burden are capped at +/-2. Multiple sources combine into a single
> level and do not stack beyond the cap.
```

### Warning Callout

```markdown
> **Warning**
> Do not roll for actions without meaningful uncertainty. If failure just means
> "try again until it works," skip the Check.
```

### Callout Formatting Rules

- Start each callout with `> **Label**` on its own line
- Continue callout content with `>` prefix on each line
- Use single blank line before and after callouts
- Keep callouts focused on a single point or example
- For multi-paragraph callouts, use `>` with blank line between paragraphs

---

## Table Formatting

### Basic Table Structure

```markdown
| Column A | Column B | Column C |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

### Table Guidelines

- Use tables for reference data, comparisons, and structured information
- Keep tables simple - avoid complex nesting or merged cells
- Left-align text columns, right-align numeric columns
- Use consistent column widths within a table
- Provide a brief introduction before each table

### Game Reference Tables

For game mechanics tables, use this format:

```markdown
The system uses a standard difficulty ladder:

| DC | Difficulty |
|----|------------|
| 12 | Easy |
| 14 | Routine |
| 16 | Tough |
| 18 | Hard |
| 20 | Heroic |
| 22 | Legendary |
```

### Terminology Tables

For terminology reference:

```markdown
| Use This | Not This | Notes |
|----------|----------|-------|
| GM | DM, Referee | Game Master is the standard term |
| Check | Roll, Test | The resolution mechanic |
```

---

## List Formatting

### Numbered Lists

Use for sequential steps or ordered procedures:

```markdown
1. The player declares intent and approach.
2. The GM decides whether a Check is needed.
3. The GM sets DC and notes modifiers.
4. The player rolls 4d6 and compares to DC.
5. The table interprets the outcome tier.
```

### Bulleted Lists

Use for non-sequential items, options, or features:

```markdown
- **Environmental Tags** - Physical features of space
- **Situational Tags** - Circumstances and pressures
- **Atmospheric Tags** - Social or emotional tone
```

### Nested Lists

Limit nesting to one level. Restructure if deeper nesting is needed:

```markdown
- **Strike** - Directly attack a target.
  - Use when you want to advance an opponent's Resolve Clock
  - Requires a clear line of action to the target
- **Maneuver** - Change position or create openings.
  - Use to apply Tags like *Exposed* or *Prone*
  - Works well before committing to Strikes
```

### List Item Formatting

- Use sentence case for list items
- End list items with periods if they are complete sentences
- Omit periods for short phrase items
- Be consistent within each list
- Use bold for defined terms at the start of list items

---

## Emphasis Formatting

### Bold Text

Use **bold** for:
- Game terms on first significant use: **Difficulty Class (DC)**
- Key concepts being defined: **Intent** and **Approach**
- Labels in lists and callouts: **Strike**, **Maneuver**
- Table headers and column labels

### Italic Text

Use *italics* for:
- Tag names: *Dim Light*, *Cramped*, *Elevated*
- Condition names: *Exhausted*, *Bleeding*, *Frightened*
- Emphasis within sentences (use sparingly)
- Titles of works or publications

### Combined Bold and Italic

Use ***bold italic*** only for:
- Critical warnings or important notes (extremely rare)

### Formatting to Avoid

- ALL CAPS for emphasis (never use)
- Underline (not supported in standard markdown)
- Strikethrough (only for errata or corrections)
- Excessive emphasis (if everything is bold, nothing stands out)

---

## Code Block Usage

### Inline Code

Use backticks for:
- Dice notation in technical contexts: `4d6`, `2d6+3`
- File names and paths: `chapter-08.md`
- Specific numeric values in formulas: `DC = 14 + modifier`

### Code Blocks

Use fenced code blocks for:
- Extended examples of markdown formatting
- Technical syntax demonstrations
- Multi-line formulas or procedures

```markdown
​```markdown
> **Example**
> Your example content here.
​```
```

**Avoid** using code blocks for:
- Regular prose or rules text
- Examples that should use blockquote callouts
- In-fiction dialogue or narration

---

## Cross-Reference Conventions

### Internal References

Reference other chapters and sections clearly:

```markdown
See Chapter 8: Actions, Checks, and Outcomes for the full procedure.
```

```markdown
The Tags described in Chapter 9 provide modifiers for these Checks.
```

### Section References

When referencing sections within the same chapter:

```markdown
As described in the Core Check Procedure above, every Check follows
the same basic loop.
```

### Forward References

When content depends on later chapters:

```markdown
Later chapters describe Skills in more detail and provide example
lists grouped by Attribute.
```

### Reference Formatting

- Use chapter numbers when referencing other chapters
- Use section names when referencing within the same chapter
- Avoid page numbers (not stable across formats)
- Keep references natural within prose flow

---

## Document Structure Templates

### Chapter File Template

```markdown
# N. Chapter Title

Opening paragraph establishing what this chapter covers and why it
matters to play. Connect to the reader's experience.

## First Major Section

Core explanation of the primary concept.

### Subsection

Detailed breakdown of specific aspects.

> **Example**
> Concrete illustration of the concept.

## Second Major Section

[Continue pattern...]

## Chapter Summary

Brief recap of key points and connection to upcoming content.
```

### Reference File Template

```markdown
# Reference Title

Brief introduction explaining what this reference contains and how
to use it.

## Category One

### Entry 1
Definition or description.

### Entry 2
Definition or description.

## Category Two

[Continue pattern...]

## Quick Reference Table

| Term | Definition |
|------|------------|
| ... | ... |
```

---

## Whitespace Rules

### Paragraph Spacing

- Single blank line between paragraphs
- Single blank line before and after headings
- Single blank line before and after blockquotes
- Single blank line before and after lists

### No Trailing Whitespace

Remove trailing spaces at the end of lines.

### Consistent Line Breaks

- Use single line breaks within paragraphs only for source readability
- Rendered output should flow as continuous paragraphs
- Do not use double spaces for line breaks

### Section Spacing

```markdown
## Section Heading

First paragraph of the section.

Second paragraph continues the discussion.

### Subsection

Content of the subsection.

> **Example**
> Example content here.

Continuation after the example.
```

---

## File Naming Conventions

### Chapter Files

```
NN-chapter-title-with-hyphens.md
```

Examples:
- `01-welcome-to-the-game.md`
- `08-actions-checks-outcomes.md`
- `10-combat-basics.md`

### Reference Files

```
reference-name.md
```

Examples:
- `glossary.md`
- `quick-reference.md`
- `tag-reference.md`

### Supplementary Files

```
topic-name.md
```

Examples:
- `content.md` (this file)
- `formatting.md`
- `mechanics.md`
