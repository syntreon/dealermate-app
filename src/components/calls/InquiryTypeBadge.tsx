import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  ShoppingCart, 
  Wrench, 
  Package, 
  Car, 
  CreditCard, 
  RefreshCw, 
  HelpCircle 
} from 'lucide-react';

interface InquiryTypeBadgeProps {
  inquiryType: string | null;
  className?: string;
}

// Colors matching CallAnalytics.tsx
const inquiryColors = {
  general: '#a78bfa',     // Light purple shade
  purchase: '#10b981',    // Green shade
  service: '#f59e0b',     // Orange shade
  parts: '#3b82f6',       // Blue shade
  test_drive: '#ec4899',  // Pink shade
  finance: '#14b8a6',     // Teal shade
  trade_in: '#8b5cf6',    // Purple shade
  other: '#6b7280'        // Grey shade
};

const InquiryTypeBadge: React.FC<InquiryTypeBadgeProps> = ({ inquiryType, className }) => {
  if (!inquiryType) {
    return (
      <Badge variant="outline" className={cn('text-xs', className)}>
        <HelpCircle className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  const normalizedType = inquiryType.toLowerCase();
  
  // Get the appropriate icon based on inquiry type
  const getIcon = () => {
    switch(normalizedType) {
      case 'general':
        return <MessageSquare className="h-3 w-3 mr-1" />;
      case 'purchase':
        return <ShoppingCart className="h-3 w-3 mr-1" />;
      case 'service':
        return <Wrench className="h-3 w-3 mr-1" />;
      case 'parts':
        return <Package className="h-3 w-3 mr-1" />;
      case 'test_drive':
        return <Car className="h-3 w-3 mr-1" />;
      case 'finance':
        return <CreditCard className="h-3 w-3 mr-1" />;
      case 'trade_in':
        return <RefreshCw className="h-3 w-3 mr-1" />;
      default:
        return <HelpCircle className="h-3 w-3 mr-1" />;
    }
  };

  // Format the display text
  const getDisplayText = () => {
    switch(normalizedType) {
      case 'test_drive':
        return 'Test Drive';
      case 'trade_in':
        return 'Trade In';
      default:
        return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
    }
  };

  const color = inquiryColors[normalizedType as keyof typeof inquiryColors] || inquiryColors.other;

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs border', className)}
      style={{ 
        backgroundColor: `${color}15`, // 15% opacity
        borderColor: `${color}40`, // 40% opacity
        color: color
      }}
    >
      {getIcon()}
      {getDisplayText()}
    </Badge>
  );
};

export default InquiryTypeBadge;