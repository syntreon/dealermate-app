
import React from 'react';
import { Phone } from 'lucide-react';

interface LogoProps {
  className?: string;
}

import { useIsMobile } from '@/hooks/use-mobile';

const Logo = ({ className }: LogoProps) => {
  const isMobile = useIsMobile();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Responsive logo: smaller icon and text on mobile, default on desktop */}
      <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-gradient-to-br from-purple to-purple-light flex items-center justify-center">
        <Phone className="h-3 w-3 md:h-4 md:w-4 text-white" />
      </div>
      <span className="font-medium text-base md:text-lg text-gradient-primary">
        DealerMate
        {!isMobile && <span className="font-bold">&nbsp;AI</span>}
      </span>
    </div>
  );
};

export default Logo;
