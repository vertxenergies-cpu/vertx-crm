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
  ProjectDeletionReason,
  Project,
  StageState,
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

export const CANONICAL_PROJECT_STAGES: ProjectStage[] = [
  "BOOKING",
  "DOCUMENTS",
  "LOAN_READYCASH",
  "KSEB_FEASIBILITY",
  "EQUIPMENT_DELIVERED",
  "STRUCTURE_MATERIAL_DELIVERED",
  "INSTALLATION",
  "KSEB_DCR_DOCS_SUBMITTED",
  "INSPECTION",
  "NET_METER",
  "SUBSIDY",
  "COMPLETED",
];

export function normalizeStageId(stage: string): ProjectStage {
  if (!stage) return "BOOKING";
  if (stage === "LOAN_READY_CASH") return "LOAN_READYCASH";
  if (stage === "PANEL_INVERTER_DELIVERED") return "EQUIPMENT_DELIVERED";
  return stage as ProjectStage;
}

export const NEXT_STAGE_MAP: Record<string, ProjectStage | null> = {
  BOOKING: "DOCUMENTS",
  DOCUMENTS: "LOAN_READYCASH",
  LOAN_READYCASH: "KSEB_FEASIBILITY",
  LOAN_READY_CASH: "KSEB_FEASIBILITY",
  KSEB_FEASIBILITY: "EQUIPMENT_DELIVERED",
  EQUIPMENT_DELIVERED: "STRUCTURE_MATERIAL_DELIVERED",
  PANEL_INVERTER_DELIVERED: "STRUCTURE_MATERIAL_DELIVERED",
  STRUCTURE_MATERIAL_DELIVERED: "INSTALLATION",
  INSTALLATION: "KSEB_DCR_DOCS_SUBMITTED",
  KSEB_DCR_DOCS_SUBMITTED: "INSPECTION",
  INSPECTION: "NET_METER",
  NET_METER: "SUBSIDY",
  SUBSIDY: "COMPLETED",
  COMPLETED: null,
};

export const PROJECT_STAGES_CONFIG: {
  id: ProjectStage;
  label: string;
  shortLabel: string;
  stepNumber: number;
  description: string;
}[] = [
  { id: "BOOKING", label: "Booking", shortLabel: "Booking", stepNumber: 1, description: "Customer advance received & project booked" },
  { id: "DOCUMENTS", label: "Documents", shortLabel: "Documents", stepNumber: 2, description: "Collecting Aadhaar, electricity bill & property ownership" },
  { id: "LOAN_READYCASH", label: "Loan / ReadyCash", shortLabel: "Loan / ReadyCash", stepNumber: 3, description: "Bank loan processing or ReadyCash self-funding confirmation" },
  { id: "KSEB_FEASIBILITY", label: "KSEB Feasibility", shortLabel: "KSEB Feasibility", stepNumber: 4, description: "KSEB Soura portal feasibility application & approval" },
  { id: "EQUIPMENT_DELIVERED", label: "Panel & Inverter Delivered", shortLabel: "Panel & Inverter", stepNumber: 5, description: "Solar panels, inverter & electrical balance of plant delivered" },
  { id: "STRUCTURE_MATERIAL_DELIVERED", label: "Structure Material Delivered", shortLabel: "Structure Delivered", stepNumber: 6, description: "Mounting structure, rails & hardware delivered to site" },
  { id: "INSTALLATION", label: "Installation", shortLabel: "Installation", stepNumber: 7, description: "Physical solar PV array mounting & electrical installation" },
  { id: "KSEB_DCR_DOCS_SUBMITTED", label: "KSEB DCR Docs Submitted", shortLabel: "KSEB DCR Docs", stepNumber: 8, description: "Post-installation KSEB DCR compliance documentation submitted" },
  { id: "INSPECTION", label: "Inspection", shortLabel: "Inspection", stepNumber: 9, description: "KSEB electrical inspector site verification & approval" },
  { id: "NET_METER", label: "Net Meter", shortLabel: "Net Meter", stepNumber: 10, description: "Bi-directional solar net meter installation & grid energization" },
  { id: "SUBSIDY", label: "Subsidy", shortLabel: "Subsidy", stepNumber: 11, description: "PM Surya Ghar portal national subsidy claim & credit" },
  { id: "COMPLETED", label: "Completed", shortLabel: "Completed", stepNumber: 12, description: "Solar plant fully commissioned & handed over" },
];

