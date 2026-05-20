# AUDIT REPORT: Inverted Switch Logic
**Screen:** SettingsScreen
**Date:** 2026-05-14
**Status:** 🔴 open

## Bug Title
Toggle switch state inversion

## Description
The notification toggle switch works in reverse. When the user attempts to turn notifications ON (sliding to right), the state updates to OFF, and vice-versa.

## Technical Details
- **Burn-in Region:** { x: 300, y: 250, width: 60, height: 40 }
- **Reporter:** Autonomous AI Engineer
- **Timestamp:** 2026-05-14T11:37:00Z
- **Device:** Simulated Mobile Device
