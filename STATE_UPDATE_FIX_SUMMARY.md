# React State Update During Render Fix

## Issue

The app was showing a React warning:

```
Cannot update a component (SessionProvider) while rendering a different component (SessionScreen)
```

## Root Cause

The `updateElapsed()` function was being called inside the `setTimeRemaining` state update callback. This caused a cascading state update:

1. `setTimeRemaining` updates local state in SessionScreen
2. Inside that update, `updateElapsed()` is called
3. `updateElapsed()` updates state in SessionContext (parent component)
4. React detects a parent state update during child render and throws a warning

This is a React anti-pattern because it can lead to:

- Unpredictable render cycles
- Performance issues
- Potential infinite loops

## Solution

### Why updateElapsed Was Unnecessary

The `elapsed` value in SessionContext wasn't actually being used anywhere. The SessionScreen component tracks time locally with:

- `timeRemaining` state for the countdown
- `progress` shared value for the animation

There's no need to sync this to the parent context during an active session.

### Changes Made

**Before:**

```typescript
const { sessionState, endSession, updateElapsed } = useSession();

const interval = setInterval(() => {
  setTimeRemaining(prev => {
    const newTime = prev - 1;
    const elapsed = sessionState.duration * 60 - newTime;
    updateElapsed(elapsed); // ❌ Causes parent state update during render
    return newTime;
  });
}, 1000);
```

**After:**

```typescript
const { sessionState, endSession } = useSession(); // Removed updateElapsed

const interval = setInterval(() => {
  setTimeRemaining(prev => {
    const newTime = prev - 1;
    // Elapsed time is tracked locally in this component
    // No need to update context during active session
    return newTime;
  });
}, 1000);
```

## Best Practices

### Avoid State Updates During Render

Never call state setters inside:

- Render functions
- Other state setter callbacks
- useEffect without proper dependencies

### Proper State Update Patterns

**❌ Bad - Nested state updates:**

```typescript
setState1(value => {
  setState2(otherValue); // Don't do this
  return newValue;
});
```

**✅ Good - Sequential state updates:**

```typescript
setState1(newValue);
setState2(otherValue);
```

**✅ Good - Use useEffect for side effects:**

```typescript
useEffect(() => {
  if (condition) {
    setState2(otherValue);
  }
}, [dependency]);
```

### When to Use Context State

Only store values in context that:

- Need to be shared across multiple components
- Are actually consumed by child components
- Don't update frequently (to avoid re-renders)

For the SessionScreen:

- ✅ `duration` - Set once at start, used throughout
- ✅ `audioSettings` - Set once at start, used for playback
- ✅ `isActive` - Shared state for session status
- ❌ `elapsed` - Only used locally, updates every second

## Testing

After this fix:

1. Start a meditation session
2. Watch the timer count down
3. No React warnings in console
4. Progress ring animates smoothly
5. Session completes successfully

## Files Modified

- `src/screens/SessionScreen.tsx` - Removed unnecessary context update

## Related Issues

This fix complements the earlier gesture handler fixes. Together they ensure:

- Proper thread management (UI vs JS thread)
- Proper state update patterns
- Clean component architecture
