import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Meh, 
  Frown, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  HelpCircle 
} from 'lucide-react';

interface OverallScoreBadgeProps {
  score: number | null;
  className?: string;
}

export const OverallScoreBadge: React.FC<OverallScoreBadgeProps> = ({ score, className }) => {
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground border-muted-foreground', className)}>
        <HelpCircle className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  const getScoreColor = () => {
    if (score >= 4) return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400';
    if (score >= 2.5) return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400';
    return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400';
  };

  const getScoreIcon = () => {
    if (score >= 4) return <CheckCircle className="h-3 w-3 mr-1" />;
    if (score >= 2.5) return <AlertTriangle className="h-3 w-3 mr-1" />;
    return <XCircle className="h-3 w-3 mr-1" />;
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs', getScoreColor(), className)}
    >
      {getScoreIcon()}
      {score.toFixed(1)}/5.0
    </Badge>
  );
};

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  className?: string;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, className }) => {
  if (!sentiment) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground border-muted-foreground', className)}>
        <HelpCircle className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  const getSentimentStyle = () => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400';
      default:
        return 'text-muted-foreground border-muted-foreground';
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <Heart className="h-3 w-3 mr-1" />;
      case 'negative':
        return <Frown className="h-3 w-3 mr-1" />;
      default:
        return <Meh className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs capitalize', getSentimentStyle(), className)}
    >
      {getSentimentIcon()}
      {sentiment}
    </Badge>
  );
};

interface PromptAdherenceBadgeProps {
  score: number | null;
  className?: string;
}

export const PromptAdherenceBadge: React.FC<PromptAdherenceBadgeProps> = ({ score, className }) => {
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground border-muted-foreground', className)}>
        <HelpCircle className="h-3 w-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  const getAdherenceColor = () => {
    if (score >= 85) return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400';
    return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400';
  };

  const getAdherenceIcon = () => {
    if (score >= 85) return <CheckCircle className="h-3 w-3 mr-1" />;
    if (score >= 60) return <AlertTriangle className="h-3 w-3 mr-1" />;
    return <XCircle className="h-3 w-3 mr-1" />;
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('text-xs', getAdherenceColor(), className)}
    >
      {getAdherenceIcon()}
      {score.toFixed(0)}
    </Badge>
  );
};