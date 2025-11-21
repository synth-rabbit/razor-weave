# Git Commit Conventions

Razorweave uses conventional commits with emoji prefixes.

## Format

```
emoji type(scope): subject

[optional body]

[optional footer]
```

## Emoji and Type Mapping

| Emoji | Type | Description | Example |
|-------|------|-------------|---------|
| ✨ | feat | New feature | `✨ feat(agents): add content generator` |
| 🐛 | fix | Bug fix | `🐛 fix(cli): handle missing config file` |
| 📝 | docs | Documentation | `📝 docs(readme): update installation steps` |
| ♻️ | refactor | Code refactoring | `♻️ refactor(shared): simplify LLM client` |
| 🎨 | style | Code style | `🎨 style(agents): format with prettier` |
| ⚡ | perf | Performance | `⚡ perf(validators): optimize link checking` |
| 🔧 | chore | Maintenance | `🔧 chore(deps): update typescript to 5.3` |
| 🧪 | test | Tests | `🧪 test(validators): add link validator tests` |
| 🚀 | release | Release | `🚀 release(v1.0.0): initial release` |
| 🗑️ | remove | Removal | `🗑️ remove(tools): delete unused script` |

## Scope

Scope should match the package name:

- `tooling` - Changes to @razorweave/tooling
- `shared` - Changes to @razorweave/shared
- `site` - Changes to @razorweave/site
- `agents` - Changes to @razorweave/agents

For cross-package or root changes, use a descriptive scope:

- `monorepo` - Changes affecting multiple packages
- `deps` - Dependency updates
- `ci` - CI/CD changes
- `docs` - Documentation not tied to specific package

## Subject

- Use imperative mood: "add feature" not "added feature"
- Don't capitalize first letter
- No period at the end
- Keep under 72 characters

## Examples

### Good Commits

```bash
✨ feat(agents): add review agent with persona support
🐛 fix(cli): handle ENOENT when config file missing
📝 docs(style-guides): create TypeScript conventions guide
♻️ refactor(shared): extract LLM client interface
🧪 test(validators): add comprehensive link validation tests
🔧 chore(deps): update all dependencies to latest
```

### Bad Commits

```bash
# Missing emoji
feat(agents): add feature

# Wrong emoji for type
✨ fix(cli): bug fix

# Capitalized subject
✨ feat(agents): Add new feature

# Period at end
✨ feat(agents): add feature.

# Past tense
✨ feat(agents): added new feature

# Too vague
✨ feat(agents): updates

# No scope
✨ feat: add feature
```

## Body

Optional detailed explanation:

- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject with blank line

```bash
✨ feat(agents): add content generation caching

Implement LRU cache for generated content to avoid
regenerating identical chapters. Cache invalidates
when rules or style guides change.

Reduces generation time by ~40% for iterative edits.
```

## Footer

Optional metadata:

```bash
✨ feat(agents): add review agent

Implements persona-based review with configurable
review dimensions and quality gates.

Closes #123
Breaking change: Review agent API changed
```

## Commit Message Hook

The `commit-msg` git hook enforces this format automatically. If your commit doesn't match the pattern, it will be rejected with a helpful error message.

## Tools

### Commitizen (Optional)

For interactive commit creation:

```bash
pnpm add -D commitizen cz-conventional-changelog

# Then use:
pnpm exec git-cz
```

### Conventional Changelog (Future)

Auto-generate changelogs from commits:

```bash
pnpm add -D conventional-changelog-cli
```

## Related

- [Git Hooks](../../tooling/hooks/git/) - Automated enforcement
- [Docs Style Guide](../docs/README.md) - Documentation standards
