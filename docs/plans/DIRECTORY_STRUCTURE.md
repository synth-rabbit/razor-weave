# Razorweave Directory Structure Proposal

## Overview

This document describes a proposed directory structure for the Razorweave project. It is intended to support the full lifecycle of creating, reviewing, editing, and releasing tabletop role playing game books.

## Root Files

- **AGENTS.md**  
  Instructions for all automated agents working in the project.
- **README.md**  
  Human facing entry point that explains how to work within the project.
- **INDEX.md**  
  Reference map that helps humans and agents navigate the project.
- **PLAN.md**  
  High level project plan and milestone tracking.
- **PROMPT.md**  
  Shared meta prompt used by orchestration agents.

## books Directory

Contains all book related material. This includes manuscripts, reviews, exported formats, and assets.

### Core Books

```
books/core/v1/
    manuscript/
        chapters/
        front_matter/
        back_matter/
        appendices/
    reviews/
        persona_runs/
        analysis/
        playtest/
    exports/
        html/
        pdf/
            draft/
            digital/
            print/
    assets/
        art/
        layout/
        fonts/
    sheets/
    _notes/
```

Manuscript contains editable content. Reviews stores persona reviews and playtest analysis. Exports stores html and pdf outputs. Assets stores images, layout files, and fonts. Sheets contains reference or character sheets. Notes stores local notes for that book version.

### Settings

Settings follow the same structure as the core book but are organized by slice and setting.

Pattern:

```
books/settings/<slice>/<setting>/v1/
    manuscript/
        campaigns/
        lore/
        reference/
    reviews/
    exports/
    assets/
    _notes/
```

Slices include cozy, fantasy, horror_mystery, modern, and sci_fi.

## data Directory

Stores persona data, review results, play session logs, and metric history.

```
data/
    personas/
        pools/
        runs/
    reviews/
        raw/
        summarized/
    play_sessions/
        raw_sessions/
        parsed_sessions/
        analysis/
    metrics/
        quality_gates/
        history/
```

## docs Directory

Holds documentation for processes, style guides, and agent instructions.

```
docs/
    agents/
    plans/
    style_guides/
        prose/
        rules/
        book/
        pdf/
    workflows/
        content_pipeline/
        review_pipeline/
        playtest_pipeline/
        pdf_pipeline/
        release_pipeline/
```

## rules Directory

Canonical system rules kept separate from specific book versions.

```
rules/
    core/
        GM_GUIDE.md
        PLAYERS_GUIDE.md
    expanded/
        ENEMIES.md
        NPCS.md
        VPCS.md
        SOLO_PLAY.md
        MECHANICS_REFERENCE.md
```

## src Directory

Source code for all agentic and workflow processes.

```
src/
    agents/
        content/
        review/
        playtest/
        pdf/
        release/
    maintenance/
    workflows/
    cli/
    site/
        generator/
        templates/
        static/
```

## site Directory

Output for the statically generated website.

```
site/
    public/
        v1/
        v2/
```

## tools Directory

```
tools/
    scripts/
    templates/
```

## _archive Directory

```
_archive/
    drafts/
    experiments/
```

This directory is for old versions and experimental work no longer part of the active development cycle.
