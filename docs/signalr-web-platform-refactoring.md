# SignalR Web Platform Refactoring

## Summary

This refactoring addresses multiple issues with the SignalR infrastructure to ensure correct operation on the web platform while preventing memory leaks, threading issues, and connection starvation.

## Issues Addressed

### 1. Memory Leaks

**Problem:** Event listeners were registered via `signalRService.on()` in the SignalR store but never removed with `signalRService.off()` on disconnect. This caused:
- Accumulation of duplicate event handlers on reconnection
- Memory growth over time
- Multiple callbacks firing for single events

**Solution:**
- Added `EventHandlers` interface to track registered handlers in `signalr-store.ts`
- Created `unregisterUpdateHubHandlers()` function for proper cleanup
- Handlers are now stored as named references that can be properly unregistered
- Cleanup happens automatically on disconnect

### 2. Reconnection Timeout Leaks

**Problem:** `setTimeout` IDs for reconnection attempts were not tracked, making them impossible to cancel properly. This caused:
- Multiple concurrent reconnection attempts
- Resource waste when intentionally disconnecting
- Orphaned timers continuing to fire after connection was established

**Solution:**
- Added `reconnectTimeouts` Map to track timeout IDs per hub
- Added `cancelPendingReconnect()` and `cancelAllPendingReconnects()` methods
- Timeouts are cancelled on:
  - Successful connection
  - Explicit disconnect
  - Service reset
  - Page visibility change (web)

### 3. Web Platform Visibility Handling

**Problem:** Reconnection timers would fire even when the browser tab was backgrounded, wasting resources and potentially causing issues with backgrounded tabs.

**Solution:**
- Added visibility change event listener using `document.visibilityState`
- Reconnection attempts are skipped when page is not visible
- On visibility resume, connections are checked and reconnected if needed
- Reconnect attempts counter is reset on visibility resume for fresh attempts
- Proper cleanup of visibility listener on service destruction

### 4. Connection Cancellation

**Problem:** No way to cancel pending connection attempts, leading to:
- Stuck connection states
- Multiple overlapping connection attempts
- Difficulty in clean disconnect

**Solution:**
- Added `AbortController` for each connection attempt
- Previous pending connections are cancelled when new connection is initiated
- Cancellation is handled gracefully without error logging
- Pending connections are cancelled on explicit disconnect

### 5. Exponential Backoff for Reconnection

**Problem:** Fixed reconnection interval could overwhelm servers during outages.

**Solution:**
- Implemented exponential backoff with `RECONNECT_BACKOFF_MULTIPLIER = 1.5`
- Maximum delay capped at 30 seconds
- Provides better server load distribution during issues

### 6. Hub Method Handler Cleanup

**Problem:** Method handlers registered on the SignalR connection were not being tracked or cleaned up, leading to duplicate handlers.

**Solution:**
- Added `hubMethodHandlers` Map to track handlers per hub
- Created `cleanupHubMethodHandlers()` method for proper cleanup
- Handlers are unregistered on:
  - Connection disconnect
  - Reconnection (before new registration)
  - Service reset

## Code Changes

### `src/services/signalr.service.ts`

1. **New Properties:**
   ```typescript
   private reconnectTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
   private hubMethodHandlers: Map<string, HubMethodHandler[]> = new Map();
   private isPageVisible: boolean = true;
   private visibilityChangeHandler: (() => void) | null = null;
   private pendingConnections: Map<string, AbortController> = new Map();
   private readonly RECONNECT_BACKOFF_MULTIPLIER = 1.5;
   ```

2. **New Methods:**
   - `setupVisibilityHandling()` - Sets up web visibility change listener
   - `cleanupVisibilityHandling()` - Removes visibility listener
   - `cancelAllPendingReconnects()` - Cancels all pending reconnection timeouts
   - `cancelPendingReconnect(hubName)` - Cancels specific hub reconnection timeout
   - `checkAndReconnectOnVisibilityResume()` - Reconnects disconnected hubs when tab becomes visible
   - `cleanupHubMethodHandlers(hubName, connection)` - Removes registered method handlers
   - `offAll(event)` - Removes all listeners for a specific event
   - `removeAllListeners()` - Removes all event listeners
   - `getEventListenerCount(event)` - Debug utility to count listeners
   - `getTotalEventListenerCount()` - Debug utility for total listener count
   - `isVisible()` - Returns current page visibility state

3. **Modified Methods:**
   - `_connectToHubWithEventingUrlInternal()` - Added AbortController, method handler tracking
   - `_connectToHubInternal()` - Added AbortController, method handler tracking
   - `handleConnectionClose()` - Added timeout tracking, backoff delay, visibility check
   - `disconnectFromHub()` - Added cleanup for timeouts and pending connections
   - `resetInstance()` - Added comprehensive cleanup
   - `disconnectAll()` - Added cleanup for pending operations

### `src/stores/signalr/signalr-store.ts`

1. **New Module-Level Code:**
   ```typescript
   interface EventHandlers {
     personnelStatusUpdated: ((data: unknown) => void) | null;
     // ... other handlers
   }

   let updateHubHandlers: EventHandlers = { /* ... */ };

   function unregisterUpdateHubHandlers(): void { /* ... */ }
   ```

2. **Modified `connectUpdateHub`:**
   - Calls `unregisterUpdateHubHandlers()` before registering new handlers
   - Stores handler references for later cleanup
   - Logs listener count for debugging

3. **Modified `disconnectUpdateHub`:**
   - Calls `unregisterUpdateHubHandlers()` before disconnecting
   - Logs remaining listener count for debugging

## Testing

All existing tests continue to pass:
- `src/services/__tests__/signalr.service.test.ts` - Core service tests
- `src/services/__tests__/signalr.service.reconnect-fix.test.ts` - Reconnection tests
- `src/stores/signalr/__tests__/signalr-store.test.ts` - Store tests

## Migration Notes

- No breaking changes to the public API
- Existing code using `signalRService.on()` should continue to work
- For best practices, use the new `getTotalEventListenerCount()` method to monitor for leaks during development
- The visibility handling is automatic on web platform

## Debugging Memory Leaks

If you suspect memory leaks, you can check listener counts:

```typescript
// Check total listeners
console.log('Total listeners:', signalRService.getTotalEventListenerCount());

// Check specific event listeners
console.log('callsUpdated listeners:', signalRService.getEventListenerCount('callsUpdated'));
```

Expected values:
- After connect: 7 listeners (one per event type)
- After disconnect: 0 listeners
- Multiple connect/disconnect cycles should maintain these numbers
