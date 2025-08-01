/**
 * Emergency Egress Stop Utility
 * Immediately stops all auto-refresh intervals and data fetching to prevent excessive database calls
 */

import { emergencyStop, updateEgressConfig } from '@/config/egressOptimization';

// Global flag to track emergency state
let isEmergencyActive = false;

/**
 * Activate emergency mode - stops all auto-refresh and reduces database calls to minimum
 */
export const activateEmergencyMode = () => {
    if (isEmergencyActive) {
        console.warn('🚨 Emergency mode already active');
        return;
    }

    console.error('🚨 ACTIVATING EMERGENCY EGRESS MODE');

    // Stop all auto-refresh
    emergencyStop();

    // Clear all existing intervals
    clearAllIntervals();

    // Set emergency flag
    isEmergencyActive = true;

    // Store in localStorage for persistence across page reloads
    localStorage.setItem('egress_emergency_mode', 'true');
    localStorage.setItem('egress_emergency_timestamp', Date.now().toString());

    // Show user notification
    if (typeof window !== 'undefined' && window.alert) {
        alert('🚨 Emergency Mode Activated\n\nAll automatic data refreshing has been disabled to prevent excessive database usage. Please refresh data manually when needed.');
    }

    console.error('🛑 Emergency mode activated - all auto-refresh stopped');
};

/**
 * Deactivate emergency mode - restore normal operation
 */
export const deactivateEmergencyMode = () => {
    if (!isEmergencyActive) {
        console.log('ℹ️ Emergency mode not active');
        return;
    }

    console.log('✅ DEACTIVATING EMERGENCY EGRESS MODE');

    // Reset configuration to production defaults
    updateEgressConfig({
        autoRefresh: {
            enabled: false, // Keep disabled by default
            defaultInterval: 15 * 60 * 1000,
            minInterval: 60 * 1000,
            pauseOnInactive: true,
            pauseOnHidden: true,
        },
        components: {
            adminDashboard: {
                autoRefreshInterval: 20 * 60 * 1000,
                enableToasts: false,
                retryAttempts: 2,
            },
            realtimeWidgets: {
                enabled: false, // Keep disabled
                updateInterval: 5 * 60 * 1000,
            },
            systemHealth: {
                enabled: false, // Keep disabled
                checkInterval: 10 * 60 * 1000,
            },
        }
    });

    // Clear emergency flag
    isEmergencyActive = false;

    // Remove from localStorage
    localStorage.removeItem('egress_emergency_mode');
    localStorage.removeItem('egress_emergency_timestamp');

    console.log('✅ Emergency mode deactivated - normal operation restored');
};

/**
 * Check if emergency mode should be active on page load
 */
export const checkEmergencyModeOnLoad = () => {
    const emergencyMode = localStorage.getItem('egress_emergency_mode');
    const emergencyTimestamp = localStorage.getItem('egress_emergency_timestamp');

    if (emergencyMode === 'true') {
        const timestamp = parseInt(emergencyTimestamp || '0');
        const hoursSinceActivation = (Date.now() - timestamp) / (1000 * 60 * 60);

        if (hoursSinceActivation < 24) { // Auto-deactivate after 24 hours
            console.warn('🚨 Emergency mode was active, reactivating...');
            isEmergencyActive = true;
            emergencyStop();
        } else {
            console.log('⏰ Emergency mode expired, deactivating...');
            deactivateEmergencyMode();
        }
    }
};

/**
 * Clear all setInterval timers (nuclear option)
 */
const clearAllIntervals = () => {
    // Get the highest interval ID and clear all intervals up to that point
    const highestId = setTimeout(() => { }, 0);

    for (let i = 1; i <= highestId; i++) {
        clearInterval(i);
        clearTimeout(i);
    }

    console.log(`🧹 Cleared all intervals and timeouts up to ID ${highestId}`);
};

/**
 * Get emergency mode status
 */
export const getEmergencyStatus = () => {
    return {
        isActive: isEmergencyActive,
        activatedAt: localStorage.getItem('egress_emergency_timestamp'),
        duration: isEmergencyActive ? Date.now() - parseInt(localStorage.getItem('egress_emergency_timestamp') || '0') : 0
    };
};

/**
 * Add emergency mode controls to window for debugging
 */
if (typeof window !== 'undefined') {
    (window as any).egressEmergency = {
        activate: activateEmergencyMode,
        deactivate: deactivateEmergencyMode,
        status: getEmergencyStatus,
        clearAllIntervals
    };

    console.log('🔧 Emergency egress controls available at window.egressEmergency');
}

// Check emergency mode on module load
checkEmergencyModeOnLoad();