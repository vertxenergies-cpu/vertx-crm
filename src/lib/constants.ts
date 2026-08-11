import {
  LeadStage,
  ProjectStage,
  ProjectHealth,
  Role,
  RoleDefinition,
  DocumentType,
  LoanStatus,
  KsebStatus,
  InstallationStatus,
  SubsidyStatus,
  DutyType,
} from "@/types";

export const KERALA_DISTRICTS = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad",
] as const;

export const LEAD_SOURCES = [
  "Meta Ads",
  "Instagram",
  "Facebook",
  "Website",
  "Referral",
  "Existing Customer",
  "Electrical Shop",
  "Walk-in",
  "Phone",
  "WhatsApp",
  "Other",
] as const;

export const LEAD_STAGES_CONFIG: {
  id: LeadStage;
  label: string;
  color: string;
  bgColor: string;
  order: number;
}[] = [
  { id: "NEW_LEAD", label: "New Lead", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", order: 1 },
  { id: "CONTACTED", label: "Contacted", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200", order: 2 },
  { id: "QUALIFIED", label: "Qualified", color: "text-cyan-700", bgColor: "bg-cyan-50 border-cyan-200", order: 3 },
  { id: "SITE_SURVEY", label: "Site Survey", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", order: 4 },
  { id: "QUOTATION", label: "Quotation Sent", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", order: 5 },
  { id: "NEGOTIATION", label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200", order: 6 },
  { id: "BOOKED", label: "Booked", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", order: 7 },
  { id: "LOST", label: "Lost", color: "text-slate-600", bgColor: "bg-slate-100 border-slate-300", order: 8 },
];

export const PROJECT_STAGES_CONFIG: {
  id: ProjectStage;
  label: string;
  shortLabel: string;
  stepNumber: number;
  description: string;
}[] = [
  { id: "BOOKING_CONFIRMED", label: "Booking Confirmed", shortLabel: "Booking", stepNumber: 1, description: "Customer advance received & project initiated" },
  { id: "DOCUMENTS", label: "Documentation", shortLabel: "Documents", stepNumber: 2, description: "Collecting KYC, Bill & Property ownership docs" },
  { id: "LOAN", label: "Loan Processing", shortLabel: "Loan", stepNumber: 3, description: "Bank / NBFC loan application & sanction" },
  { id: "KSEB_DOCUMENTATION", label: "KSEB Documentation", shortLabel: "KSEB Docs", stepNumber: 4, description: "Preparing Soura portal feasibility & registration" },
  { id: "KSEB_APPLICATION", label: "KSEB Application", shortLabel: "KSEB App", stepNumber: 5, description: "Application submitted & feasibility approved" },
  { id: "INSTALLATION", label: "Installation & Commissioning", shortLabel: "Installation", stepNumber: 6, description: "Structure, panels, inverter mounting & wiring" },
  { id: "KSEB_INSPECTION", label: "KSEB Electrical Inspection", shortLabel: "Inspection", stepNumber: 7, description: "Section engineer site verification" },
  { id: "NET_METER", label: "Net Meter Energization", shortLabel: "Net Meter", stepNumber: 8, description: "Bi-directional solar net meter installation" },
  { id: "SUBSIDY", label: "PM Surya Ghar Subsidy", shortLabel: "Subsidy", stepNumber: 9, description: "National portal claim submission & credit" },
  { id: "COMPLETED", label: "Project Handover & Completed", shortLabel: "Completed", stepNumber: 10, description: "Commissioning certificate & warranty issued" },
];

export const PROJECT_HEALTH_CONFIG: Record<
  ProjectHealth,
  { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  ON_TRACK: {
    label: "On Track",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  AT_RISK: {
    label: "At Risk",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  DELAYED: {
    label: "Delayed",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    dotColor: "bg-rose-500",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-400",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    dotColor: "bg-teal-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-rose-800",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-300",
    dotColor: "bg-rose-600",
  },
};

export const DUTY_TYPES_CONFIG: Record<
  DutyType,
  { label: string; color: string; bgColor: string }
> = {
  LEAD_FOLLOWUP: { label: "Lead Follow-up", color: "text-blue-700", bgColor: "bg-blue-50" },
  SITE_SURVEY: { label: "Site Survey & Shading", color: "text-purple-700", bgColor: "bg-purple-50" },
  DOCUMENT_COLLECTION: { label: "Document Collection", color: "text-indigo-700", bgColor: "bg-indigo-50" },
  LOAN_FOLLOWUP: { label: "Bank Loan Follow-up", color: "text-amber-700", bgColor: "bg-amber-50" },
  KSEB_PROCESSING: { label: "KSEB Soura Processing", color: "text-orange-700", bgColor: "bg-orange-50" },
  INSTALLATION: { label: "Rigging & Electrical Setup", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  PROJECT_COORDINATION: { label: "Project Coordination", color: "text-cyan-700", bgColor: "bg-cyan-50" },
  CUSTOMER_COMMUNICATION: { label: "Customer Update", color: "text-teal-700", bgColor: "bg-teal-50" },
  OTHER: { label: "General Duty", color: "text-slate-700", bgColor: "bg-slate-50" },
};

// Pure collection tracking checklist (Never UPLOADED)
export const DEFAULT_DOCUMENT_CHECKLIST: {
  documentType: DocumentType;
  title: string;
  isRequired: boolean;
}[] = [
  { documentType: "AADHAAR", title: "Aadhaar Card", isRequired: true },
  { documentType: "PAN", title: "PAN Card", isRequired: true },
  { documentType: "ELECTRICITY_BILL", title: "Latest KSEB Electricity Bill", isRequired: true },
  { documentType: "BANK_PASSBOOK", title: "Bank Passbook", isRequired: true },
  { documentType: "CANCELLED_CHEQUE", title: "Cancelled Cheque", isRequired: true },
  { documentType: "TAX_RECEIPT_PROPERTY", title: "Building Tax Receipt / Ownership Proof", isRequired: true },
  { documentType: "CUSTOMER_PHOTO", title: "Customer Photograph", isRequired: false },
  { documentType: "SITE_PHOTO", title: "Roof & Existing Meter Photos", isRequired: false },
];

export const DEFAULT_INSTALLATION_CHECKLIST = [
  { id: "item-1", title: "Material & Component delivery verified at site", status: "PENDING" },
  { id: "item-2", title: "Installation team assigned & brief reviewed", status: "PENDING" },
  { id: "item-3", title: "Roof structure & mounting points prepared", status: "PENDING" },
  { id: "item-4", title: "Aluminium / GI mounting structure erected & torqued", status: "PENDING" },
  { id: "item-5", title: "Solar PV modules mounted & clamped properly", status: "PENDING" },
  { id: "item-6", title: "On-grid solar inverter mounted in shaded dry location", status: "PENDING" },
  { id: "item-7", title: "DC cabling & MC4 crimping completed with conduit", status: "PENDING" },
  { id: "item-8", title: "AC cabling & breaker/isolator switch box connected", status: "PENDING" },
  { id: "item-9", title: "Dedicated earthing pits (DC, AC, Inverter) installed", status: "PENDING" },
  { id: "item-10", title: "Lightning arrester (LA) installed with separate earthing", status: "PENDING" },
  { id: "item-11", title: "DCDB & ACDB surge protection devices (SPDs) verified", status: "PENDING" },
  { id: "item-12", title: "Voltage, polarity & insulation testing completed", status: "PENDING" },
  { id: "item-13", title: "Inverter trial run & generation testing verified", status: "PENDING" },
  { id: "item-14", title: "Customer handover, safety orientation & photos uploaded", status: "PENDING" },
] as const;

export const ROLES_CONFIG: Record<Role, RoleDefinition> = {
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Administrator",
    description: "Ultimate security authority, global monitoring, audit oversight, employee control, and force logout authority.",
    department: "Executive & Global Security",
    permissions: [
      "lead.view", "lead.create", "lead.edit", "lead.assign",
      "customer.view", "customer.create", "customer.edit",
      "project.view", "project.create", "project.edit", "project.assign", "project.change_stage",
      "documents.view", "documents.change_status",
      "loan.view", "loan.edit",
      "kseb.view", "kseb.edit",
      "installation.view", "installation.edit",
      "subsidy.view", "subsidy.edit",
      "duty.view", "duty.create", "duty.edit", "duty.assign", "duty.complete",
      "task.view", "task.create", "task.edit", "task.assign", "task.complete",
      "followup.view", "followup.create", "followup.edit", "followup.complete",
      "reports.view", "team.view", "team.manage", "settings.view", "settings.manage",
      "audit.view", "user.create", "user.edit", "user.deactivate", "notifications.view"
    ],
  },
  ADMIN: {
    id: "ADMIN",
    name: "System Administrator",
    description: "Full system control, employee management, permission configuration, and complete audit access.",
    department: "Executive & IT",
    permissions: [
      "lead.view", "lead.create", "lead.edit", "lead.assign",
      "customer.view", "customer.create", "customer.edit",
      "project.view", "project.create", "project.edit", "project.assign", "project.change_stage",
      "documents.view", "documents.change_status",
      "loan.view", "loan.edit",
      "kseb.view", "kseb.edit",
      "installation.view", "installation.edit",
      "subsidy.view", "subsidy.edit",
      "duty.view", "duty.create", "duty.edit", "duty.assign", "duty.complete",
      "task.view", "task.create", "task.edit", "task.assign", "task.complete",
      "followup.view", "followup.create", "followup.edit", "followup.complete",
      "reports.view", "team.view", "team.manage", "settings.view", "settings.manage",
      "audit.view", "user.create", "user.edit", "user.deactivate", "notifications.view"
    ],
  },
  MANAGEMENT: {
    id: "MANAGEMENT",
    name: "Executive Management",
    description: "Executive visibility across all leads, projects, finances, team duties, and operational bottlenecks.",
    department: "Management",
    permissions: [
      "lead.view", "customer.view", "project.view", "documents.view",
      "loan.view", "kseb.view", "installation.view", "subsidy.view",
      "duty.view", "duty.create", "duty.assign", "task.view", "followup.view",
      "reports.view", "team.view", "settings.view", "audit.view", "notifications.view"
    ],
  },
  PROJECT_MANAGER: {
    id: "PROJECT_MANAGER",
    name: "Project Manager",
    description: "Orchestrates solar projects from booking to commissioning, assigns duties, and manages deadlines.",
    department: "Operations",
    permissions: [
      "lead.view", "customer.view", "customer.create", "customer.edit",
      "project.view", "project.create", "project.edit", "project.assign", "project.change_stage",
      "documents.view", "documents.change_status",
      "loan.view", "loan.edit", "kseb.view", "kseb.edit",
      "installation.view", "installation.edit", "subsidy.view", "subsidy.edit",
      "duty.view", "duty.create", "duty.edit", "duty.assign", "duty.complete",
      "task.view", "task.create", "task.edit", "task.assign", "task.complete",
      "followup.view", "reports.view", "team.view", "notifications.view"
    ],
  },
  SALES_EXECUTIVE: {
    id: "SALES_EXECUTIVE",
    name: "Sales Executive",
    description: "Lead capture, customer consultations, quotation generation, and booking confirmation.",
    department: "Sales & Marketing",
    permissions: [
      "lead.view", "lead.create", "lead.edit",
      "customer.view", "customer.create", "customer.edit",
      "project.view", "documents.view", "documents.change_status",
      "loan.view", "loan.edit", "duty.view", "duty.complete",
      "task.view", "task.create", "task.complete",
      "followup.view", "followup.create", "followup.edit", "followup.complete",
      "notifications.view"
    ],
  },
  SURVEY_TEAM: {
    id: "SURVEY_TEAM",
    name: "Technical Site Surveyor",
    description: "Site feasibility inspection, roof measurements, structural load verification, and shading analysis.",
    department: "Engineering",
    permissions: [
      "lead.view", "customer.view", "project.view",
      "duty.view", "duty.complete", "task.view", "task.complete",
      "documents.view", "documents.change_status", "notifications.view"
    ],
  },
  DOCUMENTATION_TEAM: {
    id: "DOCUMENTATION_TEAM",
    name: "Documentation Specialist",
    description: "Collects and tracks customer KYC documents, electricity bills, and building tax receipts.",
    department: "Operations",
    permissions: [
      "customer.view", "project.view", "documents.view", "documents.change_status",
      "loan.view", "loan.edit", "duty.view", "duty.complete", "task.view", "task.complete",
      "notifications.view"
    ],
  },
  KSEB_TEAM: {
    id: "KSEB_TEAM",
    name: "KSEB Liaison Coordinator",
    description: "KSEB Soura portal filing, electrical section liaison, inspectorate coordination, and net metering.",
    department: "Liaison & Regulatory",
    permissions: [
      "customer.view", "project.view", "kseb.view", "kseb.edit",
      "documents.view", "documents.change_status", "subsidy.view", "subsidy.edit",
      "duty.view", "duty.complete", "task.view", "task.complete", "notifications.view"
    ],
  },
  INSTALLATION_TEAM: {
    id: "INSTALLATION_TEAM",
    name: "Site Installation Lead",
    description: "Rigging, mounting structures, DC/AC cabling, inverter installation, earthing, and testing.",
    department: "Field Engineering",
    permissions: [
      "customer.view", "project.view", "installation.view", "installation.edit",
      "duty.view", "duty.complete", "task.view", "task.complete", "notifications.view"
    ],
  },
};

export const STANDARD_EMPLOYEE_ROLES: Role[] = [
  "ADMIN",
  "MANAGEMENT",
  "PROJECT_MANAGER",
  "SALES_EXECUTIVE",
  "SURVEY_TEAM",
  "DOCUMENTATION_TEAM",
  "KSEB_TEAM",
  "INSTALLATION_TEAM",
];

export const INITIAL_USERS = [
  {
    id: "usr-super-admin",
    uid: "usr-super-admin",
    employeeCode: "EMP-000",
    name: "Vertx Energies Super Admin",
    email: "vertxenergies@gmail.com",
    phone: "+91 98470 00000",
    role: "SUPER_ADMIN" as Role,
    roleId: "SUPER_ADMIN" as Role,
    superAdmin: true,
    approvalStatus: "APPROVED" as const,
    department: "Executive & Global Security",
    designation: "Chief Information Security Officer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    active: true,
    status: "ACTIVE" as const,
    mustChangePassword: false,
    lastLoginAt: "2026-08-11T09:30:00.000Z",
    lastActiveAt: "2026-08-11T11:00:00.000Z",
  },
];
