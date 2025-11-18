# Razorweave Style Guides

Comprehensive style and writing standards for the Razorweave TTRPG project.

## Overview

This directory contains all style guides for creating consistent, high-quality content across the Razorweave project. Each guide covers a specific domain of writing or technical work.

## Available Guides

### Book Content

Guides for writing book content (core rulebook, setting books, supplements):

- **[Writing Style Guide](./book/writing-style-guide.md)**
  - Overall content quality standards
  - Front matter requirements
  - Heading structure
  - Technical writing standards
  - Tone and voice

- **[PDF Style Guide](./book/pdf-style-guide.md)**
  - PDF technical requirements
  - Page layout and typography
  - Print and digital formatting
  - Accessibility standards
  - Export settings

### Content Types

Guides for specific types of writing:

- **[Prose Style Guide](./prose/README.md)**
  - Narrative and descriptive writing
  - World-building and lore
  - Character descriptions
  - Flavor text
  - Fiction techniques

- **[Rules Style Guide](./rules/README.md)**
  - Game mechanics writing
  - Clear and unambiguous language
  - Ability and talent formatting
  - Dice notation standards
  - Edge case handling

### Code and Development

Guides for technical implementation:

- **[TypeScript Style Guide](./typescript/README.md)**
  - TypeScript coding standards
  - Module structure
  - Type safety practices
  - Error handling
  - Testing conventions

- **[TypeScript Naming Conventions](./typescript/naming-conventions.md)**
  - Naming patterns for types, functions, variables
  - File naming standards
  - Package organization

### Documentation

Guides for project documentation:

- **[Docs Style Guide](./docs/README.md)**
  - Documentation writing standards
  - Markdown formatting
  - File organization
  - Link conventions

- **[Plan Format Guide](./docs/plan-format.md)**
  - Implementation plan structure
  - Design document format
  - Phase and tangent tracking
  - Status conventions

### Version Control

Guides for git workflow:

- **[Git Commit Conventions](./git/commit-conventions.md)**
  - Commit message format
  - Emoji and type mapping
  - Scope guidelines
  - Examples and tools

## Quick Reference

### Which Guide Do I Need?

**I'm writing about a game setting:**
→ Start with [Prose Style Guide](./prose/README.md) for narrative content
→ Use [Writing Style Guide](./book/writing-style-guide.md) for structure

**I'm writing game rules:**
→ Use [Rules Style Guide](./rules/README.md) for mechanics
→ Use [Writing Style Guide](./book/writing-style-guide.md) for structure

**I'm creating a PDF:**
→ Use [PDF Style Guide](./book/pdf-style-guide.md) for formatting
→ Use [Writing Style Guide](./book/writing-style-guide.md) for content

**I'm writing code:**
→ Use [TypeScript Style Guide](./typescript/README.md)
→ Use [TypeScript Naming Conventions](./typescript/naming-conventions.md)

**I'm documenting a feature:**
→ Use [Docs Style Guide](./docs/README.md)
→ Use [Plan Format Guide](./docs/plan-format.md) for implementation plans

**I'm committing changes:**
→ Use [Git Commit Conventions](./git/commit-conventions.md)

## Common Standards

Some standards apply across all guides:

### File Naming

- Use kebab-case: `my-document.md`
- Be descriptive: `combat-mechanics.md` not `cm.md`
- Use consistent extensions: `.md` for markdown, `.ts` for TypeScript

### Markdown Formatting

- One blank line between sections
- Code blocks always specify language
- Use relative links for internal docs
- Follow heading hierarchy (no skipping levels)

### Consistency

- Use the same term for the same concept
- Maintain voice and tone within a section
- Follow established patterns from existing content
- When in doubt, ask before creating new patterns

## Contributing to Style Guides

### When to Update a Guide

Update a style guide when:
- You discover missing guidance for common situations
- You find conflicting advice between guides
- New tools or standards are adopted
- User feedback reveals confusion

### How to Update

1. Read the full guide you plan to update
2. Check related guides for conflicts
3. Make your changes
4. Update this index if adding new sections
5. Commit with clear description of what changed

### Creating New Guides

Before creating a new guide:
1. Verify it doesn't belong in an existing guide
2. Define clear scope and purpose
3. Follow the structure of similar guides
4. Add it to this index
5. Cross-reference from related guides

## Guide Maintenance

### Regular Reviews

Each guide should be reviewed:
- When major features are added
- Every 6 months for accuracy
- When user feedback indicates confusion
- Before major releases

### Deprecated Guidance

If guidance changes:
- Update the guide with new standards
- Note what changed in commit message
- Consider a "Changes" section for major revisions
- Update dependent guides that reference it

## Questions and Feedback

If you have questions about which guide to use or suggestions for improvement:

1. Check if existing guides answer your question
2. Search for similar questions in project docs
3. Ask in project discussions
4. Propose changes via pull request

## Related Documentation

- [Project README](../../README.md) - Project overview
- [Docs Directory](../README.md) - All project documentation
- [Plans Directory](../plans/) - Implementation plans
- [Workflows Directory](../workflows/) - Process documentation