export function validateCompletedStages(completedStages: ProjectStage[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(completedStages)) {
    return { valid: false, error: "completedStages must be an array" };
  }
  if (completedStages.length === 0) {
    return { valid: true };
  }

  const normalized = completedStages.map(normalizeStageId);
  const set = new Set(normalized);
  if (set.size !== normalized.length) {
    return { valid: false, error: "completedStages contains duplicate stages" };
  }

  // Must strictly match canonical prefix starting at BOOKING (index 0)
  for (let i = 0; i < normalized.length; i++) {
    const expected = CANONICAL_PROJECT_STAGES[i];
    if (normalized[i] !== expected) {
      return {
        valid: false,
        error: `Non-contiguous completedStages sequence. Expected "${expected}" at index ${i}, but found "${normalized[i]}".`,
      };
    }
  }

  return { valid: true };
}

export function getStageState(
  stageId: ProjectStage,
  currentStage: ProjectStage,
  completedStages?: ProjectStage[]
): StageState {
  const normStageId = normalizeStageId(stageId);
  const normCurrentStage = normalizeStageId(currentStage);
  const normalizedCompleted = (completedStages || []).map(normalizeStageId);

  const stageIdx = CANONICAL_PROJECT_STAGES.indexOf(normStageId);
  const currentIdx = CANONICAL_PROJECT_STAGES.indexOf(normCurrentStage);

  // If explicitly in verified completedStages
  if (normalizedCompleted.includes(normStageId)) {
    return "COMPLETED";
  }

  // If project is fully COMPLETED
  if (normCurrentStage === "COMPLETED") {
    return "COMPLETED";
  }

  // Active current working stage
  if (stageIdx === currentIdx) {
    return "CURRENT";
  }

  // FUNDAMENTAL INVARIANT: A stage before currentStage is NEVER rendered as LOCKED.
  // In strict sequential progression, any stage with index < currentIdx has already passed.
  if (stageIdx !== -1 && currentIdx !== -1 && stageIdx < currentIdx) {
    return "COMPLETED";
  }

  // Future stages are always LOCKED
  return "LOCKED";
}

export function calculateProjectProgress(
  completedStages?: ProjectStage[] | null,
  currentStage?: ProjectStage
): number {
  const normCurrent = currentStage ? normalizeStageId(currentStage) : undefined;
  if (normCurrent === "COMPLETED") return 100;

  const uniqueCompleted = Array.isArray(completedStages)
    ? Array.from(new Set(completedStages.map(normalizeStageId))).filter((s) =>
        CANONICAL_PROJECT_STAGES.includes(s)
      )
    : [];

  let count = uniqueCompleted.length;

  if (normCurrent) {
    const currentIdx = CANONICAL_PROJECT_STAGES.indexOf(normCurrent);
    if (currentIdx > 0 && count < currentIdx) {
      count = currentIdx;
    }
  }

  return Math.min(100, Math.round((count / 12) * 100));
}

