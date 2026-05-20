# MOBILE-AUDIT REPORT: Chat Keyboard Occlusion
Screen: Chat (SOHBET)

## 🔍 Issue Details
- **Type:** Keyboard Interaction Bug
- **Element:** Chat Input Area Wrapper (`KeyboardAvoidingView`)
- **Observation:** When focusing on the TextInput area within the Sohbet screen, the screen layout doesn't shift up correctly, causing the virtual keyboard to fully occlude the typing field.
- **Impact:** Stops users from viewing active text input, breaking standard messaging flows.

## 📸 Annotated Screenshot
![Chat View Screenshot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=)
*(Bounding Box: Bottom keyboard-avoiding input view, hidden under soft-keyboard overlay).*

## 💡 Hypothesis & Action
- **Hypothesis:** Integrating a keyboard layout offset parameter (`keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}`) into the `KeyboardAvoidingView` component will ensure correct upward positioning during keyboard active states.
