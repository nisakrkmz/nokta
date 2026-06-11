# MOBILE-AUDIT REPORT: Voice Visualizer Layout Shifting
Screen: Robot (AVATAR)

## 🔍 Issue Details
- **Type:** UI/Layout Bug
- **Element:** Wave Visualizer Container (`visualizerContainer` style)
- **Observation:** When speaking or listening, the visualizer bar heights change dynamically based on the microphone metering level. Because the container did not have a fixed height, the resizing of the bars caused surrounding layout components (like the status pill and navigation buttons) to shift up and down constantly (layout shifting).
- **Impact:** Distracting visual experience and bad layout performance.

## 💡 Hypothesis & Action
- **Hypothesis:** Specifying a fixed `height: 40` for the `visualizerContainer` will lock the layout boundary, allowing the wave visualizer bars to animate freely inside it without shifting any surrounding components.
