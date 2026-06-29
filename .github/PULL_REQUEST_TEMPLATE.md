# Pull Request

## Summary
<!-- Brief description of changes and motivation (2-3 sentences) -->


## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Refactoring (code restructuring without behavior changes)
- [ ] Documentation update
- [ ] Other (please describe):

## Related Issues
<!-- Link related issues using keywords: Fixes #123, Closes #456, Related to #789 -->
- Fixes #
- Related to #

## Changes Made
<!-- Detailed list of changes -->
-
-
-

## Performance Impact
<!-- Check one and provide details -->
- [ ] No performance regression (tested with 20+ layers at 60fps)
- [ ] Improves performance (describe improvement below)
- [ ] Temporary performance impact (explain mitigation plan below)

**Performance Details:**
<!-- Include before/after metrics if applicable -->
```
Before:
After:
```

## Testing Completed
<!-- Check all that apply -->
- [ ] Existing tests pass (`npm run test`)
- [ ] Added new tests for new functionality
- [ ] Manual testing in frost_light theme
- [ ] Manual testing in frost_dark theme
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance testing with 20+ layers
- [ ] Accessibility testing (keyboard navigation, screen reader)

## Test Evidence
<!-- Describe how you tested this change -->


## Breaking Changes
<!-- If this introduces breaking changes, list them and provide migration steps -->
- [ ] No breaking changes
- [ ] Breaking changes (listed below)

**Breaking Changes List:**
<!-- List breaking changes and migration steps -->


## Screenshots / Videos
<!-- For UI changes, include before/after screenshots or screen recordings -->
<!-- Drag and drop images here or paste URLs -->


## Code Quality Checklist
<!-- Ensure all items are checked before requesting review -->
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is well-commented, particularly in complex areas
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Uses Frost Glass CSS classes exclusively (no hardcoded colors)
- [ ] No console.log or debug code left in
- [ ] Proper error handling and boundaries implemented
- [ ] Memory leaks checked (no new closures capturing large objects)

## Documentation Updates
<!-- Check all that apply -->
- [ ] No documentation needed
- [ ] Updated inline code comments
- [ ] Updated README.md
- [ ] Updated docs/ files
- [ ] Added examples in docs/examples/
- [ ] Updated API documentation
- [ ] Created migration guide (for breaking changes)

## AI Agent Collaboration
<!-- If this PR was created with AI agent assistance (Claude, Jules, etc.) -->
- [ ] Created with AI agent assistance
- [ ] AI Agent used: <!-- e.g., Claude Code, Jules -->
- [ ] AI-generated code reviewed and tested by human

## Deployment Notes
<!-- Any special deployment considerations or steps needed -->
- [ ] No special deployment steps needed
- [ ] Requires environment variable changes
- [ ] Requires database migration
- [ ] Requires dependency updates (`npm install`)

**Deployment Steps:**
<!-- List any special deployment steps if needed -->


## Reviewer Notes
<!-- Anything specific you want reviewers to focus on or be aware of -->


---

## For Reviewers

### Review Focus Areas
Please pay special attention to:
- [ ] Performance impact (60fps target maintained)
- [ ] Memory usage (no leaks or excessive allocation)
- [ ] TypeScript type safety
- [ ] Frost Glass theme compatibility
- [ ] Accessibility compliance

### Review Checklist
- [ ] Code changes reviewed
- [ ] Tests are adequate and passing
- [ ] Documentation is clear and complete
- [ ] No security concerns
- [ ] Approved for merge

---

**By submitting this PR, I confirm that:**
- [ ] I have read and followed the [Contributing Guidelines](../docs/development/contributing.md)
- [ ] My code adheres to the project's performance standards
- [ ] I have tested my changes thoroughly
- [ ] This PR is ready for review
