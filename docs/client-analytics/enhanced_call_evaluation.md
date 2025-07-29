## Key Design Principles:
1. Clear Separation of Concerns

prompt_adherence_reviews = Technical compliance (rule following)
lead_evaluations = Business performance (customer experience, lead quality)
call_telemetry = Pure technical metrics (latency, cost, tokens)
evaluation_summary = Orchestration layer that connects them

2. No Field Duplication

Each table owns its domain completely
Cross-references through relationships, not duplicated fields
Calculated fields (like composite_score) are computed, not stored redundantly

3. Enhanced Intelligence

evaluation_correlations - Analyzes relationships between technical and business performance
improvement_recommendations - AI-generated action items based on patterns
performance_snapshots - Pre-aggregated metrics for fast dashboard queries

Your Processing Pipeline Becomes:
pythonasync def process_completed_call(call_id):
    # 1. Technical telemetry (immediate)
    await extract_and_store_telemetry(call_id)
    
    # 2. Technical compliance (your current DeepSeek process)  
    compliance = await deepseek_compliance_check(call_id)
    await store_prompt_adherence_review(compliance)
    
    # 3. Business evaluation (your current lead evaluation)
    lead_eval = await evaluate_lead_quality(call_id) 
    await store_lead_evaluation(lead_eval)
    
    # 4. Cross-evaluation analysis (new - runs after both complete)
    if both_evaluations_complete(call_id):
        await analyze_correlations(call_id)
        await generate_recommendations(call_id)
        await update_performance_snapshots(call_id)
Dashboard Benefits:

Single Source of Truth - unified_call_analysis view gives you everything
No Duplication - Each metric lives in exactly one place
Rich Insights - Correlations between technical compliance and business outcomes
Actionable - AI-generated recommendations based on patterns
Fast Queries - Pre-aggregated snapshots for dashboard performance

This approach respects your existing tables while adding intelligence layers that reveal the relationships between technical performance and business outcomes.

use table schema from D:\AI\NewApp\supabase\migrations\enhanced_call_telemetry_and_analytics.sql