# Agentic Processes

This document describes the automated agentic processes used in the Razorweave project.

## Content Development

Developing new content and books for the TTRPG system.

**Inputs:**
- System rules from `rules/`
- Existing content from `books/`
- Style guides from `docs/style_guides/`

**Outputs:**
- New or revised manuscript content in `books/*/v1/manuscript/`

## Review System

A review system process using multi-dimensional personas taking inputs from new content or revised content.

**Inputs:**
- New or revised content from `books/*/v1/manuscript/`
- Persona definitions from `data/personas/pools/`

**Process:**
- Generate persona instances in `data/personas/runs/`
- Run persona reviews
- Store raw reviews in `data/reviews/raw/`

**Outputs:**
- Analysis of the reviews in `books/*/v1/reviews/analysis/`
- Summarized review data in `data/reviews/summarized/`

## Iterative Editing

Iterative editing process that takes inputs from the review system analysis and play session analysis to update content.

**Inputs:**
- Review analysis from `books/*/v1/reviews/analysis/`
- Play session analysis from `data/play_sessions/analysis/`
- Quality metrics from `data/metrics/`

**Outputs:**
- Revised manuscript content in `books/*/v1/manuscript/`
- Updated quality metrics in `data/metrics/history/`

## Automated Play Session

Automated play session process (also has a process for pasting a play session that a user has done) that outputs analysis.

**Inputs:**
- Rules from `rules/`
- Setting content from `books/settings/*/v1/manuscript/`
- User-provided or simulated session logs

**Process:**
- Store raw sessions in `data/play_sessions/raw_sessions/`
- Parse sessions into structured data in `data/play_sessions/parsed_sessions/`

**Outputs:**
- Analysis in `data/play_sessions/analysis/`

## PDF Creation

Iterative PDF creation for draft, print, and digital based off of outputs from the editing process.

**Inputs:**
- HTML from `books/*/v1/exports/html/`
- Assets from `books/*/v1/assets/`
- PDF design guidelines from `docs/style_guides/pdf/`

**Process:**
- Error editing
- Rules enforcement editing
- Structural editing
- Design creation and review for print and digital
- Asset generation

**Outputs:**
- Draft PDFs in `books/*/v1/exports/pdf/draft/`
- Digital PDFs in `books/*/v1/exports/pdf/digital/`
- Print PDFs in `books/*/v1/exports/pdf/print/`
