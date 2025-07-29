# 🛠️ Admin Panel Restructure Plan (2025-07)

> **Note:** This section documents the plan to centralize all admin analytics and metrics in the Admin Dashboard. The client-facing analytics page is unchanged and not affected by this restructure.

## Goal
- Consolidate all admin-only analytics, system, user, and platform metrics into the Admin Dashboard and its tabs.
- Remove or refactor redundant/legacy admin analytics pages/components.
- No changes to the main analytics page used by clients.

## Current Admin Dashboard Structure
- **Widgets:** FinancialOverview, BusinessMetrics, ClientStatusOverview, TopPerformingClients, RevenueMetricsWidget, RecentActivityFeed, SystemHealthWidget, DashboardHeader
- **Tabs:** FinancialTab, ClientsTab, UsersTab, SystemTab, OperationsTab
- **Other analytics components:** CallVolumeChart, ClientPerformanceChart, ConversionFunnelChart, GeographicDistribution, PerformanceMetricsTable, RevenueAnalyticsChart, UserActivityChart

## Minimal Ownership Table
| Metric/Widget                | Component (File)                   | Centralized in Dashboard? | Notes                        |
|------------------------------|------------------------------------|---------------------------|------------------------------|
| Monthly Revenue              | FinancialOverview.tsx              | Yes                       | Admin only                   |
| Net Profit                   | FinancialOverview.tsx              | Yes                       | Admin only                   |
| Client Status Distribution   | ClientStatusOverview.tsx           | Yes                       | Admin only                   |
| Top Clients                  | TopPerformingClients.tsx           | Yes                       | Admin only                   |
| Revenue Breakdown            | RevenueMetricsWidget.tsx           | Yes                       | Admin only                   |
| System Health                | SystemHealthWidget.tsx             | Yes                       | Admin only                   |
| User Analytics               | UsersTab.tsx                       | Yes                       | Admin only                   |
| Make.com Operations          | OperationsTab.tsx                  | Yes                       | Admin only                   |
| Call Volume/Conversion       | CallVolumeChart.tsx                | Move to dashboard         | Legacy in analytics          |
| Conversion Funnel            | ConversionFunnelChart.tsx          | Move to dashboard         | Partial mock data            |
| Client Performance           | ClientPerformanceChart.tsx         | Move to dashboard         | Legacy in analytics          |
| ...                          | ...                                | ...                       | ...                          |

## Actions
- Centralize all admin analytics in the dashboard and its tabs.
- Mark `/admin/analytics/*` components as legacy/deprecated for admin use.
- Do **not** change the main analytics page or any client-facing analytics.
- Document component ownership and status for future maintainers.

---

# Admin Dashboard Analytics Restructure

## Admin Dashboard
AdminDashboard.tsx

### KPI Cards
- Monthly revenue <!-- Implemented: FinancialOverview.tsx, real data -->
- Total Costs <!-- Implemented: FinancialOverview.tsx, real data -->
- Net Profit <!-- Implemented: FinancialOverview.tsx, real data -->
- Profit Margin <!-- Implemented: FinancialOverview.tsx, real data -->
- Active Clients <!-- Implemented: BusinessMetrics.tsx, real data -->
- Active Users Today <!-- Implemented: BusinessMetrics.tsx, real data -->
- API Utilization (mock) <!-- Implemented: BusinessMetrics.tsx, mock data -->
- System Health (mock) <!-- Implemented: BusinessMetrics.tsx, mock data -->

### Tabs
#### Financial Tab
- Cost Breakdown <!-- Implemented: FinancialTab.tsx, real data -->
- Profitability Analysis <!-- Implemented: FinancialTab.tsx, real data -->
- Client Profitability Ranking <!-- Implemented: FinancialTab.tsx, real data -->

#### Client Analytics Tab
* What we have now
    - Client Status Distribution <!-- Implemented: ClientsTab.tsx, real data -->
    - Subscription Plans <!-- Implemented: ClientsTab.tsx, real data -->
    - Recent Client Activity <!-- Implemented: RecentActivityFeed.tsx, real data -->
* What we need? 
    - Client Acquisition Sources <!-- Not implemented -->
    - Client Retention Analysis <!-- Not implemented -->
    - Client Satisfaction Surveys <!-- Not implemented -->

#### User Analytics Tab
* What we have now
    - User Distribution by Role: Breakdown of users by role and permissions <!-- Implemented: UsersTab.tsx, real data -->
    - User Activity Metrics: Login frequency and engagement statistics <!-- Implemented: UsersTab.tsx, real data -->
    - Recent User Activity: Users who joined in the last 30 days <!-- Implemented: UsersTab.tsx, real data -->
* What we need?
    - (TBD)