export function reconcileProjectStages(
  project: any,
  auditLogs?: any[]
): {
  completedStages: ProjectStage[];
  currentStage: ProjectStage;
  stageMigrationStatus: "VERIFIED" | "NEEDS_REVIEW";
  stageMigrationNotes?: string;
} {
  const currentStageNorm = normalizeStageId(project.currentStage || "BOOKING");
  const currentIdx = CANONICAL_PROJECT_STAGES.indexOf(currentStageNorm);
  const targetCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

  const existingCompleted = Array.isArray(project.completedStages)
    ? project.completedStages.map(normalizeStageId)
    : [];
  const validation = validateCompletedStages(existingCompleted);

  if (validation.valid && existingCompleted.length === targetCurrentIdx) {
    return {
      completedStages: existingCompleted,
      currentStage: currentStageNorm,
      stageMigrationStatus: project.stageMigrationStatus || "VERIFIED",
      stageMigrationNotes: project.stageMigrationNotes,
    };
  }

  // Reconstruct verified contiguous stages up to targetCurrentIdx
  const reconstructedCompleted: ProjectStage[] = [];
  for (let i = 0; i < targetCurrentIdx; i++) {
    reconstructedCompleted.push(CANONICAL_PROJECT_STAGES[i]);
  }

  const migrationStatus: "VERIFIED" | "NEEDS_REVIEW" =
    project.stageMigrationStatus || "VERIFIED";

  return {
    completedStages: reconstructedCompleted,
    currentStage: currentStageNorm,
    stageMigrationStatus: migrationStatus,
    stageMigrationNotes: project.stageMigrationNotes,
  };
}

