/**
 * IMMEDIATE EMERGENCY FIX
 * Direct activation of emergency mode to stop database egress costs
 */

// Global flag to track emergency state
let isEmergencyActive = false;

/**
 * Activate emergency mode immediately
 */
const activateEmergencyMode = () => {
  console.error('🚨 ACTIVATING EMERGENCY EGRESS MODE');
  
  // Clear all existing intervals
  const highestId = setTimeout(() => {}, 0);
  for (let i = 1; i <= highestId; i++) {
    clearInterval(i);
    clearTimeout(i);
  }
  console.log(`🧹 Cleared all intervals and timeouts up to ID ${highestId}`);
  
  // Set emergency flag
  isEmergencyActive = true;
  
  // Store in localStorage for persistence
  localStorage.setItem('egress_emergency_mode', 'true');
  localStorage.setItem('egress_emergency_timestamp', Date.now().toString());
  
  console.error('🛑 Emergency mode activated - all auto-refresh stopped');
  
  // Show alert
  if (typeof window !== 'undefined' && window.alert) {
    alert('🚨 Emergency Mode Activated\n\nAll automatic data refreshing has been disabled to prevent excessive database usage.');
  }
};

/**
 * Deactivate emergency mode
 */
const deactivateEmergencyMode = () => {
  console.log('✅ DEACTIVATING EMERGENCY EGRESS MODE');
  
  isEmergencyActive = false;
  localStorage.removeItem('egress_emergency_mode');
  localStorage.removeItem('egress_emergency_timestamp');
  
  console.log('✅ Emergency mode deactivated');
};

/**
 * Get emergency status
 */
const getEmergencyStatus = () => {
  return {
    isActive: isEmergencyActive,
    activatedAt: localStorage.getItem('egress_emergency_timestamp'),
    duration: isEmergencyActive ? Date.now() - parseInt(localStorage.getItem('egress_emergency_timestamp') || '0') : 0
  };
};

/**
 * Check if emergency mode should be active on page load
 */
const checkEmergencyModeOnLoad = () => {
  const emergencyMode = localStorage.getItem('egress_emergency_mode');
  if (emergencyMode === 'true') {
    console.warn('🚨 Emergency mode was active, reactivating...');
    isEmergencyActive = true;
    
    // Clear intervals again
    const highestId = setTimeout(() => {}, 0);
    for (let i = 1; i <= highestId; i++) {
      clearInterval(i);
      clearTimeout(i);
    }
  }
};

// Initialize on load
checkEmergencyModeOnLoad();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).emergencyFix = {
    activate: activateEmergencyMode,
    deactivate: deactivateEmergencyMode,
    status: getEmergencyStatus
  };
  
  console.log('🚨 EMERGENCY FIX LOADED - Run: window.emergencyFix.activate()');
}

// Auto-activate if environment variable is set
if (typeof window !== 'undefined') {
  // Check for emergency mode in URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const forceEmergency = urlParams.get('emergency') === 'true';
  const envEmergency = localStorage.getItem('egress_emergency_mode') === 'true';
  
  if (forceEmergency || envEmergency) {
    console.warn('🚨 Auto-activating emergency mode...');
    setTimeout(activateEmergencyMode, 1000);
  }
}

export { activateEmergencyMode, deactivateEmergencyMode, getEmergencyStatus };