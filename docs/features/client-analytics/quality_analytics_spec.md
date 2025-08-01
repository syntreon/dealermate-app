# Quality Analytics Tab Specification

This document outlines the widgets, charts, and data points for the new "Quality Analytics" tab in the analytics section of the application.

---

### **1. Overview and Data Source**

-   **Objective**: To provide users with a clear overview of call quality, agent performance, and sentiment analysis based on automated evaluations.
-   **Primary Data Source**: `public.lead_evaluations` table.
-   **Key Data Points**: All score fields (`overall_evaluation_score`, `clarity_politeness_score`, etc.), `sentiment`, `human_review_required`, `negative_call_flag`, and `evaluated_at`.
-   **Component Location**: `src/components/analytics/QualityAnalytics.tsx`
-   **Page Integration**: A new "Quality" tab will be added to `src/pages/Analytics.tsx`.

### **2. Global Filtering**

The new tab will be integrated with the existing global filters on the `Analytics` page:

-   **Date Range Filter**: Filters all data based on the `evaluated_at` timestamp in the `lead_evaluations` table.
-   **Client Filter**: The existing logic for filtering data based on the user's `client_id` will apply to all queries for this tab.

### **3. Widget Breakdown**

#### **3.1. KPI Cards (Top Row)**

These cards provide an at-a-glance summary of overall quality metrics.

1.  **Overall Quality Score**
    *   **Description**: The average score across all evaluated calls in the selected period.
    *   **Widget Type**: KPI Card.
    *   **Data Point**: `AVG(overall_evaluation_score)` from the `lead_evaluations` table.
    *   **Calculation**: Backend query. Display as a number out of 10 (e.g., `8.5/10`).
    *   **Visual**: Include a trend indicator (e.g., green `TrendingUp` icon) comparing the score to the previous period.

2.  **Sentiment Breakdown**
    *   **Description**: The distribution of call sentiments.
    *   **Widget Type**: KPI Card with a mini-barchart or stacked bar.
    *   **Data Points**: `COUNT(*)` grouped by the `sentiment` column ('positive', 'neutral', 'negative').
    *   **Calculation**: Backend query. Display percentages for each sentiment.
    *   **Visual**: Use distinct colors: green for positive, gray for neutral, and red for negative.

3.  **Calls Flagged for Review**
    *   **Description**: The percentage of calls that require human review.
    *   **Widget Type**: KPI Card.
    *   **Data Point**: `COUNT(*)` where `human_review_required = true`.
    *   **Calculation**: Can be calculated on the frontend: `(Calls for Review / Total Calls) * 100`.
    *   **Visual**: Display the percentage. A high percentage could be styled with a warning color (e.g., amber).

4.  **Negative Call Rate**
    *   **Description**: The percentage of calls flagged as a negative experience.
    *   **Widget Type**: KPI Card.
    *   **Data Point**: `COUNT(*)` where `negative_call_flag = true`.
    *   **Calculation**: Can be calculated on the frontend: `(Negative Calls / Total Calls) * 100`.
    *   **Visual**: Display the percentage. Use a red color and a `TrendingDown` icon if the rate is increasing.

#### **3.2. Chart Widgets (Main Section)**

This section will feature a grid of charts for deeper analysis.

1.  **Quality Score Trends Over Time**
    *   **Chart Type**: **Line Chart**.
    *   **Description**: Tracks the average quality scores over the selected date range.
    *   **Data to Pull**: `AVG(overall_evaluation_score)`, `AVG(clarity_politeness_score)`, `AVG(naturalness_score)` grouped by day/week/month (depending on the date range).
    *   **X-Axis**: Time (`evaluated_at` date).
    *   **Y-Axis**: Average Score (0-10).
    *   **Interaction**: Allow toggling different score trend lines (e.g., Overall, Clarity, Naturalness) on or off via a legend.

2.  **Evaluation Score Distribution**
    *   **Chart Type**: **Bar Chart**.
    *   **Description**: Shows the average score for each quality category, helping to identify systemic strengths and weaknesses.
    *   **Data to Pull**: `AVG()` for each score column (`clarity_politeness_score`, `relevance_questions_score`, `objection_handling_score`, etc.).
    *   **X-Axis**: Score Category (e.g., "Clarity & Politeness", "Objection Handling").
    *   **Y-Axis**: Average Score (0-10).
    *   **Visual**: Each bar can be a different color for easy differentiation.

3.  **Sentiment Distribution**
    *   **Chart Type**: **Donut (Pie) Chart**.
    *   **Description**: A visual breakdown of call sentiments.
    *   **Data to Pull**: `COUNT(*)` grouped by `sentiment`.
    *   **Chart Slices**: 'Positive', 'Neutral', 'Negative'.
    *   **Data Display**: Show both the count and percentage for each slice on hover or as a label.
    *   **Visual**: Use the same green/gray/red color scheme as the corresponding KPI card.

4.  **Reasons for Human Review**
    *   **Chart Type**: **Horizontal Bar Chart**.
    *   **Description**: Shows the most common reasons why calls are flagged for review, providing actionable insights into common failure points.
    *   **Data to Pull**: `COUNT(*)` grouped by `review_reason`.
    *   **Y-Axis**: Reason (`review_reason` text).
    *   **X-Axis**: Number of Calls.
    *   **Note**: This chart is crucial for identifying patterns in agent failures or complex scenarios that need attention.
