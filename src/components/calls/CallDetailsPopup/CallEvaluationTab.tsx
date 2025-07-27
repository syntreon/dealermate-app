import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Meh,
  Frown,
  AlertTriangle,
  ShieldCheck,
  DatabaseZap,
  Info,
} from 'lucide-react';
import { CallLog } from '@/integrations/supabase/call-logs-service';
import { LeadEvaluationService } from '@/services/leadEvaluationService';
import { LeadEvaluationSummary } from '@/types/leadEvaluation';
import { PromptAdherenceService, PromptAdherenceReview } from '@/services/promptAdherenceService';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { canViewCallEvaluation, canViewSensitiveInfo } from '@/utils/clientDataIsolation';

interface CallEvaluationTabProps {
  call: CallLog | null;
}

export const CallEvaluationTab: React.FC<CallEvaluationTabProps> = ({ call }) => {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<LeadEvaluationSummary | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [promptAdherence, setPromptAdherence] = useState<PromptAdherenceReview | null>(null);
  const [promptAdherenceLoading, setPromptAdherenceLoading] = useState(false);

  // Check if user can view evaluation data
  const canViewEvaluation = canViewCallEvaluation(user);
  const canViewPromptAdherence = canViewSensitiveInfo(user); // Only system-wide users can see prompt adherence

  // Load evaluation data when call changes
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!call?.id || !canViewEvaluation) {
        setEvaluation(null);
        return;
      }

      setEvaluationLoading(true);
      try {
        const evaluationData = await LeadEvaluationService.getEvaluationByCallId(call.id);
        if (evaluationData) {
          const summary = LeadEvaluationService.transformToSummary(evaluationData);
          setEvaluation(summary);
        } else {
          setEvaluation(null);
        }
      } catch (error) {
        console.error('Error loading evaluation:', error);
        setEvaluation(null);
      } finally {
        setEvaluationLoading(false);
      }
    };

    loadEvaluation();
  }, [call, canViewEvaluation]);

  // Load prompt adherence review data when call changes (only for system-wide users)
  useEffect(() => {
    const loadPromptAdherence = async () => {
      if (!call?.id || !canViewPromptAdherence) {
        setPromptAdherence(null);
        return;
      }

      setPromptAdherenceLoading(true);
      try {
        const adherenceData = await PromptAdherenceService.getReviewByCallId(call.id);
        setPromptAdherence(adherenceData);
      } catch (error) {
        console.error('Error loading prompt adherence review:', error);
        setPromptAdherence(null);
      } finally {
        setPromptAdherenceLoading(false);
      }
    };

    loadPromptAdherence();
  }, [call, canViewPromptAdherence]);

  // If user doesn't have permission to view evaluations, show access denied
  if (!canViewEvaluation) {
    return (
      <ScrollArea className="h-full pr-4">
        <Card className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            <ShieldCheck className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">Access Restricted</h3>
            <p className="text-sm">You don't have permission to view call evaluation data.</p>
          </div>
        </Card>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      {evaluationLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : evaluation ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Evaluation</CardTitle>
              <CardDescription>
                Summary of the call's quality and outcome.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <span
                  className={cn('text-5xl font-bold',
                    evaluation.overallScore === null ? 'text-muted-foreground' :
                    evaluation.overallScore >= 4 ? 'text-success'
                    : evaluation.overallScore >= 2.5 ? 'text-warning'
                    : 'text-destructive'
                  )}
                >
                  {evaluation.overallScore?.toFixed(1) ?? 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground">out of 5.0</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {evaluation.summary || 'No summary available.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                {evaluation.sentiment === 'positive' && <Heart className="h-4 w-4 text-success" />}
                {evaluation.sentiment === 'neutral' && <Meh className="h-4 w-4 text-warning" />}
                {evaluation.sentiment === 'negative' && <Frown className="h-4 w-4 text-destructive" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{evaluation.sentiment}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Review Needed</CardTitle>
                {evaluation.humanReviewRequired ? <AlertTriangle className="h-4 w-4 text-warning" /> : <ShieldCheck className="h-4 w-4 text-success" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{evaluation.humanReviewRequired ? 'Yes' : 'No'}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Score Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Evaluation Scores</CardTitle>
              <CardDescription>
                Individual performance metrics for this call.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {evaluation.cards.map((card, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{card.title}</span>
                      <div className="flex items-center gap-1">
                        <span className={cn('text-lg font-bold',
                          card.color === 'green' ? 'text-green-600' :
                          card.color === 'yellow' ? 'text-yellow-600' :
                          card.color === 'red' ? 'text-red-600' :
                          card.color === 'blue' ? 'text-blue-600' :
                          'text-purple-600'
                        )}>
                          {card.score.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {card.maxScore || 5}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full transition-all',
                          card.color === 'green' ? 'bg-green-500' :
                          card.color === 'yellow' ? 'bg-yellow-500' :
                          card.color === 'red' ? 'bg-red-500' :
                          card.color === 'blue' ? 'bg-blue-500' :
                          'bg-purple-500'
                        )}
                        style={{ 
                          width: `${(card.score / (card.maxScore || 5)) * 100}%` 
                        }}
                      />
                    </div>
                    
                    {/* Rationale if available */}
                    {card.rationale && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Adherence - Only visible to system-wide users */}
          {canViewPromptAdherence && (
            promptAdherenceLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : promptAdherence ? (
              <Card>
                <CardHeader>
                  <CardTitle>AI Prompt Adherence</CardTitle>
                  <CardDescription>
                    How well the AI followed its prescribed script and guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Adherence Score</span>
                    <span
                      className={cn('text-5xl font-bold',
                        promptAdherence.prompt_adherence_score === null ? 'text-muted-foreground' :
                        promptAdherence.prompt_adherence_score >= 85 ? 'text-success'
                        : promptAdherence.prompt_adherence_score >= 60 ? 'text-warning'
                        : 'text-destructive'
                      )}
                    >
                      {promptAdherence.prompt_adherence_score?.toFixed(0) ?? 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">out of 5</span>
                  </div>
                  
                  {promptAdherence.what_went_well && Array.isArray(promptAdherence.what_went_well) && promptAdherence.what_went_well.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">What Went Well</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {promptAdherence.what_went_well.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {promptAdherence.what_went_wrong && Array.isArray(promptAdherence.what_went_wrong) && promptAdherence.what_went_wrong.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {promptAdherence.what_went_wrong.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {promptAdherence.critical_failures_summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Critical Failures</h4>
                      <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{promptAdherence.critical_failures_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                  <Info className="mx-auto h-8 w-8 mb-2" />
                  <p>No prompt adherence review available for this call.</p>
                </div>
              </Card>
            )
          )}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            <DatabaseZap className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No Evaluation Data</h3>
            <p className="text-sm">This call has not been evaluated yet.</p>
          </div>
        </Card>
      )}
    </ScrollArea>
  );
};