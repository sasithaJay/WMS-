import type { StatusType } from "../types";

export const MOCK_REQUESTS = [
  { id: "REQ-2024-001", item: "A4 Paper (500 sheets)", date: "2024-06-10", status: "pending" as StatusType, qty: 5 },
  { id: "REQ-2024-002", item: "Correction Fluid", date: "2024-05-28", status: "approved" as StatusType, qty: 12 },
  { id: "REQ-2024-003", item: "Ballpoint Pens (Box)", date: "2024-05-15", status: "issued" as StatusType, qty: 2 },
  { id: "REQ-2024-004", item: "Stapler", date: "2024-04-30", status: "rejected" as StatusType, qty: 1 },
];

export const LOW_STOCK = [
  { name: "A4 Paper 80gsm", code: "STK-001", division: "SS", qty: 12, reorder: 50, critical: true },
  { name: "Correction Fluid", code: "STK-008", division: "PC", qty: 3, reorder: 20, critical: true },
  { name: "Stapler Pins", code: "STK-015", division: "SS", qty: 45, reorder: 100, critical: true },
  { name: "Ball Point Pens", code: "STK-022", division: "PC", qty: 80, reorder: 60, critical: false },
  { name: "Files (Long)", code: "STK-031", division: "SS", qty: 120, reorder: 50, critical: false },
];

export const STOCK_CHART = [
  { month: "Jan", received: 45, issued: 32 },
  { month: "Feb", received: 38, issued: 28 },
  { month: "Mar", received: 52, issued: 44 },
  { month: "Apr", received: 41, issued: 35 },
  { month: "May", received: 60, issued: 48 },
  { month: "Jun", received: 33, issued: 22 },
];

export const RECENT_MOVEMENTS = [
  { item: "A4 Paper 80gsm", qty: "+200 reams", type: "in" as const, date: "Jun 12", by: "Supplier GN" },
  { item: "Correction Fluid", qty: "-5 units", type: "out" as const, date: "Jun 12", by: "P.K. Jayasena" },
  { item: "Stapler Pins", qty: "+500 boxes", type: "in" as const, date: "Jun 11", by: "DSS Stores" },
  { item: "Ball Point Pens", qty: "-20 boxes", type: "out" as const, date: "Jun 10", by: "Galle DS Office" },
  { item: "File Covers", qty: "-50 units", type: "out" as const, date: "Jun 09", by: "D.M. Perera" },
];

export const INVENTORY_ITEMS = [
  { code: "STK-001", name: "A4 Paper 80gsm", category: "Stationery", unit: "Ream", qty: 12, reorder: 50, division: "SS" },
  { code: "STK-008", name: "Correction Fluid", category: "Stationery", unit: "Bottle", qty: 3, reorder: 20, division: "PC" },
  { code: "STK-015", name: "Stapler Pins", category: "Stationery", unit: "Box", qty: 45, reorder: 100, division: "SS" },
  { code: "STK-022", name: "Ball Point Pens", category: "Stationery", unit: "Box", qty: 80, reorder: 60, division: "PC" },
  { code: "STK-031", name: "File Covers (Long)", category: "Filing", unit: "Piece", qty: 120, reorder: 50, division: "SS" },
  { code: "STK-044", name: "Printer Toner HP", category: "Equipment", unit: "Cartridge", qty: 6, reorder: 4, division: "PC" },
  { code: "STK-052", name: "Whiteboard Markers", category: "Stationery", unit: "Set", qty: 18, reorder: 10, division: "SS" },
  { code: "STK-067", name: "Bed Sheets (Single)", category: "Bedding", unit: "Piece", qty: 34, reorder: 40, division: "PC" },
  { code: "STK-075", name: "Detergent (5kg)", category: "Cleaning", unit: "Pack", qty: 9, reorder: 15, division: "PC" },
  { code: "STK-083", name: "Plastic Chairs", category: "Furniture", unit: "Unit", qty: 22, reorder: 10, division: "SS" },
];

export const GRN_DATA = [
  { grn: "GRN-2024-018", date: "2024-06-12", supplier: "Lanka Stationery Co.", item: "A4 Paper 80gsm", qty: 200, unit: "Ream", division: "SS" },
  { grn: "GRN-2024-017", date: "2024-06-11", supplier: "Office Needs Ltd.", item: "Stapler Pins", qty: 500, unit: "Box", division: "SS" },
  { grn: "GRN-2024-016", date: "2024-06-09", supplier: "PC Supplies (Pvt) Ltd.", item: "Bed Sheets (Single)", qty: 40, unit: "Piece", division: "PC" },
  { grn: "GRN-2024-015", date: "2024-06-07", supplier: "Clean Pro Distributors", item: "Detergent (5kg)", qty: 20, unit: "Pack", division: "PC" },
  { grn: "GRN-2024-014", date: "2024-06-04", supplier: "Lanka Stationery Co.", item: "Ball Point Pens", qty: 100, unit: "Box", division: "SS" },
  { grn: "GRN-2024-013", date: "2024-06-02", supplier: "Tech Solutions (Pvt) Ltd.", item: "Printer Toner HP", qty: 8, unit: "Cartridge", division: "PC" },
];

