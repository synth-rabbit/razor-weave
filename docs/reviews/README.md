# Review Reports and Findings

This directory contains review reports, validation results, and analysis findings for the Razorweave project.

## Overview

Reviews help ensure quality and consistency across all project artifacts. This directory stores both automated validation results and human/agent review reports.

## Types of Reviews

### Code Reviews

Located in this directory when they involve comprehensive findings.

**Purpose:** Evaluate code quality, architecture, and adherence to standards

**Typical Contents:**
- Design review reports
- Implementation review findings
- Refactoring recommendations

### Content Reviews

Reviews of game content (rulebooks, settings, etc.)

**Purpose:** Evaluate clarity, consistency, and quality of written content

**Example Reports:**
- Core Rulebook Review (design, findings, implementation)

### Validation Reports

Automated validation script outputs

**Purpose:** Check for common issues and standards violations

**Current Validation Types:**
- Link validation
- Mechanics validation (dice notation, DC values)
- Color contrast validation
- Term extraction and consistency

## Available Reports

### Core Rulebook Review Series

Comprehensive review of the core rulebook implementation:

- **[Design Review](2025-11-18-core-rulebook-review-design.md)** - Architectural and design evaluation
- **[Review Findings](2025-11-18-core-rulebook-review-findings.md)** - Issues and recommendations
- **[Implementation Review](2025-11-18-core-rulebook-review-implementation.md)** - Detailed implementation analysis

### Validation Results

Automated validation outputs from review scripts:

- **[Link Validation](link-validation.txt)** - Broken link check results
- **[Mechanics Validation](mechanics-validation.txt)** - Dice notation and DC value validation
- **[Color Contrast Validation](color-contrast-validation.txt)** - Accessibility color checks
- **[Extracted Terms](extracted-terms.txt)** - Terminology consistency analysis
- **[Final Validation Report](final-validation-report.txt)** - Comprehensive validation summary

## Review Process

### For Content Reviews

1. **Initiate Review** - Define scope and reviewers (human or agent)
2. **Conduct Review** - Evaluate against style guides and standards
3. **Document Findings** - Create structured review report
4. **Prioritize Issues** - Categorize by severity and impact
5. **Track Resolution** - Monitor fixes and improvements
6. **Final Validation** - Re-review after changes

### For Validation Reports

Validation scripts run automatically or manually:

1. **Run Validators** - Execute validation scripts
   ```bash
   pnpm validate
   # or individual scripts:
   ./scripts/review/validate-links.sh
   ./scripts/review/validate-mechanics.sh
   ```

2. **Review Results** - Check output for issues
3. **Fix Issues** - Address problems in source files
4. **Re-validate** - Run scripts again to confirm fixes
5. **Archive Results** - Save validation reports here

## Review Report Format

### Review Document Structure

```markdown
# [Subject] Review - [Type]

**Date:** YYYY-MM-DD
**Reviewer:** Name/Agent
**Scope:** What was reviewed

## Summary
Brief overview of findings

## Findings
### Critical Issues
- Issue 1
- Issue 2

### Warnings
- Warning 1
- Warning 2

### Recommendations
- Recommendation 1
- Recommendation 2

## Detailed Analysis
In-depth evaluation

## Next Steps
Recommended actions
```

### Validation Result Format

Text files with structured output:

```
=== Validation Type ===
Date: YYYY-MM-DD
Target: file/path

Results:
- Finding 1
- Finding 2

Summary:
X issues found
```

## Validation Scripts

### Available Validators

Located in `scripts/review/`:

- **validate-links.sh** - Check for broken internal/external links
- **validate-mechanics.sh** - Verify dice notation and DC values
- **extract-terms.py** - Extract and analyze terminology
- **verify-database.ts** - Validate database schema and integrity

### Running Validators

Run all validators:
```bash
pnpm validate
```

Run individual validators:
```bash
./scripts/review/validate-links.sh [file]
./scripts/review/validate-mechanics.sh [file]
./scripts/review/extract-terms.py [file]
tsx scripts/verify-database.ts
```

See [Validation Documentation](../workflows/VALIDATION.md) for details (when created).

## Review Standards

All reviews should:

1. **Be Objective** - Focus on facts and standards, not opinions
2. **Be Specific** - Cite exact locations and examples
3. **Be Actionable** - Provide clear recommendations for improvement
4. **Be Prioritized** - Distinguish critical issues from minor suggestions
5. **Reference Standards** - Link to relevant style guides and conventions

### Severity Levels

- **Critical** - Must fix before release (broken functionality, security issues)
- **High** - Should fix soon (major inconsistencies, accessibility issues)
- **Medium** - Should address (quality improvements, minor inconsistencies)
- **Low** - Nice to have (suggestions, optimizations)

## Integration with Workflows

### Git Hooks

Some validations run automatically on git operations:

- **pre-commit** - Runs before commits are created
- **commit-msg** - Validates commit message format

### Manual Reviews

Reviews can be requested at key milestones:

- After major feature implementation
- Before merging to main branch
- Before releases
- When quality metrics indicate issues

### Persona Reviews

The persona-based review system (planned) will:

- Generate reviews from multiple perspectives
- Store raw reviews in `data/reviews/raw/`
- Store summarized reviews in `data/reviews/summarized/`
- Store analysis in `books/*/v1/reviews/analysis/`

See [Persona System Index](../plans/persona-system-index.md) for details.

## Review Artifacts

### Where Things Go

- **This directory** (`docs/reviews/`) - Review reports and validation results
- **`data/reviews/raw/`** - Raw persona review outputs
- **`data/reviews/summarized/`** - Summarized review data
- **`books/*/v1/reviews/analysis/`** - Book-specific review analysis

## Creating Review Reports

### Manual Review Process

1. Create review document: `YYYY-MM-DD-[subject]-review-[type].md`
2. Use review document structure template
3. Conduct thorough review against relevant standards
4. Document all findings with specific examples
5. Prioritize by severity
6. Provide actionable recommendations
7. Save in `docs/reviews/`
8. Share with team and track resolution

### Automated Review Process

1. Run validation scripts
2. Save output: `[validation-type]-validation.txt`
3. Review results for issues
4. Create fixes in source files
5. Re-run validation to verify
6. Archive results in `docs/reviews/`

## Metrics and Tracking

### Quality Metrics

Track review findings over time:

- Number of critical issues
- Number of warnings
- Resolution time
- Re-review results
- Trend analysis

### Quality Gates

Reviews reference quality gates from `data/metrics/quality_gates/`:

- Minimum acceptable scores
- Required validations
- Compliance thresholds

## Related Documentation

- [Validation Documentation](../workflows/VALIDATION.md) - How to run validations (when created)
- [Style Guides](../style_guides/README.md) - Standards for reviews
- [Persona System](../plans/persona-system-index.md) - Automated review system
- [Workflows](../workflows/README.md) - Review processes
- [End-to-End Pipeline](../workflows/END_TO_END_PIPELINE.md) - Where reviews fit

## Troubleshooting

### Validation Script Failures

1. Check script permissions: `chmod +x scripts/review/*.sh`
2. Verify file paths are correct
3. Check script dependencies are installed
4. Review error messages in output

### Inconsistent Results

1. Ensure consistent input files
2. Check for recent changes to validation logic
3. Verify standards haven't changed
4. Re-run with verbose output

## Future Development

Planned review enhancements:

- **Automated Persona Reviews** - Multi-dimensional review system
- **Review Dashboard** - Visual tracking of review metrics
- **Continuous Validation** - Automated validation on file changes
- **Review Templates** - Structured review forms for different content types