#### System Health Tab
- System Resources: CPU, memory, storage usage and API performance (mock data) <!-- Implemented: SystemTab.tsx, mock data -->
- Agent Status & Messaging: Set system-wide or client-specific agent status and broadcast messages <!-- Implemented: SystemTab.tsx, real data -->
- Service Health Status: Status of critical infrastructure services (Vercel, Database, Make.com, Supabase, n8n, storage - all using mock data) <!-- Implemented: SystemTab.tsx, mock data -->

#### Operations Tab
Make.com operations
- Call Analytics
    - KPI Cards
        - Total Operations (Calls) <!-- Implemented: OperationsTab.tsx, real data -->
        - Total Cost (Calls) <!-- Implemented: OperationsTab.tsx, real data -->
        - Avg. Operations Per Call <!-- Implemented: OperationsTab.tsx, real data -->
    - Call Operations Over Time: Daily Make.com operations from call data and associated costs (line chart) <!-- Implemented: OperationsTab.tsx, real data -->
    - Top 10 Clients by Operations: Clients with the highest Make.com operations usage from calls <!-- Implemented: OperationsTab.tsx, real data -->
    - Top 10 Calls by Operations: Individual calls that consumed the most Make.com operations (maybe not needed) <!-- Not implemented -->
- Scenario Tracking
    - DB created but no ops or connection to make.com <!-- Partial: DB exists, no ops/connection -->

---

## Admin Analytics 

Main KPI Cards
- Total Clients <!-- Implemented: AdminAnalytics, real data -->
- Total Calls <!-- Implemented: AdminAnalytics, real data -->
- Total Leads <!-- Implemented: AdminAnalytics, real data -->
- Total Revenue <!-- Implemented: AdminAnalytics, real data -->

### Tabs
#### Overview
- Call Volume & Conversion: Daily call volume and lead conversion trends <!-- Implemented: AdminAnalytics, real data -->
- Conversion Funnel: Call to lead conversion breakdown (some mock data) <!-- Implemented: AdminAnalytics, partial mock data -->
- Key Performance Indicators: Critical metrics at a glance <!-- Implemented: AdminAnalytics, real data -->
- Geographic Distribution: Client distribution by location (mock data) <!-- Implemented: AdminAnalytics, mock data -->

#### Client
- Client Performance: Call volume by top performing clients <!-- Implemented: TopPerformingClients.tsx, real data -->
- Client Status Distribution: Breakdown of client statuses <!-- Implemented: ClientStatusOverview.tsx, real data -->
- Performance Metrics: Detailed client performance breakdown  <!-- Implemented: AdminAnalytics, real data -->

#### Revenue
- Revenue Analytics: Daily revenue trends over time (not sure if needed) <!-- Implemented: RevenueMetricsWidget.tsx, real data -->
- Revenue Breakdown: Revenue distribution by subscription plan <!-- Implemented: RevenueMetricsWidget.tsx, real data -->
- Top Revenue Clients: Highest contributing clients <!-- Implemented: RevenueMetricsWidget.tsx, real data -->

#### Performance
- Performance Metrics: Detailed client performance breakdown <!-- Implemented: AdminAnalytics, real data -->

#### Users
- User Activity bar chart - not needed <!-- Not implemented -->

---

## Main Dashboard
dashboard.tsx  
This also provides data for admin view as we apply all client filters which shows most of the data <!-- Implemented: dashboard.tsx, real data -->

---

## Main Analytics
analytics.tsx  
This also provides data for admin view as we apply all client filters which shows most of the data <!-- Implemented: analytics.tsx, real data -->

### Tabs (from Analytics.tsx)
- **Call Analytics** (`CallAnalytics` component)
    - Detailed call analytics, filterable by date range and (for admins) client <!-- Implemented: CallAnalytics.tsx, real data -->
- **Quality Analytics** (`QualityAnalytics` component)
    - Lead/call quality metrics, filterable by date/client <!-- Implemented: QualityAnalytics.tsx, real data -->
- **AI Accuracy** (`SimpleAIAnalytics` component, admin-only)
    - AI technical performance, filterable by date/client <!-- Implemented: SimpleAIAnalytics.tsx, real data, admin only -->
- *(Leads Analytics is present in code but currently hidden/commented out)* <!-- Not shown -->

#### Filters
- Date Range (all users) <!-- Implemented: analytics.tsx -->
- Client Selector (admin only) <!-- Implemented: analytics.tsx -->

#### Notes
- All tabs use real data where possible; some legacy or mock components should be replaced as service integration improves.
- Admins can view all clients, regular users only see their own data.
- Tabs and filters are mobile-optimized.

---

## TODOs / Open Questions

- Remove or refactor any remaining mock-data-only charts/components. <!-- Ongoing -->
- Decide if "AdminAnalytics" should be merged into the main dashboard or kept as a separate reporting page. <!-- Ongoing -->
- Add missing analytics (e.g., client acquisition/retention, satisfaction) as real data becomes available. <!-- Not implemented -->
- Document which components are production-ready vs. still using mock data. <!-- See above comments for current state -->

