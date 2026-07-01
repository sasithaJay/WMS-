Design a complete, multi-screen web application for a government 
Warehouse Management System (Department of Social Services, Probation 
& Child Care Service). Light theme, primary color #4295D9, clean 
professional government style. Bilingual: every screen must support 
English and Sinhala (සිංහල) via a language toggle in the top-right 
corner (pill-shaped two-button switch, "EN" / "සිං").

============================================================
GLOBAL STYLE
============================================================
- Primary color: #4295D9 (use for primary buttons, active states, 
  links, selected items, icons)
- Background: white / very light gray (#F8FAFC)
- Cards: white background, subtle border (#E2E8F0), rounded corners 
  (12px), minimal shadow
- Sidebar navigation: white background, items highlighted with 
  #4295D9 tint when active
- Typography: clean sans-serif, dark slate text on light backgrounds
- Status colors: amber/orange for pending, green for approved/active, 
  red for rejected, blue (#4295D9) for informational
- Mobile-responsive — sidebar collapses to icon-only or hamburger menu 
  on small screens
- All forms must show both English and Sinhala labels when language 
  is toggled, including dropdown option text

============================================================
SCREEN 1 — LOGIN PAGE
============================================================
Split-screen layout:
- Left half (60%): gradient blue panel (#4295D9 to darker blue) with 
  department name "Department of Social Services" and "Probation & 
  Child Care Services" in large white text, plus "Digital Warehouse 
  Management System" tagline
- Right half (40%): white card with logo, "Warehouse Management 
  System" title (English + Sinhala subtitle), language toggle top 
  right, Username field, Password field (with show/hide eye icon), 
  Remember me checkbox, primary "Sign In" button, "Forgot Password?" 
  link, and "Don't have an account? Register" link at the bottom

============================================================
SCREEN 2 — REGISTRATION FORM (4-step wizard)
============================================================
Centered white card, max width 580px, with a 4-dot progress indicator 
at top (done/active/idle states).

STEP 1 — Division selection:
Two selectable cards: "Social Services Division" and "Probation & 
Child Care Division". Selecting one shows an info note about which 
store the user will access.

STEP 2 — Account type selection:
Three selectable cards (not two — include the new "Divisional 
Secretary Office" type):
  1. "Staff Member" (department officer/employee)
  2. "Institution" (children's home, remand home — note: 17 under 
     Probation & Child Care, 2 under Social Services)
  3. "Divisional Secretary Office" (one of 50 DS offices, recommended 
     by AO, approved by a higher officer)
Each card shows an icon, title, and short description. Selecting one 
shows a context note explaining that institution and DS office 
requests are recommended by the AO specifically (not a section head).

STEP 3 — Dynamic detail form (three variants depending on Step 2):
  Staff variant: Full name, NIC, email, phone, then Section dropdown 
  (Institutional/Development/Accounts for Social Services; 
  Institutional/Development/Probation for Probation & Child Care), 
  Job role dropdown (include Commissioner, Assistant Commissioner, 
  Assistant Director, Administrative Officer, Accountant, Section 
  Head — Chief Clerk/Financial Assistant, Development Officer, 
  Social Service Officer, Probation Officer, Store Keeper), District 
  dropdown (Galle/Matara/Hambantota for district-based officers), 
  Employee ID.
  
  Institution variant: Institution name, institution type dropdown, 
  licence number, address, district, institution contact, then a 
  separate "Authorised contact person" section (name, designation, 
  NIC, phone, email).
  
  DS Office variant: DS office name/division dropdown, district, 
  office address, office contact number, then authorised contact 
  person section (same fields as institution).

STEP 4 — Credentials:
Username, password, confirm password fields, with a note: "Your 
account will be inactive until verified and activated by the 
Commissioner."

============================================================
SCREEN 3 — DASHBOARD (role-aware, design 3 dashboard variants)
============================================================
Shared layout: left sidebar (logo, nav items, user profile at bottom), 
top bar (page title, language toggle), main content area with welcome 
banner (gradient #4295D9 card showing user name and role), stat cards 
row, then two-column content (recent requests list + low-stock items 
list).

Variant A — Requester dashboard (Development Officer / DS Office / 
Institution / CC/FA):
Stat cards: "My Requests This Month" (0 or 1, since only one request/
month allowed), "Pending", "Approved", "Issued". 
Sidebar nav: Dashboard, My Requests, New Request.

Variant B — Recommender/Approver dashboard (Section Head, AO, 
Commissioner, Assistant Commissioner, Assistant Director, Accountant, 
Deputy Commissioner):
Stat cards: "Pending Recommendation" (if section head/AO), "Pending 
Approval" (if approver), "Total Items", "Low Stock Items". Include a 
note distinguishing "CC/FA section requests" (common supplies for 
their section's staff, tracked separately from personal requests) 
from individual officer requests — show as two separate tabs or 
filters in "My Requests": "Personal" vs "Section Requests".
Sidebar nav: Dashboard, My Requests, Recommend (badge with count), 
Approve (badge with count, only for approver roles), Reports.

Variant C — Store Keeper dashboard:
Stat cards: "Items to Issue", "Low Stock Alerts", "This Month 
Receipts", "Total SKUs".
Sidebar nav: Dashboard, Issue Goods, Inventory, Stock Receipts, 
Reports.

============================================================
SCREEN 3B — OPERATIONAL SUMMARY DASHBOARD
============================================================
Visible to: Commissioner, Assistant Commissioner, Assistant Director, 
AO, Accountant, Section Heads (CC/FA), Store Keeper.

This is a second tab/view accessible from the main dashboard 
(e.g. a "Summary" or "Overview" toggle next to "My Requests"), 
giving these roles a consolidated operational picture beyond their 
personal request queue.

Layout — below the existing welcome banner:

Row 1 — four metric cards (light gray background, no border):
  - "Total Stock Value" (or "Total Items" if value tracking isn't 
    needed) — large number, subtitle "Both stores combined" 
    (Commissioner/AC/AD/Accountant see both; Store Keeper and 
    section-level roles see their own division's figure only)
  - "Reorder Alerts" — count in red/amber, subtitle "Items at or 
    below threshold"
  - "Pending in Pipeline" — combined count of items awaiting 
    recommendation + approval relevant to their role
  - "Issued This Month" — count of fulfilled requests

Row 2 — "Reorder Level Alerts" card (white card, bordered):
  A list of items currently at or below reorder level. Each row 
  shows: item name, item code, division tag, and a quantity badge 
  (red/amber background showing "current qty / reorder level"). 
  Include a few rows showing healthy stock (green badge) for 
  contrast so the list isn't all alarming. Sort by most critical 
  first. Include a "View full inventory" link at the bottom.

Row 3 — "Stock Summary by Division" card:
  Two side-by-side sub-cards (Social Services store / Probation & 
  Child Care store), each showing: a horizontal progress/utilization 
  bar, total item count, and "X items below reorder level". 
  Commissioner sees both; division-restricted roles (Assistant 
  Director for Social Services, Assistant Commissioner for Probation 
  & Child Care, Store Keeper) see only their own division's card 
  full-width instead of two side by side.

Row 4 — "Request Pipeline This Month" card:
  Two sub-cards: "Awaiting Recommendation" and "Awaiting Approval", 
  each showing a count. For Section Heads (CC/FA), this should also 
  break out their own section's pending recommendations specifically. 
  For Accountant/AO/AD, show counts filtered to requests they're 
  eligible to approve.

Optional row 5 — "Recent Stock Movements" (for Store Keeper and 
Commissioner specifically): a compact timeline/list of the last 5-8 
transactions (receipt or issue), each showing item, quantity, type 
icon (in/out arrow), and date.

Role-based filtering notes:
  - Commissioner: sees everything, both divisions, all pipeline stages
  - Assistant Commissioner: Probation & Child Care division only
  - Assistant Director: Social Services division only
  - Accountant: their division's accounts-related requests + 
    division stock summary
  - AO (Administrative Officer): their division's stock + pipeline, 
    plus DS office/institution requests they recommend
  - Section Heads (CC/FA): their own section's pending recommendations 
    + their division's stock summary (read-only, no edit access)
  - Store Keeper: full inventory detail for their division's store, 
    reorder alerts, and recent stock movements

All numbers and labels must support the English/Sinhala toggle 
consistent with the rest of the application.