export function canCompleteStage(
  project: Project,
  stage: ProjectStage
): { allowed: boolean; missingRequirements: string[] } {
  const missingRequirements: string[] = [];
  const normalizedStage = normalizeStageId(stage);

  switch (normalizedStage) {
    case "BOOKING": {
      if (!project.customerId && !project.customer) {
        missingRequirements.push("Customer details must be linked to the project.");
      }
      if (!project.systemSizeKw || project.systemSizeKw <= 0) {
        missingRequirements.push("Solar system capacity (kW) must be recorded.");
      }
      if (!project.projectNumber) {
        missingRequirements.push("Project booking identification number is missing.");
      }
      break;
    }

    case "DOCUMENTS": {
      const docs = project.documents || [];
      const pendingRequired = docs.filter(
        (d) => d.isRequired && d.status === "PENDING"
      );
      if (pendingRequired.length > 0) {
        missingRequirements.push(
          `${pendingRequired.length} required document${pendingRequired.length > 1 ? "s are" : " is"} still pending (${pendingRequired.map((d) => d.title).join(", ")}).`
        );
      }
      break;
    }

    case "LOAN_READYCASH": {
      const mode = project.paymentMode || (project.loanDetail?.loanRequired ? "LOAN" : "CASH");
      if (mode === "LOAN" || mode === "PARTIAL_LOAN" || project.loanDetail?.loanRequired) {
        const loanStatus = project.loanDetail?.status || project.loanStatus;
        const isApprovedOrDisbursed =
          loanStatus === "APPROVED" ||
          loanStatus === "DISBURSED" ||
          loanStatus === "DISBURSEMENT_PENDING" ||
          loanStatus === "NOT_REQUIRED" ||
          (project.firstLoanDisbursalAmount && project.firstLoanDisbursalAmount > 0) ||
          project.firstLoanDisbursalStatus === "COLLECTED" ||
          Boolean(project.loanDetail?.firstDisbursal && project.loanDetail.firstDisbursal.amount > 0);

        if (!isApprovedOrDisbursed) {
          missingRequirements.push(
            "Bank loan approval or first disbursal details must be recorded for loan-funded projects."
          );
        }
      }
      break;
    }

    case "KSEB_FEASIBILITY": {
      const kseb = project.ksebDetail;
      const hasConsumerNumber = Boolean(kseb?.consumerNumber || project.customer?.consumerNumber || project.customer?.ksebConsumerNumber);
      const isFeasibilityApproved =
        kseb?.feasibilityApproved === true ||
        kseb?.feasibilityStatus === "APPROVED" ||
        kseb?.status === "FEASIBILITY" ||
        kseb?.status === "AGREEMENT" ||
        kseb?.status === "INSPECTION" ||
        kseb?.status === "APPROVED" ||
        kseb?.status === "NET_METER_PENDING" ||
        kseb?.status === "NET_METER_INSTALLED" ||
        kseb?.status === "COMPLETED" ||
        Boolean(kseb?.applicationNumber);

      if (!hasConsumerNumber && !isFeasibilityApproved) {
        missingRequirements.push("KSEB consumer number and Soura portal feasibility registration/approval required.");
      }
      break;
    }

    case "EQUIPMENT_DELIVERED": {
      const install = project.installationDetail;
      const panelsDelivered = Boolean(
        install?.panelsDelivered ??
        (install?.checklist?.find((c) => c.title.toLowerCase().includes("panel"))?.status === "COMPLETED" ||
          install?.status === "IN_PROGRESS" ||
          install?.status === "COMPLETED")
      );
      const inverterDelivered = Boolean(
        install?.inverterDelivered ??
        (install?.checklist?.find((c) => c.title.toLowerCase().includes("inverter"))?.status === "COMPLETED" ||
          install?.status === "IN_PROGRESS" ||
          install?.status === "COMPLETED")
      );

      if (!panelsDelivered) {
        missingRequirements.push("Solar panels delivery confirmation is pending.");
      }
      if (!inverterDelivered) {
        missingRequirements.push("Solar inverter delivery confirmation is pending.");
      }
      break;
    }

    case "STRUCTURE_MATERIAL_DELIVERED": {
      const install = project.installationDetail;
      const structureDelivered = Boolean(
        install?.structureDelivered ??
        (install?.checklist?.find((c) => c.title.toLowerCase().includes("structure"))?.status === "COMPLETED" ||
          install?.status === "IN_PROGRESS" ||
          install?.status === "COMPLETED")
      );

      if (!structureDelivered) {
        missingRequirements.push("Mounting structure & hardware delivery confirmation is pending.");
      }
      break;
    }

    case "INSTALLATION": {
      const install = project.installationDetail;
      const isCompleted =
        install?.status === "COMPLETED" ||
        install?.installationCompleted === true ||
        Boolean(install?.completionDate);

      if (!isCompleted) {
        missingRequirements.push("Physical solar installation completion confirmation is pending.");
      }
      break;
    }

    case "KSEB_DCR_DOCS_SUBMITTED": {
      const kseb = project.ksebDetail;
      const isSubmitted =
        kseb?.dcrSubmitted === true ||
        kseb?.status === "INSPECTION" ||
        kseb?.status === "APPROVED" ||
        kseb?.status === "NET_METER_PENDING" ||
        kseb?.status === "NET_METER_INSTALLED" ||
        kseb?.status === "COMPLETED";

      if (!isSubmitted) {
        missingRequirements.push("KSEB DCR compliance documentation submission confirmation is pending.");
      }
      break;
    }

    case "INSPECTION": {
      const kseb = project.ksebDetail;
      const isInspected =
        kseb?.inspectionCompleted === true ||
        kseb?.inspectionStatus === "PASSED" ||
        kseb?.inspectionStatus === "COMPLETED" ||
        kseb?.status === "APPROVED" ||
        kseb?.status === "NET_METER_PENDING" ||
        kseb?.status === "NET_METER_INSTALLED" ||
        kseb?.status === "COMPLETED";

      if (!isInspected) {
        missingRequirements.push("KSEB electrical inspection completion & approval confirmation is pending.");
      }
      break;
    }

    case "NET_METER": {
      const kseb = project.ksebDetail;
      const isMeterInstalled =
        kseb?.netMeterInstalled === true ||
        kseb?.netMeterStatus === "INSTALLED" ||
        kseb?.status === "NET_METER_INSTALLED" ||
        kseb?.status === "COMPLETED" ||
        Boolean(kseb?.netMeterInstalledDate);

      if (!isMeterInstalled) {
        missingRequirements.push("Bi-directional net meter installation and grid energization confirmation is pending.");
      }
      break;
    }

    case "SUBSIDY": {
      const subsidy = project.subsidyDetail;
      const isClaimedOrNotApplicable =
        subsidy?.claimed === true ||
        subsidy?.subsidySubmitted === true ||
        subsidy?.status === "APPROVAL" ||
        subsidy?.status === "PROCESSING" ||
        subsidy?.status === "CREDITED" ||
        subsidy?.status === "COMPLETED" ||
        subsidy?.subsidyApplicable === false;

      if (!isClaimedOrNotApplicable) {
        missingRequirements.push("PM Surya Ghar national subsidy application / claim submission confirmation is pending.");
      }
      break;
    }

    case "COMPLETED": {
      break;
    }
  }

  return {
    allowed: missingRequirements.length === 0,
    missingRequirements,
  };
}

