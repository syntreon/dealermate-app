// Basic Supabase types for the application
// This file contains the essential type definitions for our database tables

export interface Database {
    public: {
        Tables: {
            calls: {
                Row: {
                    id: string;
                    client_id: string;
                    call_type: string;
                    call_start_time: string;
                    call_end_time: string;
                    call_duration_seconds: number;
                    recording_url?: string;
                    transcript: string;
                    caller_phone_number?: string;
                    caller_full_name?: string;
                    assistant_id?: string;
                    hangup_reason?: string;
                    transfer_flag?: boolean;
                    created_at?: string;
                    vapi_call_cost_usd?: number;
                    vapi_llm_cost_usd?: number;
                    openai_api_tokens_input?: number;
                    openai_api_tokens_output?: number;
                    openai_api_cost_usd?: number;
                    total_call_cost_usd?: number;
                    sms_cost_usd?: number;
                    tool_cost_usd?: number;
                    twillio_call_cost_usd?: number;
                    call_summary?: string;
                    to_phone_number?: string;
                    call_duration_mins?: number;
                    total_cost_cad?: number;
                    make_com_operations?: number;
                    tts_cost?: number;
                    transcriber_cost?: number;
                    voice_provider?: string;
                    voice_model?: string;
                    transcriber_provider?: string;
                    transcriber_model?: string;
                    call_llm_model?: string;
                    call_summary_cost?: number;
                };
                Insert: {
                    id?: string;
                    client_id: string;
                    call_type: string;
                    call_start_time: string;
                    call_end_time: string;
                    call_duration_seconds: number;
                    recording_url?: string;
                    transcript: string;
                    caller_phone_number?: string;
                    caller_full_name?: string;
                    assistant_id?: string;
                    hangup_reason?: string;
                    transfer_flag?: boolean;
                    created_at?: string;
                    vapi_call_cost_usd?: number;
                    vapi_llm_cost_usd?: number;
                    openai_api_tokens_input?: number;
                    openai_api_tokens_output?: number;
                    openai_api_cost_usd?: number;
                    total_call_cost_usd?: number;
                    sms_cost_usd?: number;
                    tool_cost_usd?: number;
                    twillio_call_cost_usd?: number;
                    call_summary?: string;
                    to_phone_number?: string;
                    call_duration_mins?: number;
                    total_cost_cad?: number;
                    make_com_operations?: number;
                    tts_cost?: number;
                    transcriber_cost?: number;
                    voice_provider?: string;
                    voice_model?: string;
                    transcriber_provider?: string;
                    transcriber_model?: string;
                    call_llm_model?: string;
                    call_summary_cost?: number;
                };
                Update: {
                    id?: string;
                    client_id?: string;
                    call_type?: string;
                    call_start_time?: string;
                    call_end_time?: string;
                    call_duration_seconds?: number;
                    recording_url?: string;
                    transcript?: string;
                    caller_phone_number?: string;
                    caller_full_name?: string;
                    assistant_id?: string;
                    hangup_reason?: string;
                    transfer_flag?: boolean;
                    created_at?: string;
                    vapi_call_cost_usd?: number;
                    vapi_llm_cost_usd?: number;
                    openai_api_tokens_input?: number;
                    openai_api_tokens_output?: number;
                    openai_api_cost_usd?: number;
                    total_call_cost_usd?: number;
                    sms_cost_usd?: number;
                    tool_cost_usd?: number;
                    twillio_call_cost_usd?: number;
                    call_summary?: string;
                    to_phone_number?: string;
                    call_duration_mins?: number;
                    total_cost_cad?: number;
                    make_com_operations?: number;
                    tts_cost?: number;
                    transcriber_cost?: number;
                    voice_provider?: string;
                    voice_model?: string;
                    transcriber_provider?: string;
                    transcriber_model?: string;
                    call_llm_model?: string;
                    call_summary_cost?: number;
                };
            };
            lead_evaluations: {
                Row: {
                    id: string;
                    call_id: string;
                    client_id: string;
                    lead_completion_score: number;
                    clarity_politeness_score: number;
                    clarity_politeness_rationale?: string;
                    relevance_questions_score: number;
                    relevance_questions_rationale?: string;
                    objection_handling_score: number;
                    objection_handling_rationale?: string;
                    naturalness_score: number;
                    naturalness_rationale?: string;
                    lead_intent_score: number;
                    lead_intent_rationale?: string;
                    sentiment: 'positive' | 'neutral' | 'negative';
                    sentiment_rationale?: string;
                    failure_risk_score: number;
                    failure_risk_rationale?: string;
                    negative_call_flag: boolean;
                    human_review_required: boolean;
                    review_reason?: string;
                    evaluated_at?: string;
                    overall_evaluation_score?: number;
                };
                Insert: {
                    id?: string;
                    call_id: string;
                    client_id: string;
                    lead_completion_score: number;
                    clarity_politeness_score: number;
                    clarity_politeness_rationale?: string;
                    relevance_questions_score: number;
                    relevance_questions_rationale?: string;
                    objection_handling_score: number;
                    objection_handling_rationale?: string;
                    naturalness_score: number;
                    naturalness_rationale?: string;
                    lead_intent_score: number;
                    lead_intent_rationale?: string;
                    sentiment: 'positive' | 'neutral' | 'negative';
                    sentiment_rationale?: string;
                    failure_risk_score: number;
                    failure_risk_rationale?: string;
                    negative_call_flag?: boolean;
                    human_review_required?: boolean;
                    review_reason?: string;
                    evaluated_at?: string;
                    overall_evaluation_score?: number;
                };
                Update: {
                    id?: string;
                    call_id?: string;
                    client_id?: string;
                    lead_completion_score?: number;
                    clarity_politeness_score?: number;
                    clarity_politeness_rationale?: string;
                    relevance_questions_score?: number;
                    relevance_questions_rationale?: string;
                    objection_handling_score?: number;
                    objection_handling_rationale?: string;
                    naturalness_score?: number;
                    naturalness_rationale?: string;
                    lead_intent_score?: number;
                    lead_intent_rationale?: string;
                    sentiment?: 'positive' | 'neutral' | 'negative';
                    sentiment_rationale?: string;
                    failure_risk_score?: number;
                    failure_risk_rationale?: string;
                    negative_call_flag?: boolean;
                    human_review_required?: boolean;
                    review_reason?: string;
                    evaluated_at?: string;
                    overall_evaluation_score?: number;
                };
            };
            prompt_adherence_reviews: {
                Row: {
                    id: string;
                    call_id: string;
                    client_id: string;
                    prompt_adherence_score: number;
                    what_went_well?: string[] | null; // JSONB array of strings
                    what_went_wrong?: string[] | null; // JSONB array of strings
                    recommendations_for_improvement?: string[] | null; // JSONB array of strings
                    critical_failures_summary?: string;
                    reviewed_at?: string;
                };
                Insert: {
                    id?: string;
                    call_id: string;
                    client_id: string;
                    prompt_adherence_score: number;
                    what_went_well?: string[] | null; // JSONB array of strings
                    what_went_wrong?: string[] | null; // JSONB array of strings
                    recommendations_for_improvement?: string[] | null; // JSONB array of strings
                    critical_failures_summary?: string;
                    reviewed_at?: string;
                };
                Update: {
                    id?: string;
                    call_id?: string;
                    client_id?: string;
                    prompt_adherence_score?: number;
                    what_went_well?: string[] | null; // JSONB array of strings
                    what_went_wrong?: string[] | null; // JSONB array of strings
                    recommendations_for_improvement?: string[] | null; // JSONB array of strings
                    critical_failures_summary?: string;
                    reviewed_at?: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    name: string;
                    status: string; // 'active' | 'inactive' | 'trial' | 'churned' | 'pending'
                    type: string;
                    subscription_plan: string; // 'Free Trial' | 'Basic' | 'Pro' | 'Custom'
                    contact_person: string | null;
                    contact_email: string | null;
                    phone_number: string | null;
                    billing_address: string | null;
                    monthly_billing_amount_cad: number;
                    average_monthly_ai_cost_usd: number;
                    average_monthly_misc_cost_usd: number;
                    partner_split_percentage: number;
                    finders_fee_cad: number;
                    slug: string;
                    config_json: any;
                    joined_at: string;
                    last_active_at: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    status?: string; // 'active' | 'inactive' | 'trial' | 'churned' | 'pending'
                    type: string;
                    subscription_plan: string; // 'Free Trial' | 'Basic' | 'Pro' | 'Custom'
                    contact_person?: string | null;
                    contact_email?: string | null;
                    phone_number?: string | null;
                    billing_address?: string | null;
                    monthly_billing_amount_cad: number;
                    average_monthly_ai_cost_usd?: number;
                    average_monthly_misc_cost_usd?: number;
                    partner_split_percentage?: number;
                    finders_fee_cad: number;
                    slug: string;
                    config_json?: any;
                    joined_at?: string;
                    last_active_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    status?: string; // 'active' | 'inactive' | 'trial' | 'churned' | 'pending'
                    type?: string;
                    subscription_plan?: string; // 'Free Trial' | 'Basic' | 'Pro' | 'Custom'
                    contact_person?: string | null;
                    contact_email?: string | null;
                    phone_number?: string | null;
                    billing_address?: string | null;
                    monthly_billing_amount_cad?: number;
                    average_monthly_ai_cost_usd?: number;
                    average_monthly_misc_cost_usd?: number;
                    partner_split_percentage?: number;
                    finders_fee_cad?: number;
                    slug?: string;
                    config_json?: any;
                    joined_at?: string;
                    last_active_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string;
                    role: string; // 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user'
                    client_id: string | null;
                    phone: string | null;
                    last_login_at: string | null;
                    created_at: string;
                    updated_at?: string;
                    preferences: any;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name: string;
                    role: string;
                    client_id?: string | null;
                    phone?: string | null;
                    last_login_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    preferences?: any;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string;
                    role?: string;
                    client_id?: string | null;
                    phone?: string | null;
                    last_login_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    preferences?: any;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}