# AUDIT REPORT: Settings Invisible Button
**Screen:** Settings
**Date:** 2026-05-14
**Type:** UI/Accessibility Bug

## Description
The "Reset All" button in Settings is invisible because its background and border colors are identical to the parent container's background.

## Suggested Fix
Change the button background to a contrasting color (e.g., red for destructive actions).

---
![Screenshot](burn-in-settings.png)
