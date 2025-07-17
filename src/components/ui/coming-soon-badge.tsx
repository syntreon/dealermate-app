
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComingSoonBadgeProps {
  text?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

export function ComingSoonBadge({ 
  text = "Coming Soon", 
  variant = "default", 
  className 
}: ComingSoonBadgeProps) {
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "ml-2 bg-purple/20 text-purple border-purple/30 hover:bg-purple/30 text-xs px-2 py-1 animate-pulse", 
        className
      )}
    >
      {text}
    </Badge>
  );
}
