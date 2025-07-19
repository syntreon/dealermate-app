
import React from 'react';
import { Phone } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple to-purple-light flex items-center justify-center">
        <Phone className="h-4 w-4 text-white" />
      </div>
      <span className="font-medium text-lg text-gradient-primary">DealerMate <span className="font-bold">AI</span></span>
    </div>
  );
};

export default Logo;
