# Quarterly Code Quality Audit

This document defines the quarterly audit process for maintaining code quality and identifying technical debt.

## Purpose

Regular code quality audits ensure:
- **Maintainability** - Code remains clean and understandable
- **Consistency** - Standards are followed across the codebase
- **Quality** - Issues are caught before they compound
- **Documentation** - Knowledge is captured and up-to-date
- **Technical Debt** - Accumulated debt is tracked and prioritized

## Schedule

**Frequency:** Quarterly (every 3 months)

**Suggested Dates:**
- Q1: End of March
- Q2: End of June
- Q3: End of September
- Q4: End of December

**Duration:** 2-3 hours for full audit

## Audit Checklist

### 1. Code Standards (30 min)

**TypeScript Quality:**
- [ ] Run `pnpm exec tsc --noEmit` - Record error count
- [ ] Compare with previous audit - Has error count decreased?
- [ ] Identify top 3 most frequent error types
- [ ] Are type annotations missing in new code?

**Linting:**
- [ ] Run `pnpm lint` - Record error/warning count
- [ ] Compare with previous audit
- [ ] Check for disabled linter rules (`eslint-disable`)
- [ ] Review and remove unnecessary disables

**Formatting:**
- [ ] Run Prettier check across codebase
- [ ] Verify .prettierignore is up-to-date
- [ ] Check for inconsistent formatting in new files

**Action Items:**
- Document top 3 code quality issues
- Create issues for addressing high-impact problems

---

### 2. Test Coverage (20 min)

**Coverage Metrics:**
- [ ] Run `pnpm test:coverage`
- [ ] Record overall coverage percentage
- [ ] Identify modules below 60% coverage
- [ ] Check critical modules (database, schemas) are >90%

**Test Quality:**
- [ ] Review recent test additions
- [ ] Check for anti-patterns (testing implementation, missing mocks, order dependence)
- [ ] Verify E2E tests cover main workflows
- [ ] Check test execution time (identify slow tests)

**Action Items:**
- List modules needing coverage improvement
- Note any test quality issues

---

### 3. Documentation (20 min)

**API Documentation:**
- [ ] Sample 10 random public functions/classes
- [ ] Verify JSDoc is present and complete
- [ ] Check examples are provided where helpful
- [ ] Verify @param and @returns tags are accurate

**Project Documentation:**
- [ ] Review README.md for accuracy
- [ ] Check CONTRIBUTING.md is up-to-date
- [ ] Verify TESTING.md matches current patterns
- [ ] Review docs/plans/ for outdated information

**Code Comments:**
- [ ] Check for outdated TODO comments
- [ ] Verify complex logic has explanatory comments
- [ ] Remove commented-out code

**Action Items:**
- List undocumented critical APIs
- Note documentation that needs updates

---

### 4. Dependencies & Security (15 min)

**Dependency Audit:**
- [ ] Run `pnpm audit` - Check for vulnerabilities
- [ ] Review outdated dependencies with `pnpm outdated`
- [ ] Check for unused dependencies
- [ ] Verify lockfile is up-to-date

**Security:**
- [ ] Review recent security advisories for used packages
- [ ] Check for hardcoded secrets or credentials
- [ ] Verify .gitignore excludes sensitive files

**Action Items:**
- List critical security updates needed
- Plan dependency update strategy

---

### 5. Architecture & Design (20 min)

**Code Organization:**
- [ ] Review directory structure
- [ ] Check for directories with >30 files (consider splitting)
- [ ] Verify consistent file naming (kebab-case)
- [ ] Look for circular dependencies

**Design Patterns:**
- [ ] Review recent abstractions - Are they justified?
- [ ] Check for code duplication (DRY violations)
- [ ] Verify separation of concerns
- [ ] Look for overly complex functions (>50 lines)

**Technical Debt:**
- [ ] Review STUBS.md - Update status
- [ ] Identify growing areas of debt
- [ ] Assess impact of deferred refactorings

**Action Items:**
- Document significant technical debt
- Prioritize refactoring opportunities

---

### 6. Performance & Optimization (15 min)

**Build & Test Performance:**
- [ ] Measure full test suite execution time
- [ ] Identify slowest tests (candidates for optimization)
- [ ] Check build time
- [ ] Review bundle size (if applicable)

**Database:**
- [ ] Check for missing indexes
- [ ] Review slow queries
- [ ] Verify database cleanup in tests

**Action Items:**
- Note performance bottlenecks
- Plan optimization work

---

### 7. Git & Workflow (10 min)

**Commit Quality:**
- [ ] Review recent commits for conventional format
- [ ] Check commit message quality
- [ ] Verify attribution is included

**Branch Hygiene:**
- [ ] List stale branches
- [ ] Verify main branch is stable
- [ ] Check if tags are being used appropriately

**Hooks & Automation:**
- [ ] Verify git hooks are functioning
- [ ] Check CI/CD is passing
- [ ] Review pre-commit checks

**Action Items:**
- Clean up stale branches
- Fix broken automation

---

## Audit Report Template

```markdown
# Code Quality Audit - YYYY-QN

**Date:** YYYY-MM-DD
**Auditor:** [Name]
**Duration:** [X hours]

## Executive Summary

[2-3 sentence summary of overall code health]

**Quality Score:** X/10 (Previous: Y/10)

## Metrics

| Category | Current | Previous | Trend |
|----------|---------|----------|-------|
| TypeScript Errors | X | Y | ↓/↑/→ |
| Lint Warnings | X | Y | ↓/↑/→ |
| Test Coverage | X% | Y% | ↓/↑/→ |
| Documented APIs | X% | Y% | ↓/↑/→ |

## Key Findings

### 🟢 Strengths
- [What's going well]
- [Recent improvements]

### 🟡 Concerns
- [Growing problems]
- [Trends to watch]

### 🔴 Critical Issues
- [Urgent problems]
- [Blocking issues]

## Action Items

**High Priority** (Complete within 1 month):
1. [Action item with assignee]
2. [Action item with assignee]

**Medium Priority** (Complete within quarter):
1. [Action item]
2. [Action item]

**Low Priority** (Track for future):
1. [Nice-to-have improvement]

## Next Audit

**Scheduled:** YYYY-MM-DD (Q[N+1])
**Focus Areas:** [Areas to pay special attention to]
```

## Automation

### Metrics Collection Script

Create a script to automate metric collection:

```bash
#!/bin/bash
# scripts/audit-metrics.sh

echo "=== Code Quality Metrics ==="
echo ""

echo "TypeScript Errors:"
pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l

echo ""
echo "ESLint Issues:"
pnpm lint 2>&1 | grep "problem" || echo "0"

echo ""
echo "Test Coverage:"
pnpm test:coverage 2>&1 | grep "All files" | awk '{print $10}'

echo ""
echo "Test Count:"
pnpm test 2>&1 | grep "Test Files" | awk '{print $3}'
```

### Trend Tracking

Store audit results in `docs/audits/YYYY-QN-audit.md` for historical tracking.

## Integration with Development

**Use audit findings to:**
- Update sprint planning with high-priority items
- Guide refactoring efforts
- Inform hiring/training needs
- Track team velocity and code health over time

## Continuous Improvement

After each audit:
1. **Review the process** - Is the checklist still relevant?
2. **Update this document** - Add new checks as needed
3. **Automate more** - Reduce manual effort over time
4. **Share learnings** - Document patterns and anti-patterns

## References

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Coding standards
- [TESTING.md](../../TESTING.md) - Testing guidelines
- [STUBS.md](../../STUBS.md) - Stub package status
- Previous audit reports in `docs/audits/`