export const RECOMMEND_QUEUE = [
  { ref: "REQ-2024-045", requester: "P.K. Jayasena", section: "Development", date: "2024-06-12", items: ["Printer Toner ×1", "A4 Paper ×5"], division: "SS" },
  { ref: "REQ-2024-046", requester: "Matara DS Office", section: "DS Office", date: "2024-06-11", items: ["A4 Paper ×10 Reams", "Correction Fluid ×6"], division: "PC" },
  { ref: "REQ-2024-047", requester: "D.M. Perera", section: "Institutional", date: "2024-06-10", items: ["File Covers ×50"], division: "SS" },
  { ref: "REQ-2024-048", requester: "Karandeniya Children's Home", section: "Institution", date: "2024-06-09", items: ["Bed Sheets ×20", "Detergent ×4"], division: "PC" },
];

export const APPROVE_QUEUE = [
  { ref: "REQ-2024-033", requester: "K.L. Bandara", section: "Accounts", date: "2024-06-11", division: "SS", items: [{ name: "Printer Toner", requested: 2, unit: "Cartridge" }, { name: "A4 Paper", requested: 8, unit: "Ream" }] },
  { ref: "REQ-2024-034", requester: "Karandeniya Children's Home", section: "Institution", date: "2024-06-10", division: "PC", items: [{ name: "Bed Sheets", requested: 20, unit: "Piece" }, { name: "Detergent (5kg)", requested: 4, unit: "Pack" }] },
  { ref: "REQ-2024-035", requester: "Galle DS Office", section: "DS Office", date: "2024-06-09", division: "SS", items: [{ name: "Ball Point Pens", requested: 5, unit: "Box" }] },
];

export const ISSUE_QUEUE = [
  { ref: "REQ-2024-019", requester: "D.M. Perera", role: "Social Service Officer", approvalDate: "2024-06-10", division: "SS", items: ["Ball Point Pens ×2", "File Covers ×10"] },
  { ref: "REQ-2024-021", requester: "Karandeniya Children's Home", role: "Institution", approvalDate: "2024-06-09", division: "PC", items: ["Bed Sheets ×15", "Detergent ×3"] },
  { ref: "REQ-2024-023", requester: "Matara DS Office", role: "DS Office", approvalDate: "2024-06-08", division: "PC", items: ["A4 Paper ×8 Reams"] },
];

export const PENDING_USERS = [
  { name: "K.L. Bandara", role: "Development Officer", username: "kl.bandara", division: "SS", type: "staff" as const },
  { name: "Matara DS Office", role: "DS Office", username: "matara.dso", division: "SS", type: "ds" as const },
  { name: "Vijitha Kumari", role: "Probation Officer", username: "v.kumari", division: "PC", type: "staff" as const },
  { name: "Hambantota Children's Home", role: "Institution", username: "hbt.childhome", division: "PC", type: "institution" as const },
];

export const ACTIVE_USERS = [
  { name: "Nimal Perera", role: "Development Officer", division: "SS", section: "Development", status: "active" as const },
  { name: "P.K. Jayasena", role: "Social Service Officer", division: "SS", section: "Institutional", status: "active" as const },
  { name: "D.M. Perera", role: "Probation Officer", division: "PC", section: "Probation", status: "active" as const },
  { name: "Karandeniya Children's Home", role: "Institution", division: "PC", section: "—", status: "active" as const },
  { name: "Galle DS Office", role: "DS Office", division: "SS", section: "—", status: "inactive" as const },
  { name: "Ranjith Fernando", role: "Store Keeper", division: "SS", section: "Accounts", status: "active" as const },
];

export const ALL_REQUESTS = [
  { id: "REQ-2024-038", ref: "REQ-2024-038", date: "2024-06-10", section: "Development", items: ["A4 Paper ×5", "Stapler Pins ×2"], status: "pending" as StatusType },
  { id: "REQ-2024-027", ref: "REQ-2024-027", date: "2024-05-28", section: "Development", items: ["Correction Fluid ×12"], status: "approved" as StatusType },
  { id: "REQ-2024-019", ref: "REQ-2024-019", date: "2024-05-15", section: "Development", items: ["Ball Point Pens ×2"], status: "issued" as StatusType },
  { id: "REQ-2024-011", ref: "REQ-2024-011", date: "2024-04-30", section: "Development", items: ["Stapler"], status: "rejected" as StatusType },
  { id: "REQ-2024-004", ref: "REQ-2024-004", date: "2024-03-22", section: "Development", items: ["File Covers ×10", "Whiteboard Markers ×1"], status: "issued" as StatusType },
];
