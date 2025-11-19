# Review System Usage

The Review System conducts automated multi-persona reviews of book and chapter content using Claude Code agents.

## Quick Start

### Review a Book

```bash
# Review with all core personas
pnpm review book src/site/core_rulebook_web.html

# Review with specific personas
pnpm review book src/site/core_rulebook_web.html --personas=core-sarah,core-alex
```

### Review a Chapter

```bash
pnpm review chapter chapters/combat.md --personas=all_core
```

### List Campaigns

```bash
# All campaigns
pnpm review list

# Filter by status
pnpm review list --status=completed

# Filter by type
pnpm review list --content-type=book
```

### View Campaign Details

```bash
pnpm review view campaign-20251118-143025-abc123
```

## Architecture

**Campaign-Based Model:**
- Each review is a campaign with unique ID
- Snapshots content for consistency
- Tracks all reviews and analysis

**Three Agent Roles:**
1. **Orchestrator** - Manages campaign lifecycle
2. **Reviewer** - One per persona, evaluates content
3. **Analyzer** - Aggregates reviews into insights

## Review Dimensions

Every review scores content on four dimensions (1-10):

1. **Clarity & Readability** - How clear and easy to understand
2. **Rules Accuracy** - Consistency and correctness
3. **Persona Fit** - Works for this persona's experience/style
4. **Practical Usability** - Easy to use at the table

## Outputs

**Individual Reviews:**
- Database: `persona_reviews` table
- Markdown: `data/reviews/raw/{campaign_id}/{persona_id}.md`

**Campaign Analysis:**
- Database: `campaign_analyses` table
- Markdown: `data/reviews/analysis/{campaign_id}.md`

## Analysis Features

**Priority Rankings:**
- Issues ranked by severity × frequency
- Shows which personas affected
- Actionable recommendations

**Dimension Summaries:**
- Average scores per dimension
- Common themes across personas

**Persona Breakdowns:**
- Groups by experience level or archetype
- Strengths and struggles per group

**Trend Tracking:**
- Compare campaigns across versions
- Track improvement over time

## Database Schema

**review_campaigns:**
- Campaign metadata and lifecycle
- Links to content snapshot
- Persona selection strategy

**persona_reviews:**
- Individual review data (JSON)
- Links to campaign and persona
- Agent execution time

**campaign_analyses:**
- Aggregated analysis (JSON)
- Links to campaign
- Markdown output path

## Future Features

- Smart persona sampling based on content type
- Version comparison and regression detection
- Review retry for failed personas
- Interactive analysis dashboard
