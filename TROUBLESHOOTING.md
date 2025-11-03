# Troubleshooting Guide

Common issues and solutions for the SerenitySpark meditation app.

## Build Issues

### Module Resolution Errors

**Symptom:** `Unable to resolve module...`

**Solutions:**

1. Clear cache and reinstall:

   ```bash
   rm -rf node_modules
   npm install
   npm start -- --reset-cache
   ```

2. For iOS, reinstall pods:

   ```bash
   cd ios && pod install && cd ..
   ```

3. Clear Metro bundler cache:
   ```bash
   npm start -- --reset-cache
   ```

### TypeScript Errors

**Symptom:** Type errors during build

**Solutions:**

1. Check TypeScript compilation:

   ```bash
   npx tsc --noEmit
   ```

2. Ensure all type definitions are installed:
   ```bash
   npm install --save-dev @types/react @types/react-native
   ```

## Runtime Issues

### Gesture Handler Errors

**Symptom:** `TypeError: [function] is not a function`

**Common Causes:**

- Function not wrapped with `runOnJS()` in gesture handler
- Function defined after it's referenced
- Missing imports from `react-native-reanimated`

**Solution:**

```typescript
import { runOnJS } from 'react-native-reanimated';

// Define function first
const myFunction = () => {
  // Your code
};

// Then use in gesture
const gesture = Gesture.Pan().onEnd(() => {
  runOnJS(myFunction)(); // Wrap with runOnJS
});
```

### Audio Playback Issues

**Symptom:** No sound or audio errors

**Solutions:**

1. Check audio files exist:

   ```bash
   ls -la assets/audio/nature/
   ls -la assets/audio/music/
   ```

2. Verify audio files are valid MP3s (not placeholders)

3. Check device volume and silent mode

4. Verify audio permissions in Info.plist (iOS)

5. Test with a simple audio file first

### Animation Performance Issues

**Symptom:** Choppy animations or low FPS

**Solutions:**

1. Ensure Reanimated plugin is configured in `babel.config.js`:

   ```javascript
   plugins: ['react-native-reanimated/plugin'];
   ```

2. Rebuild after Babel config changes:

   ```bash
   npm start -- --reset-cache
   ```

3. Use `useAnimatedStyle` instead of inline styles

4. Avoid heavy computations in worklets

## Development Tips

### Fast Refresh Not Working

**Solutions:**

1. Reload the app: Shake device → "Reload"
2. Restart Metro bundler: `npm start -- --reset-cache`
3. Check for syntax errors in recent changes

### iOS Simulator Issues

**Solutions:**

1. Reset simulator: Device → Erase All Content and Settings
2. Rebuild app: `npm run ios`
3. Check Xcode for build errors

### Debugging

**Enable Debug Mode:**

1. Shake device or press Cmd+D (iOS simulator)
2. Select "Debug" to open Chrome DevTools
3. Use console.log() for debugging

**React Native Debugger:**

```bash
# Install
brew install --cask react-native-debugger

# Use instead of Chrome DevTools
```

## Common Commands

### Clean Build

```bash
# Clean everything
rm -rf node_modules ios/Pods ios/build android/build
npm install
cd ios && pod install && cd ..
npm start -- --reset-cache
```

### Run on Device

```bash
# iOS
npm run ios -- --device "Your Device Name"

# Android
npm run android
```

### Check for Issues

```bash
# TypeScript
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm test
```

## Getting Help

### Check Logs

- **iOS:** Xcode → Window → Devices and Simulators → View Device Logs
- **Android:** `adb logcat`
- **Metro:** Check terminal running `npm start`

### Useful Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [Expo AV Docs](https://docs.expo.dev/versions/latest/sdk/av/)

### Report Issues

If you encounter persistent issues:

1. Check the error message carefully
2. Search for similar issues on GitHub
3. Provide full error logs when asking for help
4. Include device/simulator info and OS version

## Reanimated Worklet Issues

### Common Worklet Errors

**Error 1:** `Tried to synchronously call a non-worklet function on the UI thread`

**Cause:** Calling a JavaScript function (like state setters or callbacks) directly from a worklet without `runOnJS()`.

**Solution:**

```typescript
import { runOnJS } from 'react-native-reanimated';

const scrollHandler = useAnimatedScrollHandler({
  onMomentumEnd: event => {
    // ❌ Wrong - direct call
    // onCallback(value);

    // ✅ Correct - wrapped with runOnJS
    runOnJS(onCallback)(value);
  },
});
```

**Error 2:** `[function] is not a function (it is undefined)`

**Cause:** Function referenced in worklet before it's defined.

**Solution:** Define functions before using them in gestures/worklets.

### Worklet Best Practices

1. **Always use `runOnJS()` for:**

   - React state updates
   - Prop callbacks
   - Navigation functions
   - Any side effects

2. **Define functions before gestures:**

   ```typescript
   // ✅ Correct order
   const handleEnd = () => {
     /* ... */
   };
   const gesture = Gesture.Pan().onEnd(() => runOnJS(handleEnd)());
   ```

3. **Keep worklets simple:**

   - Avoid complex logic in worklets
   - Move business logic to regular functions
   - Use worklets only for animations and gestures

4. **Import `runOnJS`:**
   ```typescript
   import { runOnJS } from 'react-native-reanimated';
   ```
