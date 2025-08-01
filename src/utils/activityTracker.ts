/**
 * User Activity Tracker
 * Tracks user activity to pause unnecessary data fetching when user is inactive
 */

interface ActivityState {
  isActive: boolean;
  isVisible: boolean;
  lastActivity: number;
  inactiveThreshold: number;
}

class ActivityTracker {
  private state: ActivityState = {
    isActive: true,
    isVisible: true,
    lastActivity: Date.now(),
    inactiveThreshold: 5 * 60 * 1000 // 5 minutes
  };

  private listeners: Set<(state: ActivityState) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * DISABLED: Initialize activity tracking to prevent unnecessary refreshes
   * Activity tracking is disabled to reduce database egress costs
   */
  initialize() {
    if (this.isInitialized) return;

    // DISABLED: All activity and visibility tracking to prevent tab focus refreshes
    // const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    // activityEvents.forEach(event => {
    //   document.addEventListener(event, this.handleActivity, { passive: true });
    // });

    // DISABLED: Visibility change listener that was causing tab focus refreshes
    // document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // DISABLED: Inactivity check interval
    // this.checkInterval = setInterval(this.checkInactivity, 30000);

    this.isInitialized = true;
    console.log('🎯 Activity tracker initialized (DISABLED to prevent tab focus refreshes)');
  }

  /**
   * Cleanup activity tracking
   */
  cleanup() {
    if (!this.isInitialized) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isInitialized = false;
    console.log('🎯 Activity tracker cleaned up');
  }

  /**
   * Handle user activity
   */
  private handleActivity = () => {
    const wasInactive = !this.state.isActive;
    this.state.lastActivity = Date.now();
    this.state.isActive = true;

    if (wasInactive) {
      console.log('👤 User became active');
      this.notifyListeners();
    }
  };

  /**
   * DISABLED: Handle visibility change to prevent tab focus refreshes
   */
  private handleVisibilityChange = () => {
    // DISABLED: No longer tracking visibility changes to prevent tab focus refreshes
    // const wasVisible = this.state.isVisible;
    // this.state.isVisible = !document.hidden;

    // if (this.state.isVisible && !wasVisible) {
    //   console.log('👁️ Tab became visible');
    //   this.handleActivity(); // Treat visibility as activity
    // } else if (!this.state.isVisible && wasVisible) {
    //   console.log('👁️ Tab became hidden');
    // }

    // this.notifyListeners();
  };

  /**
   * Check for inactivity
   */
  private checkInactivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - this.state.lastActivity;
    const wasActive = this.state.isActive;
    
    this.state.isActive = timeSinceLastActivity < this.state.inactiveThreshold;

    if (wasActive && !this.state.isActive) {
      console.log('😴 User became inactive');
      this.notifyListeners();
    }
  };

  /**
   * Subscribe to activity changes
   */
  subscribe(callback: (state: ActivityState) => void) {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({ ...this.state });
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  /**
   * Get current activity state
   */
  getState(): ActivityState {
    return { ...this.state };
  }

  /**
   * Check if user is active and visible
   */
  isUserEngaged(): boolean {
    return this.state.isActive && this.state.isVisible;
  }

  /**
   * Set inactivity threshold
   */
  setInactivityThreshold(threshold: number) {
    this.state.inactiveThreshold = threshold;
  }
}

// Global activity tracker instance
export const activityTracker = new ActivityTracker();

/**
 * React hook for activity tracking
 */
export const useActivityTracker = () => {
  const [activityState, setActivityState] = React.useState<ActivityState>(
    activityTracker.getState()
  );

  React.useEffect(() => {
    // Initialize tracker
    activityTracker.initialize();

    // Subscribe to changes
    const unsubscribe = activityTracker.subscribe(setActivityState);

    return () => {
      unsubscribe();
      // Don't cleanup the global tracker here as other components might be using it
    };
  }, []);

  return {
    ...activityState,
    isUserEngaged: activityTracker.isUserEngaged(),
    setInactivityThreshold: activityTracker.setInactivityThreshold.bind(activityTracker)
  };
};

// Import React for the hook
import React from 'react';