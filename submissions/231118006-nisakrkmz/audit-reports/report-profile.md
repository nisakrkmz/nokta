# AUDIT REPORT: Profile Age Logic
**Screen:** Profile
**Date:** 2026-05-14
**Type:** Logic Bug

## Description
The age calculation is using the year 2020 as the current year, but we are in 2026. This results in incorrect age display for all users.

## Suggested Fix
Update the calculation to use 2026.

---
![Screenshot](burn-in-profile.png)
