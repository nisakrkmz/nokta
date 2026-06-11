# MOBILE-AUDIT REPORT: 3D Avatar Lipsync Smoothing
Screen: Robot (AVATAR)

## 🔍 Issue Details
- **Type:** Animation/Experience Bug
- **Element:** THREE.MathUtils.lerp loop inside `Avatar.js`
- **Observation:** The mouth morph targets were interpolating too abruptly with a lerp coefficient of `0.2`. During rapid talking segments, this caused the model's mouth to jitter or snap to open/closed positions too fast.
- **Impact:** Decreased realism of the 3D avatar lipsync.

## 💡 Hypothesis & Action
- **Hypothesis:** Adjusting the linear interpolation (lerp) coefficient from `0.2` to `0.15` (as suggested by the expert during the WebRTC Bridge session) will smooth out the mouth open/close animations, providing a natural viseme transition with a latency under 200ms.
