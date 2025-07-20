import { supabase } from '@/integrations/supabase/client';

/**
 * Test utility to check lead_evaluations table and data
 * 
 * NOTE: This file is for development and testing purposes only.
 * It should not be imported or used in production code.
 */
export const testQualityData = async () => {
  console.log('=== Testing Quality Analytics Data ===');
  
  try {
    // Test 1: Check if table exists and get basic count
    console.log('1. Testing basic table access...');
    const { data: countData, error: countError } = await supabase
      .from('lead_evaluations' as any)
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Count query error:', countError);
    } else {
      console.log('Total records in lead_evaluations:', countData);
    }

    // Test 2: Get a few sample records
    console.log('2. Getting sample records...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('lead_evaluations' as any)
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('Sample query error:', sampleError);
    } else {
      console.log('Sample records:', sampleData);
      if (sampleData && sampleData.length > 0) {
        console.log('First record structure:', Object.keys(sampleData[0]));
        console.log('Sentiment values:', sampleData.map((r: any) => r.sentiment));
      }
    }

    // Test 3: Test sentiment grouping
    console.log('3. Testing sentiment grouping...');
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('lead_evaluations' as any)
      .select('sentiment')
      .limit(100);
    
    if (sentimentError) {
      console.error('Sentiment query error:', sentimentError);
    } else {
      console.log('Sentiment data:', sentimentData);
      if (sentimentData) {
        const sentimentCounts = sentimentData.reduce((acc: any, item: any) => {
          const sentiment = item.sentiment;
          acc[sentiment] = (acc[sentiment] || 0) + 1;
          return acc;
        }, {});
        console.log('Sentiment breakdown:', sentimentCounts);
      }
    }

    // Test 4: Test with client filtering (if user has client_id)
    console.log('4. Testing client filtering...');
    const { data: clientData, error: clientError } = await supabase
      .from('lead_evaluations' as any)
      .select('client_id, sentiment')
      .limit(10);
    
    if (clientError) {
      console.error('Client filter error:', clientError);
    } else {
      console.log('Client data sample:', clientData);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
  
  console.log('=== End Quality Analytics Test ===');
};

/**
 * Insert sample data for testing (use with caution)
 */
export const insertSampleQualityData = async (clientId: string) => {
  console.log('=== Inserting Sample Quality Data ===');
  
  const sampleData = [
    {
      client_id: clientId,
      call_id: '00000000-0000-0000-0000-000000000001', // This would need to be a valid call_id
      lead_completion_score: 8,
      clarity_politeness_score: 9,
      relevance_questions_score: 7,
      objection_handling_score: 8,
      naturalness_score: 9,
      lead_intent_score: 8,
      sentiment: 'positive',
      failure_risk_score: 2,
      negative_call_flag: false,
      human_review_required: false,
      overall_evaluation_score: 4.2,
      evaluated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      call_id: '00000000-0000-0000-0000-000000000002',
      lead_completion_score: 6,
      clarity_politeness_score: 7,
      relevance_questions_score: 5,
      objection_handling_score: 6,
      naturalness_score: 7,
      lead_intent_score: 6,
      sentiment: 'neutral',
      failure_risk_score: 4,
      negative_call_flag: false,
      human_review_required: true,
      review_reason: 'Low clarity score',
      overall_evaluation_score: 3.1,
      evaluated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      call_id: '00000000-0000-0000-0000-000000000003',
      lead_completion_score: 4,
      clarity_politeness_score: 5,
      relevance_questions_score: 3,
      objection_handling_score: 4,
      naturalness_score: 5,
      lead_intent_score: 4,
      sentiment: 'negative',
      failure_risk_score: 7,
      negative_call_flag: true,
      human_review_required: true,
      review_reason: 'Negative sentiment',
      overall_evaluation_score: 2.1,
      evaluated_at: new Date().toISOString()
    }
  ];

  try {
    const { data, error } = await supabase
      .from('lead_evaluations' as any)
      .insert(sampleData);
    
    if (error) {
      console.error('Error inserting sample data:', error);
    } else {
      console.log('Sample data inserted successfully:', data);
    }
  } catch (error) {
    console.error('Insert failed:', error);
  }
};
