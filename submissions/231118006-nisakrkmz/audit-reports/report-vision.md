# MOBILE-AUDIT REPORT: Vision Screen Notch Collision
Screen: Vision (GÖZLEM)

## 🔍 Issue Details
- **Type:** UI/Layout Bug
- **Element:** Camera overlay glass header container (`glassHeader` style)
- **Observation:** The overlay header (containing "Gözlem Modu" titles) overlaps with device hardware notches and system status bar elements on various notch architectures due to insufficient top padding/margin.
- **Impact:** Decreases text readability and ruins visual polish.

## 📸 Annotated Screenshot
![Vision View Screenshot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=)
*(Bounding Box: Top status-bar area overlaying camera UI text).*

## 💡 Hypothesis & Action
- **Hypothesis:** Adjusting the `glassHeader` style by setting a safe top margin (such as `marginTop: 64`) will push the content away from device hardware notches and state bars, restoring complete visibility.
