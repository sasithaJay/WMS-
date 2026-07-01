The LoginPage and RegisterPage designs are already completed and approved.

Do NOT recreate, redesign, restyle, or modify the LoginPage or RegisterPage.
Keep the current blue/white government warehouse design exactly as it is.

Now refactor and extend the project into a proper component-based React + TypeScript structure.

Main goal:
Only add role-based dashboards and reorganize the dashboard-related code into clean reusable components.
Do not break the existing login/register pages.

Use this folder structure:

src/
  app/
    App.tsx

    pages/
      LoginPage.tsx
      RegisterPage.tsx
      dashboards/
        CommissionerDashboard.tsx
        AssistantCommissionerDashboard.tsx
        AssistantDirectorDashboard.tsx
        AccountantDashboard.tsx
        AdministrativeOfficerDashboard.tsx
        SectionHeadDashboard.tsx
        StoreKeeperDashboard.tsx
        DevelopmentOfficerDashboard.tsx
        OfficerDashboard.tsx
        InstitutionDashboard.tsx
        DivisionalSecretariatDashboard.tsx

    components/
      common/
        LanguageToggle.tsx
        StatusBadge.tsx
        StatCard.tsx
        QuickActionCard.tsx
        PageHeader.tsx
        SectionCard.tsx
        EmptyState.tsx

      layout/
        DashboardLayout.tsx
        Sidebar.tsx
        Topbar.tsx

      dashboard/
        DashboardOverview.tsx
        RecentActivityTable.tsx
        PendingRequestTable.tsx
        DashboardChart.tsx

      requests/
        RequestForm.tsx
        MyRequestsTable.tsx
        RecommendationQueue.tsx
        ApprovalQueue.tsx
        RequestDetailsModal.tsx
        MonthlyRequestStatus.tsx

      inventory/
        InventorySummary.tsx
        ItemRegistrationForm.tsx
        StockReceivingForm.tsx
        StockIssueForm.tsx
        StockBalanceTable.tsx
        StockMovementTable.tsx
        ReorderLevelTable.tsx
        BarcodeScannerPanel.tsx

      reports/
        ReportsPanel.tsx
        MonthlyReportTable.tsx
        AnnualReportTable.tsx

      users/
        UserVerificationTable.tsx
        UserManagementTable.tsx

    constants/
      roles.ts
      permissions.ts
      menuItems.ts
      mockData.ts
      translations.ts

    hooks/
      useAuth.ts
      useRoleRedirect.ts
      usePermissions.ts
      useLanguage.ts

    types/
      index.ts

    utils/
      formatters.ts
      roleHelpers.ts


Component rules:
1. App.tsx must stay small.
2. App.tsx should only handle main screen state, login/register routing, and role dashboard routing.
3. Do not keep all code inside App.tsx.
4. Move repeated UI into reusable components.
5. Move all TypeScript types into types/index.ts.
6. Move role names into constants/roles.ts.
7. Move permission rules into constants/permissions.ts.
8. Move sidebar/dashboard menu data into constants/menuItems.ts.
9. Move mock dashboard data into constants/mockData.ts.
10. Move Sinhala/English text into constants/translations.ts.
11. Move language logic into useLanguage.ts.
12. Move role permission checking into usePermissions.ts.
13. Keep each component focused on one responsibility.
14. Use named exports where suitable.
15. Do not add new libraries.
16. Fix all imports after restructuring.
17. Avoid duplicate code between dashboards.

Dashboard requirements:
Create separate dashboards for each user role:

1. CommissionerDashboard
- Access both Social Services and Probation & Child Care stores.
- View both division stock summaries.
- Approve high-level requests.
- Verify newly registered accounts.
- View all reports.
- Request goods without approval.

2. AssistantCommissionerDashboard
- Probation and Child Care Division dashboard.
- View relevant approval queue.
- View division reports.
- Request goods with Commissioner approval.

3. AssistantDirectorDashboard
- Social Services Division dashboard.
- View relevant approval queue.
- View Social Services reports.
- Request goods with Commissioner approval.

4. AccountantDashboard
- View relevant approval queue.
- View reports.
- Request goods with Commissioner approval.

5. AdministrativeOfficerDashboard
- Recommend institution and divisional secretariat requests.
- View assigned division request records.
- Request goods with Commissioner approval.

6. SectionHeadDashboard
- Recommend requests from officers in their section.
- Create common section requests.
- Keep common section requests separate from personal request records.

7. StoreKeeperDashboard
- Register items.
- Receive stock from suppliers.
- Issue approved goods.
- Barcode/item lookup.
- Monitor stock balance.
- Manage reorder levels.
- View stock movement history.
- Cannot approve requests.

8. DevelopmentOfficerDashboard
- Submit monthly request.
- View recommendation status.
- View own request history.

9. OfficerDashboard
- Submit monthly request.
- View own request history.
- Only request from assigned division store.

10. InstitutionDashboard
- Submit institution requests.
- Request must go to Administrative Officer recommendation.
- View own request history.

11. DivisionalSecretariatDashboard
- Submit office requests.
- Request must go to Administrative Officer recommendation.
- View own request history.

Role routing:
After login, redirect users based on role:

COMMISSIONER -> CommissionerDashboard
ASSISTANT_COMMISSIONER -> AssistantCommissionerDashboard
ASSISTANT_DIRECTOR -> AssistantDirectorDashboard
ACCOUNTANT -> AccountantDashboard
ADMINISTRATIVE_OFFICER -> AdministrativeOfficerDashboard
SECTION_HEAD -> SectionHeadDashboard
STORE_KEEPER -> StoreKeeperDashboard
DEVELOPMENT_OFFICER -> DevelopmentOfficerDashboard
OFFICER -> OfficerDashboard
INSTITUTION -> InstitutionDashboard
DIVISIONAL_SECRETARIAT -> DivisionalSecretariatDashboard

UI rules:
- Keep the existing login/register design unchanged.
- Use the same blue/white government-style theme for dashboards.
- Use clean rounded cards, soft shadows, professional spacing, and mobile-friendly layout.
- Keep Sinhala/English language toggle.
- Do not remove icons, charts, cards, tables, or existing UI features.
- Do not redesign the approved authentication pages.
- Only create dashboard pages and reusable component structure.

Final output:
After making changes, show:
1. final folder structure
2. files added
3. files modified
4. updated App.tsx
5. role routing logic
6. permissions.ts
7. menuItems.ts
8. one example dashboard file