export function canUserChangeProjectStage(user: any | null | undefined, targetStage: ProjectStage): boolean {
  if (!user) return false;
  const role = user.role;
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "PROJECT_MANAGER" || user.email === "vertxenergies@gmail.com") {
    return true;
  }
  if (role === "DOCUMENTATION_TEAM") {
    return targetStage === "DOCUMENTS" || targetStage === "KSEB_DCR_DOCS_SUBMITTED";
  }
  if (role === "KSEB_TEAM") {
    return targetStage === "KSEB_FEASIBILITY" || targetStage === "KSEB_DCR_DOCS_SUBMITTED" || targetStage === "INSPECTION" || targetStage === "NET_METER";
  }
  if (role === "INSTALLATION_TEAM") {
    return targetStage === "EQUIPMENT_DELIVERED" || targetStage === "STRUCTURE_MATERIAL_DELIVERED" || targetStage === "INSTALLATION";
  }
  if (role === "SURVEY_TEAM") {
    return targetStage === "KSEB_FEASIBILITY";
  }
  return false;
}

export const PROJECT_DELETION_REASONS_CONFIG: {
  id: ProjectDeletionReason;
  label: string;
  description: string;
  requiresDuplicateProject?: boolean;
  requiresNotes?: boolean;
}[] = [
  {
    id: "DUPLICATE_ENTRY",
    label: "Duplicate Entry",
    description: "Project already exists under another active Project ID",
    requiresDuplicateProject: true,
  },
  {
    id: "CREATED_BY_MISTAKE",
    label: "Created by Mistake",
    description: "Erroneously created test or mistaken conversion",
  },
  {
    id: "CUSTOMER_CANCELLED",
    label: "Customer Cancelled",
    description: "Customer explicitly cancelled or withdrew from solar project",
  },
  {
    id: "TEST_DEMO",
    label: "Test / Demo Project",
    description: "Temporary development or demonstration record",
  },
  {
    id: "INCORRECT_PROJECT",
    label: "Incorrect Project",
    description: "Technical mismatch, invalid site, or unfeasible structural specifications",
  },
  {
    id: "OTHER",
    label: "Other",
    description: "Operational reason requiring custom justification",
    requiresNotes: true,
  },
];

export function canUserDeleteProject(user: any | null | undefined): boolean {
  if (!user) return false;
  if (user.email === "vertxenergies@gmail.com" || user.superAdmin || user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return true;
  }
  const perms: string[] = user.permissions || ROLES_CONFIG[user.role as Role]?.permissions || [];
  return perms.includes("project.delete");
}

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
      "audit.view", "user.create", "user.edit", "user.deactivate", "notifications.view",
      "payment.view", "payment.update", "payment.override",
      "project.delete", "project.restore"
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
      "audit.view", "user.create", "user.edit", "user.deactivate", "notifications.view",
      "payment.view", "payment.update", "payment.override",
      "project.delete", "project.restore"
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
      "reports.view", "team.view", "settings.view", "audit.view", "notifications.view",
      "payment.view", "payment.update"
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
      "followup.view", "reports.view", "team.view", "notifications.view",
      "payment.view", "payment.update"
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
      "notifications.view", "payment.view"
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
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    lastLoginAt: "2026-08-11T09:30:00.000Z",
    lastActiveAt: "2026-08-11T11:00:00.000Z",
  },
];
