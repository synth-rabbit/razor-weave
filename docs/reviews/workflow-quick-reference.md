# Review System Workflow - Quick Reference

## Step 1: Create Campaign and Generate Prompts

```bash
pnpm review book src/site/core_rulebook_web.html
```

## Step 2: Execute Reviewer Agents

Copy instruction from CLI output and tell Claude Code:

```
Read prompts from data/reviews/prompts/<campaign-id>/
and execute reviewer agents in batches of 5
```

## Step 3: Check Status

```bash
pnpm review status <campaign-id>
```

## Step 4: Execute Analyzer Agent

Copy instruction from status output and tell Claude Code:

```
Read analyzer prompt from data/reviews/prompts/<campaign-id>/analyzer.txt
and execute analyzer agent
```

## Step 5: Verify Completion

```bash
pnpm review status <campaign-id>
```

## View Results

- **Individual Reviews:** `data/reviews/raw/<campaign-id>/`
- **Campaign Analysis:** `data/reviews/analysis/<campaign-id>.md`
