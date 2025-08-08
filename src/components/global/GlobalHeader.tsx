import React from 'react';
import TopBar from '@/components/TopBar';

// GlobalHeader mounts once at the app root. TopBar internally renders via a portal
// to document.body, so DOM hierarchy is decoupled from layouts.
// Future: we can split SystemBanner from TopBar here if desired.
const GlobalHeader: React.FC = () => {
  return <TopBar />;
};

export default GlobalHeader;
