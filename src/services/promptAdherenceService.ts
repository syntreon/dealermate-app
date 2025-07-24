import { supabase } from '@/integrations/supabase/client';

// Define the interface for the prompt adherence review data
export interface PromptAdherenceReview {
  id: string;
  call_id: string;
  client_id: string;
  prompt_adherence_score: number;
  what_went_well: string[] | null;
  what_went_wrong: string[] | null;
  recommendations_for_improvement: string[] | null;
  critical_failures_summary: string | null;
  reviewed_at: string;
}

// Raw database interface (JSONB fields)
interface PromptAdherenceReviewRaw {
  id: string;
  call_id: string;
  client_id: string;
  prompt_adherence_score: number;
  what_went_well: any; // JSONB
  what_went_wrong: any; // JSONB
  recommendations_for_improvement: any; // JSONB
  critical_failures_summary: string | null;
  reviewed_at: string;
}

export class PromptAdherenceService {
  /**
   * Get prompt adherence review for a specific call
   * @param callId The ID of the call to get the review for
   * @returns The prompt adherence review data or null if not found
   */
  static async getReviewByCallId(callId: string): Promise<PromptAdherenceReview | null> {
    try {
      const { data, error } = await supabase
        .from('prompt_adherence_reviews')
        .select('*')
        .eq('call_id', callId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // This is expected when no review exists for a call
          return null;
        }
        console.error('Error fetching prompt adherence review:', error);
        throw error;
      }

      // Transform raw JSONB data to expected format
      return this.transformRawData(data as PromptAdherenceReviewRaw);
    } catch (error) {
      console.error('Exception fetching prompt adherence review:', error);
      return null;
    }
  }

  /**
   * Transform raw database data (with JSONB) to the expected interface format
   */
  private static transformRawData(raw: PromptAdherenceReviewRaw): PromptAdherenceReview {
    return {
      id: raw.id,
      call_id: raw.call_id,
      client_id: raw.client_id,
      prompt_adherence_score: raw.prompt_adherence_score,
      what_went_well: this.parseJsonbArray(raw.what_went_well),
      what_went_wrong: this.parseJsonbArray(raw.what_went_wrong),
      recommendations_for_improvement: this.parseJsonbArray(raw.recommendations_for_improvement),
      critical_failures_summary: raw.critical_failures_summary,
      reviewed_at: raw.reviewed_at,
    };
  }

  /**
   * Parse JSONB array data safely
   */
  private static parseJsonbArray(jsonbData: any): string[] | null {
    if (!jsonbData) return null;
    
    // If it's already an array, return it
    if (Array.isArray(jsonbData)) {
      return jsonbData.filter(item => typeof item === 'string');
    }
    
    // If it's a string, try multiple parsing approaches
    if (typeof jsonbData === 'string') {
      // First try to parse as JSON
      try {
        const parsed = JSON.parse(jsonbData);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string');
        }
      } catch (e) {
        // If JSON parsing fails, treat as plain text and split by common delimiters
        console.debug('JSONB data is plain text, parsing as delimited content');
        
        // Try to split by common patterns that might indicate separate items
        const items = jsonbData
          .split(/(?:Rule:|CRITICAL FAILURE:|Guiding Principle:|Systemic Change:|Training\/Fine-tuning:|Refinement:|Error Recovery:)/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (items.length > 1) {
          return items;
        }
        
        // If no clear delimiters, return as single item
        return [jsonbData];
      }
    }
    
    return null;
  }

  /**
   * Get a color based on the adherence score
   * @param score The adherence score (1-5)
   * @returns An object with color and label properties
   */
  static getScoreDisplay(score: number) {
    if (score >= 4.5) {
      return { color: 'green', label: 'Excellent' };
    } else if (score >= 4) {
      return { color: 'green', label: 'Very Good' };
    } else if (score >= 3) {
      return { color: 'yellow', label: 'Good' };
    } else if (score >= 2) {
      return { color: 'yellow', label: 'Fair' };
    } else {
      return { color: 'red', label: 'Poor' };
    }
  }
}
