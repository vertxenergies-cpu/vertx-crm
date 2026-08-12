import fs from "fs";
import path from "path";
import {
  User,
  Lead,
  Customer,
  Project,
  ProjectDocument,
  LoanDetail,
  KsebDetail,
  InstallationDetail,
  SubsidyDetail,
  FollowUp,
  Task,
  Duty,
  AuditLog,
  Notification,
  Note,
  DashboardStats,
  ProjectStage,
  ProjectHealth,
  LeadStage,
  Role,
  EmployeeStatus,
  ApprovalStatus,
  SuperAdminStats,
  EmployeeWorkloadSummary,
  CustomPermissionOverrides,
  Permission,
  PaymentMode,
  PaymentMilestone,
  PaymentMilestoneStatus,
  ProjectDeletionReason,
  StageHistoryEntry,
} from "@/types";
import { generateSeedData } from "./seed-data";
import {
  PROJECT_STAGES_CONFIG,
  ROLES_CONFIG,
  CANONICAL_PROJECT_STAGES,
  NEXT_STAGE_MAP,
  normalizeStageId,
  canCompleteStage,
  validateCompletedStages,
  reconcileProjectStages,
  INITIAL_USERS,
} from "./constants";

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  projects: Project[];
  documents: ProjectDocument[];
  loanDetails: LoanDetail[];
  ksebDetails: KsebDetail[];
  installationDetails: InstallationDetail[];
  subsidyDetails: SubsidyDetail[];
  followUps: FollowUp[];
  tasks: Task[];
  duties: Duty[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  notes: Note[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let memoryDb: DatabaseSchema | null = null;

function ensureDataFile(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // Handle read-only serverless environment
      }
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      if (!memoryDb.users) memoryDb.users = [];
      if (!memoryDb.users.some((u) => u.email?.toLowerCase() === "vertxenergies@gmail.com")) {
        memoryDb.users.unshift(INITIAL_USERS[0]);
      }
      return memoryDb;
    }
  } catch (err) {
    console.error("Failed to load db file, initializing with seed data", err);
  }

  const seed = generateSeedData();
  memoryDb = seed;
  saveDataFile(seed);
  return seed;
}

function saveDataFile(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    memoryDb = data;
  } catch (err) {
    console.error("Failed to save db file", err);
  }
}

export const db = {
  // Users
  getUsers(): User[] {
    const data = ensureDataFile();
    return data.users;
  },

  getUserById(id: string): User | undefined {
    const data = ensureDataFile();
    return data.users.find((u) => u.id === id || u.uid === id);
  },

  createUser(user: User): User {
    const data = ensureDataFile();
    const existingIndex = data.users.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      data.users[existingIndex] = { ...data.users[existingIndex], ...user, updatedAt: new Date().toISOString() };
      saveDataFile(data);
      return data.users[existingIndex];
    }
    data.users.push(user);
    saveDataFile(data);
    return user;
  },

  syncUsersFromFirestore(firestoreUsers: User[]): void {
    if (!Array.isArray(firestoreUsers) || firestoreUsers.length === 0) return;
    const data = ensureDataFile();
    let changed = false;
    for (const fUser of firestoreUsers) {
      if (!fUser.uid && !fUser.id && !fUser.email) continue;
      const idx = data.users.findIndex(
        (u) =>
          (fUser.uid && (u.uid === fUser.uid || u.id === fUser.uid)) ||
          (fUser.email && u.email.toLowerCase() === fUser.email.toLowerCase())
      );
      if (idx >= 0) {
        data.users[idx] = { ...data.users[idx], ...fUser };
        changed = true;
      } else {
        data.users.push(fUser);
        changed = true;
      }
    }
    if (changed) {
      saveDataFile(data);
    }
  },

  updateUserPasswordStatus(uidOrEmail: string, mustChangePassword: boolean): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const lower = uidOrEmail.trim().toLowerCase();
    const user = data.users.find((u) => u.uid === uidOrEmail || u.id === uidOrEmail || u.email.toLowerCase() === lower);
    if (!user) return { success: false, error: "User not found." };
    user.mustChangePassword = mustChangePassword;
    user.updatedAt = new Date().toISOString();
    saveDataFile(data);

    this.createAuditLog({
      entityType: "USER",
      entityId: user.uid,
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      action: "PASSWORD_CHANGED",
      actionCategory: "SECURITY",
      description: `User ${user.name} (${user.email}) updated account password. Temporary password requirement resolved.`,
      newValue: `mustChangePassword=${mustChangePassword}`,
    });

    return { success: true };
  },

  // Leads - Canonical Work Assignment Architecture
  getLeads(filters?: {
    search?: string;
    salespersonId?: string;
    assignedToUid?: string;
    unassigned?: boolean | string;
    district?: string;
    source?: string;
    priority?: string;
    stage?: string;
  }): Lead[] {
    const data = ensureDataFile();
    let leads = [...data.leads];

    // Ensure all leads have canonical assignment fields mapped
    let needsSave = false;
    leads.forEach((lead) => {
      if (lead.assignedToUid === undefined) {
        needsSave = true;
        const legacyId = lead.assignedSalespersonId || (lead as any).salespersonId || (lead as any).assignedTo;
        let matchedUser = data.users.find((u) => u.uid === legacyId || u.id === legacyId);
        if (!matchedUser && legacyId && legacyId !== "usr-super-admin" && legacyId !== "unassigned") {
          matchedUser = data.users.find((u) => u.email.toLowerCase() === String(legacyId).toLowerCase());
        }
        if (matchedUser && (matchedUser.approvalStatus === "APPROVED" || matchedUser.superAdmin) && (matchedUser.status === "ACTIVE" || matchedUser.active)) {
          lead.assignedToUid = matchedUser.uid;
          lead.assignedToName = matchedUser.name;
          lead.assignedDepartment = matchedUser.department || "Sales & Marketing";
          lead.assignedAt = lead.createdAt;
          lead.assignedByUid = lead.createdBy || matchedUser.uid;
          lead.assignedByName = matchedUser.name;
          lead.assignedSalespersonId = matchedUser.uid;
        } else {
          lead.assignedToUid = null;
          lead.assignedToName = null;
          lead.assignedDepartment = null;
          lead.assignedAt = null;
          lead.assignedByUid = null;
          lead.assignedByName = null;
          lead.assignedSalespersonId = null;
        }
      }
    });

    if (needsSave) {
      saveDataFile(data);
    }

    // Filters
    if (filters?.unassigned === true || filters?.unassigned === "true" || filters?.assignedToUid === "UNASSIGNED" || filters?.salespersonId === "UNASSIGNED") {
      leads = leads.filter((l) => !l.assignedToUid);
    } else if (filters?.assignedToUid && filters.assignedToUid !== "ALL") {
      leads = leads.filter((l) => l.assignedToUid === filters.assignedToUid);
    } else if (filters?.salespersonId && filters.salespersonId !== "ALL") {
      leads = leads.filter((l) => l.assignedToUid === filters.salespersonId || l.assignedSalespersonId === filters.salespersonId);
    }

    if (filters?.district && filters.district !== "ALL") {
      leads = leads.filter((l) => l.district.toLowerCase() === filters.district?.toLowerCase());
    }
    if (filters?.source && filters.source !== "ALL") {
      leads = leads.filter((l) => l.leadSource.toLowerCase() === filters.source?.toLowerCase());
    }
    if (filters?.priority && filters.priority !== "ALL") {
      leads = leads.filter((l) => l.priority === filters.priority);
    }
    if (filters?.stage && filters.stage !== "ALL") {
      leads = leads.filter((l) => l.currentStage === filters.stage);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.leadNumber.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q) ||
          (l.assignedToName && l.assignedToName.toLowerCase().includes(q))
      );
    }

    // Attach salesperson User object
    return leads.map((lead) => ({
      ...lead,
      assignedSalesperson: lead.assignedToUid
        ? data.users.find((u) => u.uid === lead.assignedToUid || u.id === lead.assignedToUid) || undefined
        : undefined,
    }));
  },

  getLeadById(id: string): Lead | undefined {
    const data = ensureDataFile();
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return undefined;

    return {
      ...lead,
      assignedSalesperson: lead.assignedToUid
        ? data.users.find((u) => u.uid === lead.assignedToUid || u.id === lead.assignedToUid) || undefined
        : undefined,
    };
  },

  createLead(
    input: Omit<Lead, "id" | "leadNumber" | "createdAt" | "updatedAt" | "stageChangedAt">,
    creator?: { uid: string; name: string; role?: Role }
  ): Lead {
    const data = ensureDataFile();
    const count = data.leads.length + 1;
    const pad = String(count).padStart(4, "0");
    const leadNumber = `LED-2026-${pad}`;

    // Target assignment resolution
    let targetUid: string | null = input.assignedToUid || input.assignedSalespersonId || null;
    if (targetUid === "usr-super-admin" || targetUid === "UNASSIGNED" || targetUid === "") {
      targetUid = null;
    }

    let targetUser: User | undefined = undefined;
    if (targetUid) {
      targetUser = data.users.find(
        (u) =>
          (u.uid === targetUid || u.id === targetUid) &&
          (u.approvalStatus === "APPROVED" || u.superAdmin === true) &&
          (u.status === "ACTIVE" || u.active === true)
      );
    }

    const assignedToUid = targetUser ? targetUser.uid : null;
    const assignedToName = targetUser ? targetUser.name : null;
    const assignedDepartment = targetUser ? targetUser.department || "Sales & Marketing" : null;
    const assignedAt = targetUser ? new Date().toISOString() : null;
    const assignedByUid = creator?.uid || "system";
    const assignedByName = creator?.name || "System";

    const newLead: Lead = {
      ...input,
      id: `lead-${Date.now()}`,
      leadNumber,
      assignedToUid,
      assignedToName,
      assignedDepartment,
      assignedAt,
      assignedByUid,
      assignedByName,
      assignedSalespersonId: assignedToUid,
      stageChangedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: creator?.uid,
    };

    data.leads.unshift(newLead);

    // Audit log
    this.createAuditLog({
      entityType: "LEAD",
      entityId: newLead.id,
      userId: creator?.uid || assignedToUid || "system",
      userName: creator?.name || assignedToName || "System",
      userRole: creator?.role || "ADMIN",
      action: "LEAD_CREATED",
      field: "assignedToUid",
      oldValue: null,
      newValue: assignedToUid,
      description: `Created lead ${newLead.leadNumber} for ${newLead.customerName} (${newLead.estimatedSystemSizeKw} kW in ${newLead.district}), assigned to ${assignedToName || "Unassigned"}.`,
    });

    saveDataFile(data);
    return {
      ...newLead,
      assignedSalesperson: targetUser,
    };
  },

  assignLead(
    leadId: string,
    targetUid: string | null | undefined,
    actor: { uid: string; name: string; role?: Role }
  ): Lead | undefined {
    const data = ensureDataFile();
    const index = data.leads.findIndex((l) => l.id === leadId);
    if (index === -1) return undefined;

    const lead = data.leads[index];
    const prevUid = lead.assignedToUid || null;
    const prevName = lead.assignedToName || "Unassigned";

    let targetUser: User | undefined = undefined;
    if (targetUid && targetUid !== "UNASSIGNED" && targetUid !== "null" && targetUid !== "") {
      targetUser = data.users.find(
        (u) =>
          (u.uid === targetUid || u.id === targetUid) &&
          (u.approvalStatus === "APPROVED" || u.superAdmin === true) &&
          (u.status === "ACTIVE" || u.active === true)
      );

      if (!targetUser) {
        throw new Error("Invalid assignee: Target employee must be an approved and active staff member.");
      }
    }

    if (targetUser) {
      lead.assignedToUid = targetUser.uid;
      lead.assignedToName = targetUser.name;
      lead.assignedDepartment = targetUser.department || "Sales & Marketing";
      lead.assignedAt = new Date().toISOString();
      lead.assignedByUid = actor.uid;
      lead.assignedByName = actor.name;
      lead.assignedSalespersonId = targetUser.uid;
    } else {
      lead.assignedToUid = null;
      lead.assignedToName = null;
      lead.assignedDepartment = null;
      lead.assignedAt = null;
      lead.assignedByUid = actor.uid;
      lead.assignedByName = actor.name;
      lead.assignedSalespersonId = null;
    }

    lead.updatedAt = new Date().toISOString();
    data.leads[index] = lead;

    // Audit Log Creation
    const actionType =
      !prevUid && targetUser
        ? "LEAD_ASSIGNED"
        : prevUid && !targetUser
        ? "LEAD_UNASSIGNED"
        : "LEAD_REASSIGNED";

    const description =
      actionType === "LEAD_ASSIGNED"
        ? `${actor.name} assigned lead ${lead.leadNumber} (${lead.customerName}) to ${targetUser?.name}.`
        : actionType === "LEAD_UNASSIGNED"
        ? `${actor.name} removed assignment from lead ${lead.leadNumber} (${lead.customerName}) (previously ${prevName}).`
        : `${actor.name} reassigned lead ${lead.leadNumber} (${lead.customerName}) from ${prevName} to ${targetUser?.name}.`;

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "LEAD",
      entityId: lead.id,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role || "ADMIN",
      action: actionType,
      actionCategory: "BUSINESS",
      targetUserId: targetUser?.uid || null,
      targetUserName: targetUser?.name || null,
      field: "assignedToUid",
      oldValue: prevUid,
      newValue: targetUser?.uid || null,
      description,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return {
      ...lead,
      assignedSalesperson: targetUser,
    };
  },

  updateLead(id: string, updates: Partial<Lead>, user?: User): Lead | undefined {
    const data = ensureDataFile();
    const index = data.leads.findIndex((l) => l.id === id);
    if (index === -1) return undefined;

    // If assignedToUid is updated, route through assignLead
    if (updates.assignedToUid !== undefined && user) {
      this.assignLead(id, updates.assignedToUid, {
        uid: user.uid,
        name: user.name,
        role: user.role || undefined,
      });
    }

    const current = data.leads[index];
    const updated: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.currentStage && updates.currentStage !== current.currentStage) {
      updated.stageChangedAt = new Date().toISOString();
      this.createAuditLog({
        entityType: "LEAD",
        entityId: id,
        userId: user?.uid || user?.id || "system",
        userName: user?.name || "System",
        userRole: user?.role || "ADMIN",
        action: "STAGE_CHANGE",
        actionCategory: "BUSINESS",
        field: "currentStage",
        oldValue: current.currentStage,
        newValue: updates.currentStage,
        description: `Updated stage of ${current.leadNumber} from ${current.currentStage} to ${updates.currentStage}.`,
        severity: "NORMAL",
      });
    }

    data.leads[index] = updated;
    saveDataFile(data);
    return {
      ...updated,
      assignedSalesperson: updated.assignedToUid
        ? data.users.find((u) => u.uid === updated.assignedToUid || u.id === updated.assignedToUid) || undefined
        : undefined,
    };
  },

  convertLeadToCustomer(leadId: string, customOptions?: {
    systemSizeKw?: number;
    projectValue?: number;
    salespersonId?: string;
    projectManagerId?: string;
    ksebConsumerNumber?: string;
    ksebSection?: string;
  }, user?: User): { customer: Customer; project: Project } {
    const data = ensureDataFile();
    const lead = data.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");

    // Check if customer already exists
    let existingCustomer = data.customers.find((c) => c.phone === lead.phone || c.originalLeadId === lead.id);
    const customer: Customer = existingCustomer || {
      id: `cust-${Date.now()}`,
      customerNumber: `CUST-2026-${String(data.customers.length + 1).padStart(4, "0")}`,
      name: lead.customerName,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      email: lead.email || null,
      address: lead.address || `Address in ${lead.district}`,
      district: lead.district,
      consumerNumber: customOptions?.ksebConsumerNumber || null,
      ksebConsumerNumber: customOptions?.ksebConsumerNumber || null,
      ksebSection: customOptions?.ksebSection || null,
      ksebSubDivision: null,
      propertyType: "Residential Villa",
      notes: lead.requirementNotes,
      originalLeadId: lead.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!existingCustomer) {
      data.customers.push(customer);
    }

    // Create Project
    const projCount = data.projects.length + 1;
    const projPad = String(480 + projCount).padStart(5, "0");
    const projectNumber = `SOL-2026-${projPad}`;
    const systemSizeKw = customOptions?.systemSizeKw || lead.estimatedSystemSizeKw || 5.0;
    const projectValue = customOptions?.projectValue || (systemSizeKw * 57000);

    const project: Project = {
      id: `proj-${Date.now()}`,
      projectNumber,
      customerId: customer.id,
      leadId: lead.id,
      systemSizeKw,
      projectType: "RESIDENTIAL",
      inverterCapacityKw: systemSizeKw,
      inverterMake: "Growatt / Sungrow High Efficiency",
      panelMake: "Waaree / Vikram Solar TopCon Bi-facial",
      salespersonId: customOptions?.salespersonId || lead.assignedSalespersonId || "usr-super-admin",
      projectManagerId: customOptions?.projectManagerId || "usr-super-admin",
      siteSupervisorId: "usr-super-admin",
      currentStage: "BOOKING",
      overallStatus: "ON_TRACK",
      priority: lead.priority === "HOT" || lead.priority === "HIGH" ? "HIGH" : "MEDIUM",
      estimatedProjectValue: projectValue,
      accountsReferenceId: `ACC-INV-2026-${1000 + projCount}`,
      startDate: new Date().toISOString(),
      expectedCompletionDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      nextActionTitle: "Collect KYC documents, Electricity Bill and signed Agreement",
      nextActionOwnerId: lead.assignedSalespersonId || "usr-super-admin",
      nextActionDueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      nextActionStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.projects.unshift(project);

    // Create Stage Trackers for Project
    // 1. Documents (Pure status tracking)
    const defaultDocChecklist = [
      { documentType: "AADHAAR" as const, title: "Aadhaar Card", isRequired: true },
      { documentType: "PAN" as const, title: "PAN Card", isRequired: true },
      { documentType: "ELECTRICITY_BILL" as const, title: "Latest KSEB Electricity Bill", isRequired: true },
      { documentType: "BANK_PASSBOOK" as const, title: "Bank Passbook", isRequired: true },
      { documentType: "CANCELLED_CHEQUE" as const, title: "Cancelled Cheque", isRequired: true },
      { documentType: "TAX_RECEIPT_PROPERTY" as const, title: "Building Tax Receipt / Ownership Proof", isRequired: true },
      { documentType: "CUSTOMER_PHOTO" as const, title: "Customer Photograph", isRequired: false },
      { documentType: "SITE_PHOTO" as const, title: "Roof & Existing Meter Photos", isRequired: false },
    ];

    defaultDocChecklist.forEach((doc, idx) => {
      data.documents.push({
        id: `doc-${project.id}-${idx + 1}`,
        projectId: project.id,
        documentType: doc.documentType,
        title: doc.title,
        isRequired: doc.isRequired,
        status: "PENDING",
        updatedById: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // 2. Loan Detail
    data.loanDetails.push({
      id: `loan-${project.id}`,
      projectId: project.id,
      loanRequired: false,
      status: "NOT_REQUIRED",
      updatedAt: new Date().toISOString(),
    });

    // 3. KSEB Detail
    data.ksebDetails.push({
      id: `kseb-${project.id}`,
      projectId: project.id,
      consumerNumber: customer.ksebConsumerNumber || null,
      sectionOffice: customer.ksebSection || null,
      status: "NOT_STARTED",
      feasibilityStatus: "Pending",
      agreementStatus: "Pending",
      inspectionStatus: "Not Scheduled",
      netMeterStatus: "Pending",
      updatedAt: new Date().toISOString(),
    });

    // 4. Installation Detail
    data.installationDetails.push({
      id: `inst-${project.id}`,
      projectId: project.id,
      installationTeamName: "Malabar Solar Crew",
      supervisorId: "usr-super-admin",
      status: "NOT_STARTED",
      checklist: [
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
      ],
      photos: [],
      updatedAt: new Date().toISOString(),
    });

    // 5. Subsidy Detail
    data.subsidyDetails.push({
      id: `sub-${project.id}`,
      projectId: project.id,
      subsidyApplicable: true,
      status: "NOT_STARTED",
      inspectionStatus: "Pending",
      approvalStatus: "Pending",
      creditStatus: "Pending",
      estimatedSubsidyAmount: systemSizeKw <= 2 ? 60000 : 78000,
      notes: "PM Surya Ghar Muft Bijli Yojana national subsidy.",
      updatedAt: new Date().toISOString(),
    });

    // Update Lead stage to BOOKED
    lead.currentStage = "BOOKED";
    lead.convertedToCustomerId = customer.id;
    lead.updatedAt = new Date().toISOString();

    // Create Audit Log
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: project.id,
      userId: user?.id || "usr-super-admin",
      userName: user?.name || "Sales Executive",
      userRole: user?.role || "SALES_EXECUTIVE",
      action: "PROJECT_CREATED",
      field: "currentStage",
      oldValue: "LEAD_CONVERTED",
      newValue: "BOOKING",
      description: `Converted lead ${lead.leadNumber} to Customer ${customer.name} and initiated Solar Project ${project.projectNumber} (${systemSizeKw} kW).`,
    });

    saveDataFile(data);
    return { customer, project };
  },

  // Customers
  getCustomers(search?: string): Customer[] {
    const data = ensureDataFile();
    let customers = [...data.customers];

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customerNumber.toLowerCase().includes(q) ||
          (c.ksebConsumerNumber && c.ksebConsumerNumber.includes(q)) ||
          c.district.toLowerCase().includes(q)
      );
    }

    return customers.map((c) => ({
      ...c,
      projects: data.projects.filter((p) => p.customerId === c.id),
    }));
  },

  getCustomerById(id: string): Customer | undefined {
    const data = ensureDataFile();
    const customer = data.customers.find((c) => c.id === id);
    if (!customer) return undefined;

    return {
      ...customer,
      projects: data.projects.filter((p) => p.customerId === customer.id),
    };
  },

  createCustomer(input: Omit<Customer, "id" | "customerNumber" | "createdAt" | "updatedAt">): Customer {
    const data = ensureDataFile();
    const count = data.customers.length + 1;
    const customerNumber = `CUST-2026-${String(count).padStart(4, "0")}`;

    const newCust: Customer = {
      ...input,
      id: `cust-${Date.now()}`,
      customerNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.customers.push(newCust);
    saveDataFile(data);
    return newCust;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const data = ensureDataFile();
    const idx = data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    const updated: Customer = {
      ...data.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data.customers[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Projects
  getProjects(filters?: {
    stage?: string;
    status?: string;
    salespersonId?: string;
    projectManagerId?: string;
    district?: string;
    search?: string;
  }): Project[] {
    return this.getProjectsWithCounts(filters).projects;
  },

  getProjectsWithCounts(filters?: {
    stage?: string;
    status?: string;
    salespersonId?: string;
    projectManagerId?: string;
    district?: string;
    search?: string;
    onlyDeleted?: boolean;
    includeDeleted?: boolean;
  }): {
    projects: Project[];
    total: number;
    stageCounts: Record<string, number>;
    healthCounts: Record<string, number>;
    deletedCount: number;
  } {
    const data = ensureDataFile();

    const matchFilters = (
      p: Project,
      f?: {
        stage?: string;
        status?: string;
        salespersonId?: string;
        projectManagerId?: string;
        district?: string;
        search?: string;
        onlyDeleted?: boolean;
        includeDeleted?: boolean;
      }
    ) => {
      // Soft deletion filtering
      if (f?.onlyDeleted) {
        if (p.deleted !== true) return false;
      } else if (!f?.includeDeleted) {
        if (p.deleted === true) return false;
      }

      if (f?.stage && f.stage !== "ALL" && p.currentStage !== f.stage) return false;
      if (f?.status && f.status !== "ALL" && p.overallStatus !== f.status) return false;
      if (f?.salespersonId && f.salespersonId !== "ALL" && p.salespersonId !== f.salespersonId) return false;
      if (f?.projectManagerId && f.projectManagerId !== "ALL" && p.projectManagerId !== f.projectManagerId) return false;
      if (f?.district && f.district !== "ALL") {
        const cust = data.customers.find((c) => c.id === p.customerId);
        if (!cust || cust.district.toLowerCase() !== f.district.toLowerCase()) return false;
      }
      if (f?.search && f.search.trim()) {
        const q = f.search.trim().toLowerCase();
        const cust = data.customers.find((c) => c.id === p.customerId);
        const kseb = data.ksebDetails.find((k) => k.projectId === p.id);
        const loan = data.loanDetails.find((l) => l.projectId === p.id);

        const matches =
          p.projectNumber.toLowerCase().includes(q) ||
          (cust && (cust.name.toLowerCase().includes(q) || cust.phone.includes(q) || cust.district.toLowerCase().includes(q))) ||
          (kseb && (kseb.consumerNumber?.toLowerCase().includes(q) || kseb.applicationNumber?.toLowerCase().includes(q))) ||
          (loan && loan.applicationNumber?.toLowerCase().includes(q)) ||
          (p.deletionReason && p.deletionReason.toLowerCase().includes(q)) ||
          (p.duplicateOfProjectId && p.duplicateOfProjectId.toLowerCase().includes(q));

        if (!matches) return false;
      }
      return true;
    };

    const filtered = data.projects.filter((p) => matchFilters(p, filters));

    // Dynamic stage counts matching other active filters (status, district, search, etc.)
    const allStageIds: ProjectStage[] = PROJECT_STAGES_CONFIG.map((s) => s.id);

    const stageCounts: Record<string, number> = {
      ALL: data.projects.filter((p) => matchFilters(p, { ...filters, stage: undefined, onlyDeleted: false })).length,
    };

    allStageIds.forEach((stageId) => {
      stageCounts[stageId] = data.projects.filter(
        (p) => p.currentStage === stageId && matchFilters(p, { ...filters, stage: undefined, onlyDeleted: false })
      ).length;
    });

    // Dynamic health counts matching other active filters (stage, district, search, etc.)
    const allHealthIds: ProjectHealth[] = ["ON_TRACK", "AT_RISK", "DELAYED", "ON_HOLD", "COMPLETED", "CANCELLED"];
    const healthCounts: Record<string, number> = {
      ALL: data.projects.filter((p) => matchFilters(p, { ...filters, status: undefined, onlyDeleted: false })).length,
    };

    allHealthIds.forEach((healthId) => {
      healthCounts[healthId] = data.projects.filter(
        (p) => p.overallStatus === healthId && matchFilters(p, { ...filters, status: undefined, onlyDeleted: false })
      ).length;
    });

    const deletedCount = data.projects.filter((p) => p.deleted === true).length;

    return {
      projects: filtered.map((p) => this.populateProject(p, data)),
      total: filtered.length,
      stageCounts,
      healthCounts,
      deletedCount,
    };
  },

  getProjectById(id: string): Project | undefined {
    const data = ensureDataFile();
    const project = data.projects.find((p) => p.id === id || p.projectNumber === id);
    if (!project) return undefined;

    return this.populateProject(project, data);
  },

  populateProject(p: Project, data: DatabaseSchema): Project {
    // Auto-migrate legacy stages
    let currentStageStr: string = p.currentStage as string;
    if (currentStageStr === "BOOKING_CONFIRMED") currentStageStr = "BOOKING";
    if (currentStageStr === "LOAN") currentStageStr = "LOAN_READYCASH";
    if (currentStageStr === "KSEB_DOCS" || currentStageStr === "KSEB_DOCUMENTATION") currentStageStr = "KSEB_FEASIBILITY";
    if (currentStageStr === "KSEB_APP" || currentStageStr === "KSEB_APPLICATION") currentStageStr = "KSEB_DCR_DOCS_SUBMITTED";
    if (currentStageStr === "KSEB_INSPECTION") currentStageStr = "INSPECTION";
    p.currentStage = currentStageStr as ProjectStage;

    const loanDetail = data.loanDetails.find((l) => l.projectId === p.id) || null;
    let duplicateOfProject: Project | null = null;
    if (p.duplicateOfProjectId) {
      const orig = data.projects.find((pr) => pr.id === p.duplicateOfProjectId || pr.projectNumber === p.duplicateOfProjectId);
      if (orig) {
        duplicateOfProject = {
          ...orig,
          customer: data.customers.find((c) => c.id === orig.customerId),
        };
      }
    }

    const populated: Project = {
      ...p,
      customer: data.customers.find((c) => c.id === p.customerId),
      salesperson: data.users.find((u) => u.id === p.salespersonId || u.uid === p.salespersonId),
      projectManager: data.users.find((u) => u.id === p.projectManagerId || u.uid === p.projectManagerId),
      siteSupervisor: data.users.find((u) => u.id === p.siteSupervisorId || u.uid === p.siteSupervisorId),
      nextActionOwner: data.users.find((u) => u.id === p.nextActionOwnerId || u.uid === p.nextActionOwnerId),
      documents: data.documents.filter((d) => d.projectId === p.id),
      loanDetail,
      duplicateOfProject,
      ksebDetail: data.ksebDetails.find((k) => k.projectId === p.id) || null,
      installationDetail: data.installationDetails.find((i) => i.projectId === p.id) || null,
      subsidyDetail: data.subsidyDetails.find((s) => s.projectId === p.id) || null,
      tasks: data.tasks.filter((t) => t.projectId === p.id),
      followUps: data.followUps.filter((f) => f.projectId === p.id),
    };

    // Apply Payment Milestone calculations
    const projectValue = populated.estimatedProjectValue || populated.projectAmount || 300000;
    let mode: PaymentMode = populated.paymentMode || "CASH";
    if (!populated.paymentMode && loanDetail && (loanDetail.loanRequired || loanDetail.status === "APPROVED" || loanDetail.status === "DISBURSED")) {
      const loanAmt = loanDetail.loanAmount || 0;
      mode = loanAmt > 0 && loanAmt < projectValue ? "PARTIAL_LOAN" : "LOAN";
    }

    populated.paymentMode = mode;
    populated.projectAmount = projectValue;

    const sanctionedLoan = loanDetail?.loanAmount || populated.loanAmount || (mode === "LOAN" ? projectValue : mode === "PARTIAL_LOAN" ? Math.round(projectValue * 0.85) : 0);
    populated.loanAmount = sanctionedLoan;

    // AUTO-MIGRATION of legacy milestones or fresh initialization
    if (!populated.paymentMilestones || populated.paymentMilestones.length === 0) {
      if (mode === "CASH") {
        const advance = Math.round(projectValue * 0.20);
        const preInst = Math.round(projectValue * 0.30);
        const inst = Math.round(projectValue * 0.35);
        const finalPay = projectValue - (advance + preInst + inst);

        populated.paymentMilestones = [
          { id: `pm-1-${populated.id}`, type: "INITIAL_ADVANCE", label: "Initial Advance", amount: advance, status: "COLLECTED", collectedDate: populated.startDate, notes: "Collected at booking" },
          { id: `pm-2-${populated.id}`, type: "PRE_INSTALLATION_PAYMENT", label: "Pre-Installation Payment", amount: preInst, status: "PENDING" },
          { id: `pm-3-${populated.id}`, type: "INSTALLATION_PAYMENT", label: "Installation Payment", amount: inst, status: "PENDING" },
          { id: `pm-4-${populated.id}`, type: "FINAL_PAYMENT", label: "Final Payment", amount: finalPay, status: "PENDING" },
          { id: `pm-5-${populated.id}`, type: "FULLY_PAID", label: "Fully Paid", amount: 0, status: "PENDING" },
        ];
      } else if (mode === "LOAN") {
        // 100% Bank Financed project
        const loanAmtValue = sanctionedLoan || projectValue;
        const initialLoanDisb = Math.round(loanAmtValue * 0.70);
        const secondDisbursal = Math.max(0, loanAmtValue - initialLoanDisb);
        const loanStatus = loanDetail?.status || populated.loanStatus || "APPLIED";
        const isDisbursed = loanStatus === "DISBURSED";

        populated.paymentMilestones = [
          { id: `pm-1-${populated.id}`, type: "INITIAL_ADVANCE", label: "Initial Advance", amount: 0, status: "NOT_APPLICABLE" },
          { id: `pm-2-${populated.id}`, type: "LOAN_APPLIED", label: "Loan Applied", amount: loanAmtValue, status: loanStatus === "NOT_APPLIED" ? "PENDING" : "COLLECTED", collectedDate: loanDetail?.applicationDate },
          { id: `pm-3-${populated.id}`, type: "LOAN_APPROVED", label: "Loan Approved", amount: loanAmtValue, status: (loanStatus === "APPROVED" || isDisbursed) ? "COLLECTED" : "PENDING" },
          { id: `pm-4-${populated.id}`, type: "FIRST_LOAN_DISBURSAL", label: "First Loan Disbursal", amount: initialLoanDisb, status: isDisbursed ? "COLLECTED" : "PENDING" },
          { id: `pm-5-${populated.id}`, type: "SECOND_LOAN_DISBURSAL", label: "Second Loan Disbursal", amount: secondDisbursal, status: "PENDING" },
          { id: `pm-6-${populated.id}`, type: "FULLY_PAID", label: "Fully Paid", amount: 0, status: "PENDING" },
        ];
      } else {
        // PARTIAL_LOAN (Bank + Customer)
        const custAdvance = Math.max(0, projectValue - (sanctionedLoan || Math.round(projectValue * 0.85)));
        const loanAmtValue = sanctionedLoan || (projectValue - custAdvance);
        const firstDisbursal = Math.round(loanAmtValue * 0.75);
        const secondDisbursal = Math.max(0, loanAmtValue - firstDisbursal);
        const loanStatus = loanDetail?.status || populated.loanStatus || "APPLIED";
        const isDisbursed = loanStatus === "DISBURSED";

        populated.paymentMilestones = [
          { id: `pm-1-${populated.id}`, type: "INITIAL_ADVANCE", label: "Initial Advance", amount: custAdvance || Math.round(projectValue * 0.15), status: "COLLECTED", collectedDate: populated.startDate },
          { id: `pm-2-${populated.id}`, type: "LOAN_APPLIED", label: "Loan Applied", amount: loanAmtValue, status: loanStatus === "NOT_APPLIED" ? "PENDING" : "COLLECTED" },
          { id: `pm-3-${populated.id}`, type: "LOAN_APPROVED", label: "Loan Approved", amount: loanAmtValue, status: (loanStatus === "APPROVED" || isDisbursed) ? "COLLECTED" : "PENDING" },
          { id: `pm-4-${populated.id}`, type: "FIRST_LOAN_DISBURSAL", label: "First Loan Disbursal", amount: firstDisbursal, status: isDisbursed ? "COLLECTED" : "PENDING" },
          { id: `pm-5-${populated.id}`, type: "SECOND_LOAN_DISBURSAL", label: "Second Loan Disbursal", amount: secondDisbursal, status: "PENDING" },
          { id: `pm-6-${populated.id}`, type: "FULLY_PAID", label: "Fully Paid", amount: 0, status: "PENDING" },
        ];
      }
    } else {
      // Auto-migrate legacy milestone types for LOAN / PARTIAL_LOAN projects
      if (mode === "LOAN" || mode === "PARTIAL_LOAN") {
        const hasLegacy = populated.paymentMilestones.some(
          (m: any) =>
            m.type === "LOAN_DISBURSED" ||
            m.type === "FINAL_LOAN_INSTALLMENT" ||
            m.type === "CUSTOMER_BALANCE" ||
            m.type === "FIRST_LOAN_PAYMENT" ||
            m.type === "REMAINING_CUSTOMER_BALANCE"
        );

        if (hasLegacy) {
          const oldFirstDisb = populated.paymentMilestones.find(
            (m: any) => m.type === "LOAN_DISBURSED" || m.type === "FIRST_LOAN_PAYMENT"
          );
          const oldSecondDisb = populated.paymentMilestones.find(
            (m: any) => m.type === "FINAL_LOAN_INSTALLMENT" || m.type === "CUSTOMER_BALANCE"
          );
          const oldAdvance = populated.paymentMilestones.find((m: any) => m.type === "INITIAL_ADVANCE");
          const oldApplied = populated.paymentMilestones.find((m: any) => m.type === "LOAN_APPLIED");
          const oldApproved = populated.paymentMilestones.find((m: any) => m.type === "LOAN_APPROVED");

          const firstAmount = oldFirstDisb?.amount || Math.round(sanctionedLoan * 0.75);
          const secondAmount = oldSecondDisb?.amount || Math.max(0, sanctionedLoan - firstAmount);

          populated.paymentMilestones = [
            {
              id: oldAdvance?.id || `pm-1-${populated.id}`,
              type: "INITIAL_ADVANCE",
              label: "Initial Advance",
              amount: mode === "LOAN" ? 0 : (oldAdvance?.amount ?? Math.max(0, projectValue - sanctionedLoan)),
              status: mode === "LOAN" ? "NOT_APPLICABLE" : (oldAdvance?.status || "COLLECTED"),
              collectedDate: oldAdvance?.collectedDate || populated.startDate,
              notes: oldAdvance?.notes,
            },
            {
              id: oldApplied?.id || `pm-2-${populated.id}`,
              type: "LOAN_APPLIED",
              label: "Loan Applied",
              amount: sanctionedLoan,
              status: oldApplied?.status || "COLLECTED",
              collectedDate: oldApplied?.collectedDate,
              notes: oldApplied?.notes,
            },
            {
              id: oldApproved?.id || `pm-3-${populated.id}`,
              type: "LOAN_APPROVED",
              label: "Loan Approved",
              amount: sanctionedLoan,
              status: oldApproved?.status || "COLLECTED",
              collectedDate: oldApproved?.collectedDate,
              notes: oldApproved?.notes,
            },
            {
              id: oldFirstDisb?.id || `pm-4-${populated.id}`,
              type: "FIRST_LOAN_DISBURSAL",
              label: "First Loan Disbursal",
              amount: firstAmount,
              status: oldFirstDisb?.status || "COLLECTED",
              collectedDate: oldFirstDisb?.collectedDate,
              notes: oldFirstDisb?.notes,
            },
            {
              id: oldSecondDisb?.id || `pm-5-${populated.id}`,
              type: "SECOND_LOAN_DISBURSAL",
              label: "Second Loan Disbursal",
              amount: secondAmount,
              status: (oldSecondDisb?.status === "COLLECTED" && oldSecondDisb?.collectedDate) ? "COLLECTED" : "PENDING",
              collectedDate: oldSecondDisb?.collectedDate,
              notes: oldSecondDisb?.notes,
            },
            {
              id: `pm-6-${populated.id}`,
              type: "FULLY_PAID",
              label: "Fully Paid",
              amount: 0,
              status: "PENDING",
            },
          ];
        }
      }
    }

    // Two-stage disbursals tracking & calculations
    const firstDisbursalMs = populated.paymentMilestones.find((m) => m.type === "FIRST_LOAN_DISBURSAL");
    const secondDisbursalMs = populated.paymentMilestones.find((m) => m.type === "SECOND_LOAN_DISBURSAL");

    const firstAmount = firstDisbursalMs?.amount || 0;
    const firstStatus = firstDisbursalMs?.status || "PENDING";
    const secondAmount = secondDisbursalMs?.amount || 0;
    const secondStatus = secondDisbursalMs?.status || "PENDING";

    const firstDisbursed = firstStatus === "COLLECTED" ? firstAmount : 0;
    const secondDisbursed = secondStatus === "COLLECTED" ? secondAmount : 0;
    const totalDisbursed = firstDisbursed + secondDisbursed;
    const remainingToDisburse = Math.max(0, sanctionedLoan - totalDisbursed);

    populated.firstLoanDisbursalAmount = firstAmount;
    populated.firstLoanDisbursalStatus = firstStatus;
    populated.firstLoanDisbursalDate = firstDisbursalMs?.collectedDate || null;
    populated.firstLoanDisbursalNotes = firstDisbursalMs?.notes || null;

    populated.secondLoanDisbursalAmount = secondAmount;
    populated.secondLoanDisbursalStatus = secondStatus;
    populated.secondLoanDisbursalDate = secondDisbursalMs?.collectedDate || null;
    populated.secondLoanDisbursalNotes = secondDisbursalMs?.notes || null;

    populated.loanDisbursedAmount = totalDisbursed;
    populated.remainingLoanToDisburse = remainingToDisburse;

    // Customer payments (excluding bank loan application/approval and disbursals)
    const customerCollected = populated.paymentMilestones
      .filter((m) => m.status === "COLLECTED" && (m.type === "INITIAL_ADVANCE" || m.type === "PRE_INSTALLATION_PAYMENT" || m.type === "INSTALLATION_PAYMENT" || m.type === "FINAL_PAYMENT"))
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    populated.customerContribution = customerCollected;

    const totalCollected = customerCollected + totalDisbursed;
    const outstanding = Math.max(0, projectValue - totalCollected);
    populated.outstandingAmount = outstanding;

    const isFullyDisbursed = (mode !== "CASH") && (secondStatus === "COLLECTED" || (firstStatus === "COLLECTED" && secondAmount === 0));
    if (isFullyDisbursed) {
      populated.loanStatus = "DISBURSED";
    }

    // Sync loanDetail fields
    if (loanDetail) {
      loanDetail.firstDisbursal = {
        amount: firstAmount,
        status: firstStatus,
        disbursalDate: firstDisbursalMs?.collectedDate || null,
        notes: firstDisbursalMs?.notes || null,
      };
      loanDetail.secondDisbursal = {
        amount: secondAmount,
        status: secondStatus,
        disbursalDate: secondDisbursalMs?.collectedDate || null,
        notes: secondDisbursalMs?.notes || null,
      };
    }

    // Determine next payment milestone & fully paid status
    const fullyPaidMs = populated.paymentMilestones.find((m) => m.type === "FULLY_PAID");
    const nextPending = populated.paymentMilestones.find((m) => (m.status === "PENDING" || m.status === "DUE") && m.type !== "LOAN_APPLIED" && m.type !== "LOAN_APPROVED" && m.type !== "FULLY_PAID");

    if (outstanding <= 0 && (!nextPending || nextPending.type === "FULLY_PAID")) {
      populated.nextPaymentMilestone = "Fully Paid";
      if (fullyPaidMs) fullyPaidMs.status = "COLLECTED";
    } else {
      populated.nextPaymentMilestone = nextPending ? nextPending.label : "Fully Paid";
      if (fullyPaidMs && fullyPaidMs.status === "COLLECTED") fullyPaidMs.status = "PENDING";
    }

    // Populate strict sequential completedStages and stageHistory using reconcileProjectStages
    const stageReconciliation = reconcileProjectStages(p, data.auditLogs);
    populated.completedStages = stageReconciliation.completedStages;
    populated.stageMigrationStatus = stageReconciliation.stageMigrationStatus;
    populated.stageMigrationNotes = stageReconciliation.stageMigrationNotes;

    if (p.stageHistory && Array.isArray(p.stageHistory) && p.stageHistory.length > 0) {
      populated.stageHistory = p.stageHistory;
    } else {
      // Reconstruct stage history from audit logs where available
      const stageAuditLogs = data.auditLogs.filter(
        (a) =>
          a.entityId === p.id &&
          (a.action === "STAGE_CHANGE" || a.action === "STAGE_COMPLETED" || a.action === "STAGE_TRANSITION")
      );
      if (stageAuditLogs.length > 0) {
        populated.stageHistory = stageAuditLogs.map((log) => ({
          stage: normalizeStageId(log.oldValue || log.newValue || "BOOKING"),
          completedAt: log.createdAt,
          completedBy: log.userId,
          completedByName: log.userName,
          completionNotes: log.description,
        }));
      } else {
        // Map from verified completed stages with null legacy timestamps (no fabricated data)
        populated.stageHistory = populated.completedStages.map((st) => ({
          stage: st,
          completedAt: null,
          completedBy: null,
          completedByName: null,
          completionNotes: "Historical progress recorded prior to strict stage gating",
          isReconciled: true,
        }));
      }
    }

    return populated;
  },

  updateProjectPaymentMilestone(
    projectId: string,
    milestoneId: string,
    updates: Partial<PaymentMilestone>,
    user?: User
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    let project = this.populateProject(data.projects[idx], data);
    if (!project.paymentMilestones) return undefined;

    const msIdx = project.paymentMilestones.findIndex((m) => m.id === milestoneId);
    if (msIdx === -1) return undefined;

    const prevMilestone = { ...project.paymentMilestones[msIdx] };
    const updatedMilestone: PaymentMilestone = {
      ...prevMilestone,
      ...updates,
    };

    if (updates.status === "COLLECTED" && prevMilestone.status !== "COLLECTED" && !updatedMilestone.collectedDate) {
      updatedMilestone.collectedDate = new Date().toISOString();
    }

    project.paymentMilestones[msIdx] = updatedMilestone;

    // Sync loan status if first or second disbursal changed
    if (updatedMilestone.type === "FIRST_LOAN_DISBURSAL" && updatedMilestone.status === "COLLECTED") {
      const loanDetail = data.loanDetails.find((l) => l.projectId === projectId);
      if (loanDetail) {
        loanDetail.updatedAt = new Date().toISOString();
      }
    }
    if (updatedMilestone.type === "SECOND_LOAN_DISBURSAL" && updatedMilestone.status === "COLLECTED") {
      project.loanStatus = "DISBURSED";
      const loanDetail = data.loanDetails.find((l) => l.projectId === projectId);
      if (loanDetail) {
        loanDetail.status = "DISBURSED";
        loanDetail.updatedAt = new Date().toISOString();
      }
    }

    project.lastPaymentUpdatedAt = new Date().toISOString();

    // Recalculate summary
    project = this.populateProject(project, data);

    let auditAction = "PAYMENT_STATUS_CHANGED";
    if (updatedMilestone.type === "FIRST_LOAN_DISBURSAL" && updatedMilestone.status === "COLLECTED") {
      auditAction = "FIRST_LOAN_DISBURSAL_COLLECTED";
    } else if (updatedMilestone.type === "SECOND_LOAN_DISBURSAL" && updatedMilestone.status === "COLLECTED") {
      auditAction = "SECOND_LOAN_DISBURSAL_COLLECTED";
    }

    let auditDescription = `Updated payment milestone "${updatedMilestone.label}" status from ${prevMilestone.status} to ${updatedMilestone.status} (₹${(updatedMilestone.amount || 0).toLocaleString("en-IN")}) on ${project.projectNumber}.`;
    if (auditAction === "FIRST_LOAN_DISBURSAL_COLLECTED") {
      auditDescription = `First Loan Disbursal of ₹${(updatedMilestone.amount || 0).toLocaleString("en-IN")} collected from bank for project ${project.projectNumber} by ${user?.name || "System"}.`;
    } else if (auditAction === "SECOND_LOAN_DISBURSAL_COLLECTED") {
      auditDescription = `Second Loan Disbursal of ₹${(updatedMilestone.amount || 0).toLocaleString("en-IN")} collected from bank for project ${project.projectNumber} by ${user?.name || "System"}.`;
    }

    // Audit Log
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user?.uid || user?.id || "system",
      userName: user?.name || "System",
      userRole: user?.role || "ADMIN",
      action: auditAction,
      actionCategory: "BUSINESS",
      field: updatedMilestone.type,
      oldValue: prevMilestone.status,
      newValue: updatedMilestone.status,
      description: auditDescription,
      severity: "NORMAL",
    });

    data.projects[idx] = project;
    saveDataFile(data);
    return project;
  },

  updateProjectPaymentMode(
    projectId: string,
    paymentMode: PaymentMode,
    user?: User
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const project = data.projects[idx];
    const oldMode = project.paymentMode || "CASH";
    project.paymentMode = paymentMode;
    project.paymentMilestones = []; // Force milestone re-initialization for new mode
    project.lastPaymentUpdatedAt = new Date().toISOString();

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user?.uid || user?.id || "system",
      userName: user?.name || "System",
      userRole: user?.role || "ADMIN",
      action: "PAYMENT_MODE_CHANGED",
      actionCategory: "BUSINESS",
      field: "paymentMode",
      oldValue: oldMode,
      newValue: paymentMode,
      description: `Changed project payment mode from ${oldMode} to ${paymentMode} on ${project.projectNumber}.`,
      severity: "NORMAL",
    });

    data.projects[idx] = project;
    saveDataFile(data);
    return this.populateProject(project, data);
  },

  updateProjectStage(
    projectId: string,
    requestedNextStage: ProjectStage | undefined,
    user: User,
    comment?: string,
    confirmations?: Record<string, boolean>
  ): { success: boolean; project?: Project; error?: string; missingRequirements?: string[] } {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return { success: false, error: "Project not found" };

    const rawProject = data.projects[idx];
    const populated = this.populateProject(rawProject, data);
    const currentStage = normalizeStageId(populated.currentStage);

    // Apply any inline confirmations if provided
    if (confirmations) {
      if (
        confirmations.panelsDelivered !== undefined ||
        confirmations.inverterDelivered !== undefined ||
        confirmations.structureDelivered !== undefined ||
        confirmations.installationCompleted !== undefined
      ) {
        let instIdx = data.installationDetails.findIndex((i) => i.projectId === projectId);
        if (instIdx === -1) {
          const newInst: InstallationDetail = {
            id: `inst-${Date.now()}`,
            projectId,
            status: "IN_PROGRESS",
            checklist: [],
            photos: [],
            updatedAt: new Date().toISOString(),
          };
          data.installationDetails.push(newInst);
          instIdx = data.installationDetails.length - 1;
        }

        if (confirmations.panelsDelivered !== undefined) data.installationDetails[instIdx].panelsDelivered = confirmations.panelsDelivered;
        if (confirmations.inverterDelivered !== undefined) data.installationDetails[instIdx].inverterDelivered = confirmations.inverterDelivered;
        if (confirmations.structureDelivered !== undefined) data.installationDetails[instIdx].structureDelivered = confirmations.structureDelivered;
        if (confirmations.installationCompleted !== undefined) {
          data.installationDetails[instIdx].installationCompleted = confirmations.installationCompleted;
          if (confirmations.installationCompleted) {
            data.installationDetails[instIdx].status = "COMPLETED";
            data.installationDetails[instIdx].completionDate = new Date().toISOString();
          }
        }
        data.installationDetails[instIdx].updatedAt = new Date().toISOString();
      }

      if (
        confirmations.dcrSubmitted !== undefined ||
        confirmations.inspectionCompleted !== undefined ||
        confirmations.netMeterInstalled !== undefined
      ) {
        let ksebIdx = data.ksebDetails.findIndex((k) => k.projectId === projectId);
        if (ksebIdx === -1) {
          const newKseb: KsebDetail = {
            id: `kseb-${Date.now()}`,
            projectId,
            status: "FEASIBILITY",
            updatedAt: new Date().toISOString(),
          };
          data.ksebDetails.push(newKseb);
          ksebIdx = data.ksebDetails.length - 1;
        }

        if (confirmations.dcrSubmitted !== undefined) {
          data.ksebDetails[ksebIdx].dcrSubmitted = confirmations.dcrSubmitted;
          if (confirmations.dcrSubmitted) data.ksebDetails[ksebIdx].status = "INSPECTION";
        }
        if (confirmations.inspectionCompleted !== undefined) {
          data.ksebDetails[ksebIdx].inspectionCompleted = confirmations.inspectionCompleted;
          if (confirmations.inspectionCompleted) {
            data.ksebDetails[ksebIdx].inspectionStatus = "PASSED";
            data.ksebDetails[ksebIdx].status = "APPROVED";
          }
        }
        if (confirmations.netMeterInstalled !== undefined) {
          data.ksebDetails[ksebIdx].netMeterInstalled = confirmations.netMeterInstalled;
          if (confirmations.netMeterInstalled) {
            data.ksebDetails[ksebIdx].netMeterStatus = "INSTALLED";
            data.ksebDetails[ksebIdx].netMeterInstalledDate = new Date().toISOString();
            data.ksebDetails[ksebIdx].status = "NET_METER_INSTALLED";
          }
        }
        data.ksebDetails[ksebIdx].updatedAt = new Date().toISOString();
      }

      if (confirmations.claimed !== undefined) {
        let subIdx = data.subsidyDetails.findIndex((s) => s.projectId === projectId);
        if (subIdx === -1) {
          const newSub: SubsidyDetail = {
            id: `sub-${Date.now()}`,
            projectId,
            subsidyApplicable: true,
            status: "APPLICATION",
            updatedAt: new Date().toISOString(),
          };
          data.subsidyDetails.push(newSub);
          subIdx = data.subsidyDetails.length - 1;
        }

        data.subsidyDetails[subIdx].claimed = confirmations.claimed;
        data.subsidyDetails[subIdx].subsidySubmitted = confirmations.claimed;
        if (confirmations.claimed) data.subsidyDetails[subIdx].status = "CREDITED";
        data.subsidyDetails[subIdx].updatedAt = new Date().toISOString();
      }
    }

    // Re-populate with updated sub-objects
    const refreshedProject = this.populateProject(data.projects[idx], data);

    // Validate completion requirements of the current stage
    const validation = canCompleteStage(refreshedProject, currentStage);
    if (!validation.allowed) {
      return {
        success: false,
        error: `Cannot complete stage "${currentStage}". Required criteria missing.`,
        missingRequirements: validation.missingRequirements,
      };
    }

    const expectedNextStage = NEXT_STAGE_MAP[currentStage];
    if (!expectedNextStage && currentStage === "COMPLETED") {
      return { success: false, error: "Project is already in COMPLETED stage." };
    }

    // If requestedNextStage is passed, verify it matches strictly expectedNextStage
    if (requestedNextStage && expectedNextStage && normalizeStageId(requestedNextStage) !== normalizeStageId(expectedNextStage)) {
      return {
        success: false,
        error: `Invalid stage transition. Current stage is "${currentStage}", only next sequential stage "${expectedNextStage}" is permitted.`,
      };
    }

    const nextStage = expectedNextStage || "COMPLETED";

    // Atomically update project state
    const currentCompleted = Array.isArray(rawProject.completedStages)
      ? rawProject.completedStages
      : [];
    const updatedCompletedStages = Array.from(new Set([...currentCompleted, currentStage]));

    const currentHistory = Array.isArray(rawProject.stageHistory)
      ? rawProject.stageHistory
      : [];
    const historyEntry: StageHistoryEntry = {
      stage: currentStage,
      completedAt: new Date().toISOString(),
      completedBy: user.id,
      completedByName: user.name,
      completionNotes: comment || null,
    };
    const updatedHistory = [...currentHistory, historyEntry];

    rawProject.completedStages = updatedCompletedStages;
    rawProject.stageHistory = updatedHistory;
    rawProject.currentStage = nextStage;
    rawProject.updatedAt = new Date().toISOString();
    rawProject.stageMigrationRequired = false;

    if (nextStage === "COMPLETED") {
      rawProject.actualCompletionDate = new Date().toISOString();
      rawProject.overallStatus = "COMPLETED";
      rawProject.nextActionTitle = "Handover plant & issue commissioning certificate";
      rawProject.nextActionStatus = "COMPLETED";
    } else {
      const defaultNextActions: Record<string, string> = {
        BOOKING: "Verify booking deposit & collect customer documents",
        DOCUMENTS: "Complete document collection & KYC verification",
        LOAN_READYCASH: "Process bank loan application / verify ReadyCash self-funding",
        KSEB_FEASIBILITY: "Complete KSEB Soura portal feasibility application",
        EQUIPMENT_DELIVERED: "Deliver solar panels, inverter & BoP material",
        STRUCTURE_MATERIAL_DELIVERED: "Deliver mounting structure & hardware to site",
        INSTALLATION: "Complete physical solar PV array mounting & wiring",
        KSEB_DCR_DOCS_SUBMITTED: "Submit KSEB DCR compliance documentation",
        INSPECTION: "Coordinate KSEB electrical inspector site verification",
        NET_METER: "Coordinate bi-directional solar net meter installation",
        SUBSIDY: "Process PM Surya Ghar national portal subsidy claim",
      };
      if (defaultNextActions[nextStage]) {
        rawProject.nextActionTitle = defaultNextActions[nextStage];
        rawProject.nextActionDueDate = new Date(Date.now() + 3 * 86400000).toISOString();
        rawProject.nextActionStatus = "PENDING";
      }
    }

    // Record Audit Logs
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STAGE_COMPLETED",
      field: "completedStages",
      oldValue: currentStage,
      newValue: nextStage,
      description: `${user.name} completed stage "${currentStage}" for project ${rawProject.projectNumber}.${comment ? ` Notes: ${comment}` : ""}`,
      severity: "NORMAL",
    });

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STAGE_TRANSITION",
      field: "currentStage",
      oldValue: currentStage,
      newValue: nextStage,
      description: `Project ${rawProject.projectNumber} automatically advanced to "${nextStage}".`,
      severity: "NORMAL",
    });

    data.projects[idx] = rawProject;
    saveDataFile(data);
    return { success: true, project: this.populateProject(rawProject, data) };
  },

  overrideProjectStage(
    projectId: string,
    targetStage: ProjectStage,
    user: User,
    reason: string
  ): { success: boolean; project?: Project; error?: string } {
    if (user.role !== "SUPER_ADMIN" && user.email !== "vertxenergies@gmail.com") {
      return { success: false, error: "Only Super Admin is authorized to execute manual stage overrides." };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "A mandatory, detailed reason (minimum 5 characters) is required for stage override." };
    }

    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return { success: false, error: "Project not found" };

    const rawProject = data.projects[idx];
    const oldStage = rawProject.currentStage;
    const normTarget = normalizeStageId(targetStage);

    rawProject.currentStage = normTarget;
    rawProject.updatedAt = new Date().toISOString();
    rawProject.stageMigrationRequired = false;

    // Log SUPER_ADMIN_STAGE_OVERRIDE
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "SUPER_ADMIN_STAGE_OVERRIDE",
      actionCategory: "OVERRIDE",
      field: "currentStage",
      oldValue: oldStage,
      newValue: normTarget,
      description: `[SUPER ADMIN OVERRIDE] ${user.name} manually overrode project stage from "${oldStage}" to "${normTarget}". Reason: ${reason.trim()}`,
      severity: "WARNING",
      isOverride: true,
    });

    data.projects[idx] = rawProject;
    saveDataFile(data);
    return { success: true, project: this.populateProject(rawProject, data) };
  },

  reconcileProjectStageHistory(
    projectId: string,
    confirmedStages: ProjectStage[],
    user: User,
    reason: string
  ): { success: boolean; project?: Project; error?: string } {
    if (user.role !== "SUPER_ADMIN" && user.email !== "vertxenergies@gmail.com") {
      return { success: false, error: "Only Super Admin is authorized to execute stage history reconciliation." };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "A mandatory reconciliation reason (minimum 5 characters) is required." };
    }

    const validation = validateCompletedStages(confirmedStages);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Selected completed stages must be contiguous starting from Booking." };
    }

    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId || p.projectNumber === projectId);
    if (idx === -1) return { success: false, error: "Project not found" };

    const rawProject = data.projects[idx];
    const prevCurrentStage = rawProject.currentStage;
    const prevCompletedStages = rawProject.completedStages || [];

    const normConfirmed = confirmedStages.map(normalizeStageId);
    const confirmedCount = normConfirmed.length;
    const newCurrentStage: ProjectStage =
      confirmedCount >= 12
        ? "COMPLETED"
        : CANONICAL_PROJECT_STAGES[confirmedCount];

    rawProject.completedStages = normConfirmed;
    rawProject.currentStage = newCurrentStage;
    rawProject.stageMigrationStatus = "VERIFIED";
    rawProject.stageMigrationNotes = null;
    rawProject.stageMigrationRequired = false;
    rawProject.updatedAt = new Date().toISOString();

    // Reconstruct stage history
    rawProject.stageHistory = normConfirmed.map((st) => ({
      stage: st,
      completedAt: null,
      completedBy: user.id,
      completedByName: user.name,
      completionNotes: `Reconciled by Super Admin: ${reason.trim()}`,
      isReconciled: true,
    }));

    // Create STAGE_HISTORY_RECONCILED audit log
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: rawProject.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STAGE_HISTORY_RECONCILED",
      actionCategory: "ADMIN_MANAGEMENT",
      field: "completedStages",
      oldValue: `${prevCurrentStage} (${prevCompletedStages.length} stages)`,
      newValue: `${newCurrentStage} (${normConfirmed.length} stages)`,
      description: `Super Admin reconciled project stage history for ${rawProject.projectNumber}. Reason: ${reason.trim()}`,
      severity: "WARNING",
      isOverride: true,
    });

    data.projects[idx] = rawProject;
    saveDataFile(data);
    return { success: true, project: this.populateProject(rawProject, data) };
  },

  getProjectsNeedingReconciliation(): Project[] {
    const data = ensureDataFile();
    return data.projects
      .filter((p) => !p.deleted && (p.stageMigrationStatus === "NEEDS_REVIEW" || p.stageMigrationRequired))
      .map((p) => this.populateProject(p, data));
  },

  deleteProject(
    projectId: string,
    params: {
      reason: ProjectDeletionReason;
      details?: string;
      duplicateOfProjectId?: string;
    },
    user: User
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId || p.projectNumber === projectId);
    if (idx === -1) return undefined;

    const project = data.projects[idx];
    const cust = data.customers.find((c) => c.id === project.customerId);

    let duplicateOfProjectNumber = params.duplicateOfProjectId || null;
    if (params.duplicateOfProjectId) {
      const targetProj = data.projects.find((p) => p.id === params.duplicateOfProjectId || p.projectNumber === params.duplicateOfProjectId);
      if (targetProj) {
        duplicateOfProjectNumber = targetProj.projectNumber;
        params.duplicateOfProjectId = targetProj.id;
      }
    }

    project.deleted = true;
    project.deletedAt = new Date().toISOString();
    project.deletedByUid = user.uid || user.id;
    project.deletedByName = user.name;
    project.deletionReason = params.reason;
    project.deletionReasonDetails = params.details || null;
    project.duplicateOfProjectId = params.duplicateOfProjectId || null;
    project.updatedAt = new Date().toISOString();

    // Create immutable audit event
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: project.id,
      userId: user.uid || user.id,
      userName: user.name,
      userRole: user.role,
      action: "PROJECT_DELETED",
      actionCategory: "BUSINESS",
      field: "deleted",
      oldValue: "false",
      newValue: "true",
      description: `Project ${project.projectNumber} (${cust?.name || "Customer"}) removed from active workflow by ${user.name}. Reason: ${params.reason}${params.duplicateOfProjectId ? ` (Duplicate of ${duplicateOfProjectNumber || params.duplicateOfProjectId})` : ""}${params.details ? ` - Details: ${params.details}` : ""}`,
      severity: "WARNING",
    });

    data.projects[idx] = project;
    saveDataFile(data);
    return this.populateProject(project, data);
  },

  restoreProject(projectId: string, user: User): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId || p.projectNumber === projectId);
    if (idx === -1) return undefined;

    const project = data.projects[idx];
    const prevReason = project.deletionReason;
    const cust = data.customers.find((c) => c.id === project.customerId);

    project.deleted = false;
    project.deletedAt = null;
    project.deletedByUid = null;
    project.deletedByName = null;
    project.updatedAt = new Date().toISOString();

    // Create immutable audit event
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: project.id,
      userId: user.uid || user.id,
      userName: user.name,
      userRole: user.role,
      action: "PROJECT_RESTORED",
      actionCategory: "BUSINESS",
      field: "deleted",
      oldValue: "true",
      newValue: "false",
      description: `Project ${project.projectNumber} (${cust?.name || "Customer"}) restored to active project pipeline by ${user.name}. Previous deletion reason: ${prevReason || "None"}.`,
      severity: "WARNING",
    });

    data.projects[idx] = project;
    saveDataFile(data);
    return this.populateProject(project, data);
  },

  updateProjectNextAction(
    projectId: string,
    action: {
      title: string;
      ownerId: string;
      dueDate: string;
      status?: string;
    },
    user: User
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const current = data.projects[idx];
    const oldAction = current.nextActionTitle;

    current.nextActionTitle = action.title;
    current.nextActionOwnerId = action.ownerId;
    current.nextActionDueDate = action.dueDate;
    current.nextActionStatus = action.status || "PENDING";
    current.updatedAt = new Date().toISOString();

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "NEXT_ACTION_UPDATE",
      field: "nextActionTitle",
      oldValue: oldAction,
      newValue: action.title,
      description: `${user.name} updated Next Action to '${action.title}' (Assigned to: ${data.users.find((u) => u.id === action.ownerId)?.name || "Team"}).`,
    });

    saveDataFile(data);
    return this.populateProject(current, data);
  },

  updateProjectHealth(
    projectId: string,
    health: ProjectHealth,
    user: User,
    reason?: string
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const current = data.projects[idx];
    const oldHealth = current.overallStatus;
    current.overallStatus = health;
    current.updatedAt = new Date().toISOString();

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STATUS_UPDATE",
      field: "overallStatus",
      oldValue: oldHealth,
      newValue: health,
      description: `${user.name} updated health status to ${health}.${reason ? ` Reason: ${reason}` : ""}`,
    });

    saveDataFile(data);
    return this.populateProject(current, data);
  },

  // Documents
  getDocuments(projectId: string): ProjectDocument[] {
    const data = ensureDataFile();
    return data.documents
      .filter((d) => d.projectId === projectId)
      .map((doc) => ({
        ...doc,
        updatedBy: data.users.find((u) => u.id === doc.updatedById),
      }));
  },

  updateDocument(
    docId: string,
    updates: Partial<ProjectDocument>,
    user: User
  ): ProjectDocument | undefined {
    const data = ensureDataFile();
    const idx = data.documents.findIndex((d) => d.id === docId);
    if (idx === -1) return undefined;

    const current = data.documents[idx];
    const updated: ProjectDocument = {
      ...current,
      ...updates,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status && updates.status !== current.status) {
      const formatStatus = (s: string) => {
        if (s === "COLLECTED") return "Collected";
        if (s === "NOT_REQUIRED") return "Not Required";
        return "Pending";
      };

      this.createAuditLog({
        entityType: "DOCUMENT",
        entityId: current.projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: current.status,
        newValue: updates.status,
        description: `${user.name} changed ${current.title} FROM: ${formatStatus(current.status)} TO: ${formatStatus(updates.status)}`,
      });
    }

    data.documents[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Duties
  getDuties(filters?: { assignedTo?: string; status?: string; projectId?: string }): Duty[] {
    const data = ensureDataFile();
    let duties = [...(data.duties || [])];

    if (filters?.assignedTo && filters.assignedTo !== "ALL") {
      duties = duties.filter((d) => d.assignedTo === filters.assignedTo);
    }
    if (filters?.status && filters.status !== "ALL") {
      duties = duties.filter((d) => d.status === filters.status);
    }
    if (filters?.projectId) {
      duties = duties.filter((d) => d.projectId === filters.projectId);
    }

    return duties.map((d) => ({
      ...d,
      assignedUser: data.users.find((u) => u.id === d.assignedTo),
      assignedByUser: data.users.find((u) => u.id === d.assignedBy),
      project: d.projectId ? data.projects.find((p) => p.id === d.projectId) : null,
      lead: d.leadId ? data.leads.find((l) => l.id === d.leadId) : null,
      customer: d.customerId ? data.customers.find((c) => c.id === d.customerId) : null,
    }));
  },

  createDuty(duty: Omit<Duty, "id" | "createdAt" | "updatedAt">, user: User): Duty {
    const data = ensureDataFile();
    if (!data.duties) data.duties = [];

    const newDuty: Duty = {
      ...duty,
      id: `duty-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.duties.push(newDuty);

    this.createAuditLog({
      entityType: "DUTY",
      entityId: newDuty.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "DUTY_ASSIGNED",
      description: `${user.name} assigned duty '${newDuty.title}' to ${data.users.find((u) => u.id === newDuty.assignedTo)?.name || "Employee"}`,
    });

    saveDataFile(data);
    return newDuty;
  },

  updateDuty(dutyId: string, updates: Partial<Duty>, user: User): Duty | undefined {
    const data = ensureDataFile();
    if (!data.duties) data.duties = [];

    const idx = data.duties.findIndex((d) => d.id === dutyId);
    if (idx === -1) return undefined;

    const current = data.duties[idx];
    const updated: Duty = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === "COMPLETED" && current.status !== "COMPLETED") {
      updated.completedAt = new Date().toISOString();
      this.createAuditLog({
        entityType: "DUTY",
        entityId: dutyId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "DUTY_COMPLETED",
        description: `${user.name} marked duty '${current.title}' as COMPLETED`,
      });
    }

    data.duties[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Stage Trackers
  updateLoanDetail(projectId: string, updates: Partial<LoanDetail>, user: User): LoanDetail {
    const data = ensureDataFile();
    let loan = data.loanDetails.find((l) => l.projectId === projectId);

    if (!loan) {
      loan = {
        id: `loan-${Date.now()}`,
        projectId,
        loanRequired: true,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.loanDetails.push(loan);
    }

    const oldStatus = loan.status;
    Object.assign(loan, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "LOAN",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed Loan status from ${oldStatus} to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return loan;
  },

  updateKsebDetail(projectId: string, updates: Partial<KsebDetail>, user: User): KsebDetail {
    const data = ensureDataFile();
    let kseb = data.ksebDetails.find((k) => k.projectId === projectId);

    if (!kseb) {
      kseb = {
        id: `kseb-${Date.now()}`,
        projectId,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.ksebDetails.push(kseb);
    }

    const oldStatus = kseb.status;
    Object.assign(kseb, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "KSEB",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed KSEB status from ${oldStatus} to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return kseb;
  },

  updateInstallationDetail(projectId: string, updates: Partial<InstallationDetail>, user: User): InstallationDetail {
    const data = ensureDataFile();
    let inst = data.installationDetails.find((i) => i.projectId === projectId);

    if (!inst) {
      inst = {
        id: `inst-${Date.now()}`,
        projectId,
        status: "NOT_STARTED",
        checklist: [],
        photos: [],
        updatedAt: new Date().toISOString(),
      };
      data.installationDetails.push(inst);
    }

    const oldStatus = inst.status;
    Object.assign(inst, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "INSTALLATION",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed Installation status to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return inst;
  },

  updateSubsidyDetail(projectId: string, updates: Partial<SubsidyDetail>, user: User): SubsidyDetail {
    const data = ensureDataFile();
    let sub = data.subsidyDetails.find((s) => s.projectId === projectId);

    if (!sub) {
      sub = {
        id: `sub-${Date.now()}`,
        projectId,
        subsidyApplicable: true,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.subsidyDetails.push(sub);
    }

    const oldStatus = sub.status;
    Object.assign(sub, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "SUBSIDY",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed PM Surya Ghar Subsidy status to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return sub;
  },

  // Follow-ups
  getFollowUps(filters?: { status?: string; assignedUserId?: string; category?: "overdue" | "today" | "upcoming" }): FollowUp[] {
    const data = ensureDataFile();
    let list = [...data.followUps];

    if (filters?.status) {
      list = list.filter((f) => f.status === filters.status);
    }
    if (filters?.assignedUserId) {
      list = list.filter((f) => f.assignedUserId === filters.assignedUserId);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    if (filters?.category === "overdue") {
      list = list.filter((f) => f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart);
    } else if (filters?.category === "today") {
      list = list.filter((f) => {
        const time = new Date(f.dueDate).getTime();
        return f.status === "PENDING" && time >= todayStart && time < todayEnd;
      });
    } else if (filters?.category === "upcoming") {
      list = list.filter((f) => {
        const time = new Date(f.dueDate).getTime();
        return f.status === "PENDING" && time >= todayEnd;
      });
    }

    return list.map((f) => ({
      ...f,
      assignedUser: data.users.find((u) => u.id === f.assignedUserId),
      lead: f.leadId ? data.leads.find((l) => l.id === f.leadId) : null,
      customer: f.customerId ? data.customers.find((c) => c.id === f.customerId) : null,
      project: f.projectId ? data.projects.find((p) => p.id === f.projectId) : null,
    }));
  },

  createFollowUp(input: Omit<FollowUp, "id" | "createdAt" | "updatedAt">): FollowUp {
    const data = ensureDataFile();
    const newFlw: FollowUp = {
      ...input,
      id: `flw-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.followUps.push(newFlw);
    saveDataFile(data);
    return newFlw;
  },

  updateFollowUp(id: string, updates: Partial<FollowUp>): FollowUp | undefined {
    const data = ensureDataFile();
    const idx = data.followUps.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;

    const updated: FollowUp = {
      ...data.followUps[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status === "COMPLETED") {
      updated.completedAt = new Date().toISOString();
    }
    data.followUps[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Tasks
  getTasks(filters?: { projectId?: string; assignedUserId?: string; status?: string }): Task[] {
    const data = ensureDataFile();
    let tasks = [...data.tasks];

    if (filters?.projectId) {
      tasks = tasks.filter((t) => t.projectId === filters.projectId);
    }
    if (filters?.assignedUserId) {
      tasks = tasks.filter((t) => t.assignedUserId === filters.assignedUserId);
    }
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    return tasks.map((t) => ({
      ...t,
      assignedUser: data.users.find((u) => u.id === t.assignedUserId),
      project: t.projectId ? data.projects.find((p) => p.id === t.projectId) : null,
      customer: t.customerId ? data.customers.find((c) => c.id === t.customerId) : null,
    }));
  },

  createTask(input: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const data = ensureDataFile();
    const newTask: Task = {
      ...input,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.tasks.push(newTask);
    saveDataFile(data);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const data = ensureDataFile();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;

    const updated: Task = {
      ...data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status === "COMPLETED") {
      updated.completedAt = new Date().toISOString();
    }
    data.tasks[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Audit Logs
  getAuditLogs(filters?: { entityType?: string; entityId?: string }): AuditLog[] {
    const data = ensureDataFile();
    let logs = [...data.auditLogs];

    if (filters?.entityType && filters?.entityId) {
      logs = logs.filter((l) => l.entityType === filters.entityType && l.entityId === filters.entityId);
    } else if (filters?.entityId) {
      logs = logs.filter((l) => l.entityId === filters.entityId);
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createAuditLog(log: Omit<AuditLog, "id" | "createdAt">): AuditLog {
    const data = ensureDataFile();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(newLog);
    saveDataFile(data);
    return newLog;
  },

  // Notifications
  getNotifications(userId?: string): Notification[] {
    const data = ensureDataFile();
    let notifs = [...data.notifications];
    if (userId) {
      notifs = notifs.filter((n) => n.userId === userId || n.userId === "usr-super-admin");
    }
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(id: string): void {
    const data = ensureDataFile();
    const n = data.notifications.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      saveDataFile(data);
    }
  },

  // Notes
  getNotes(entityType: string, entityId: string): Note[] {
    const data = ensureDataFile();
    return data.notes
      .filter((n) => n.entityType === entityType && n.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createNote(input: Omit<Note, "id" | "createdAt">): Note {
    const data = ensureDataFile();
    const newNote: Note = {
      ...input,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.notes.unshift(newNote);
    saveDataFile(data);
    return newNote;
  },

  // Dashboard Stats & Needs Attention
  getDashboardStats(): DashboardStats {
    const data = ensureDataFile();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;
    const activeProjectsData = data.projects.filter((p) => p.deleted !== true);

    const totalLeads = data.leads.length;
    const newLeads = data.leads.filter((l) => l.currentStage === "NEW_LEAD").length;
    const activeProjects = activeProjectsData.filter((p) => p.currentStage !== "COMPLETED" && p.overallStatus !== "CANCELLED").length;
    const completedProjects = activeProjectsData.filter((p) => p.currentStage === "COMPLETED").length;

    const followUpsToday = data.followUps.filter((f) => {
      const time = new Date(f.dueDate).getTime();
      return f.status === "PENDING" && time >= todayStart && time < todayEnd;
    }).length;

    const overdueFollowUps = data.followUps.filter((f) => {
      const time = new Date(f.dueDate).getTime();
      return f.status === "PENDING" && time < todayStart;
    }).length;

    const projectsAtRisk = activeProjectsData.filter((p) => p.overallStatus === "AT_RISK").length;
    const projectsDelayed = activeProjectsData.filter((p) => p.overallStatus === "DELAYED").length;

    const totalCapacityKwSold = activeProjectsData.reduce((sum, p) => sum + (p.systemSizeKw || 0), 0);

    // Leads by Stage
    const leadStageOrder: { stage: LeadStage; label: string }[] = [
      { stage: "NEW_LEAD", label: "New Lead" },
      { stage: "CONTACTED", label: "Contacted" },
      { stage: "QUALIFIED", label: "Qualified" },
      { stage: "SITE_SURVEY", label: "Site Survey" },
      { stage: "QUOTATION", label: "Quotation" },
      { stage: "NEGOTIATION", label: "Negotiation" },
      { stage: "BOOKED", label: "Booked" },
      { stage: "LOST", label: "Lost" },
    ];
    const leadsByStage = leadStageOrder.map((item) => ({
      ...item,
      count: data.leads.filter((l) => l.currentStage === item.stage).length,
    }));

    // Projects by Stage (Active projects only)
    const projectsByStage = PROJECT_STAGES_CONFIG.map((stage) => ({
      stage: stage.id,
      label: stage.shortLabel,
      count: activeProjectsData.filter((p) => p.currentStage === stage.id).length,
    }));

    // Needs Attention List
    const needsAttention: DashboardStats["needsAttention"] = [];

    // 1. Overdue Follow-ups
    data.followUps
      .filter((f) => f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart)
      .forEach((f) => {
        const lead = f.leadId ? data.leads.find((l) => l.id === f.leadId) : null;
        const cust = f.customerId ? data.customers.find((c) => c.id === f.customerId) : null;
        const name = lead?.customerName || cust?.name || "Client";
        needsAttention.push({
          id: f.id,
          type: "OVERDUE_FOLLOWUP",
          severity: "CRITICAL",
          title: `Overdue Follow-up: ${name} (${f.actionType})`,
          subtitle: f.notes || "Follow-up deadline elapsed",
          dueText: `Due: ${new Date(f.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
          entityType: "FOLLOWUP",
          entityId: f.id,
          linkUrl: "/followups",
        });
      });

    // 2. Overdue Next Actions / Tasks on Projects (Active projects only)
    activeProjectsData
      .filter((p) => p.nextActionDueDate && new Date(p.nextActionDueDate).getTime() < todayStart && p.nextActionStatus !== "COMPLETED")
      .forEach((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        needsAttention.push({
          id: `na-${p.id}`,
          type: "OVERDUE_TASK",
          severity: "CRITICAL",
          title: `Overdue Next Action: ${p.nextActionTitle}`,
          subtitle: `Project #${p.projectNumber} - ${cust?.name || "Customer"} (${p.systemSizeKw} kW)`,
          dueText: `Overdue since ${new Date(p.nextActionDueDate!).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
          entityType: "PROJECT",
          entityId: p.id,
          linkUrl: `/projects/${p.id}`,
        });
      });

    // 3. Projects Delayed or At Risk (Active projects only)
    activeProjectsData
      .filter((p) => p.overallStatus === "DELAYED")
      .forEach((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        needsAttention.push({
          id: `del-${p.id}`,
          type: "OVERDUE_KSEB",
          severity: "CRITICAL",
          title: `Delayed Project: #${p.projectNumber} (${cust?.name})`,
          subtitle: `Stage: ${p.currentStage} | Priority: ${p.priority}`,
          dueText: "Immediate management review needed",
          entityType: "PROJECT",
          entityId: p.id,
          linkUrl: `/projects/${p.id}`,
        });
      });

    // 4. Projects stuck waiting for documents (Active projects only)
    activeProjectsData
      .filter((p) => p.currentStage === "DOCUMENTS" || p.currentStage === "BOOKING")
      .forEach((p) => {
        const pendingDocs = data.documents.filter(
          (d) => d.projectId === p.id && d.isRequired && d.status === "PENDING"
        );
        if (pendingDocs.length > 0) {
          const cust = data.customers.find((c) => c.id === p.customerId);
          needsAttention.push({
            id: `doc-pend-${p.id}`,
            type: "PENDING_DOCS",
            severity: "WARNING",
            title: `Pending Documents: ${cust?.name} (${pendingDocs.length} remaining)`,
            subtitle: `Project #${p.projectNumber} awaiting required customer documents`,
            dueText: "Awaiting Uploads",
            entityType: "PROJECT",
            entityId: p.id,
            linkUrl: `/projects/${p.id}?tab=documents`,
          });
        }
      });

    // 5. High-Risk Projects
    activeProjectsData
      .filter((p) => p.overallStatus === "AT_RISK")
      .forEach((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        needsAttention.push({
          id: `risk-${p.id}`,
          type: "OVERDUE_TASK",
          severity: "WARNING",
          title: `At-Risk Project: #${p.projectNumber} (${cust?.name})`,
          subtitle: `Stage: ${p.currentStage} | Needs attention`,
          dueText: "Review project milestones",
          entityType: "PROJECT",
          entityId: p.id,
          linkUrl: `/projects/${p.id}`,
        });
      });

    return {
      totalLeads,
      newLeads,
      activeProjects,
      completedProjects,
      followUpsToday,
      overdueFollowUps,
      projectsAtRisk,
      projectsDelayed,
      totalCapacityKwSold,
      leadsByStage,
      projectsByStage,
      needsAttention,
    };
  },

  // Global Search
  searchGlobal(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { customers: [], projects: [], leads: [], tasks: [] };

    const data = ensureDataFile();

    const customers = data.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customerNumber.toLowerCase().includes(q) ||
          (c.ksebConsumerNumber && c.ksebConsumerNumber.includes(q)) ||
          c.district.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const projects = data.projects
      .filter((p) => {
        if (p.deleted === true) return false;
        const cust = data.customers.find((c) => c.id === p.customerId);
        const kseb = data.ksebDetails.find((k) => k.projectId === p.id);
        const loan = data.loanDetails.find((l) => l.projectId === p.id);
        return (
          p.projectNumber.toLowerCase().includes(q) ||
          (cust && (cust.name.toLowerCase().includes(q) || cust.phone.includes(q))) ||
          (kseb && (kseb.consumerNumber?.includes(q) || kseb.applicationNumber?.toLowerCase().includes(q))) ||
          (loan && loan.applicationNumber?.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map((p) => this.populateProject(p, data));

    const leads = data.leads
      .filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.leadNumber.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const tasks = data.tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 5);

    return { customers, projects, leads, tasks };
  },

  // Clear all dummy customer & operational data, preserve users
  clearAllCustomersAndData(): void {
    const data = ensureDataFile();
    data.customers = [];
    data.projects = [];
    data.leads = [];
    data.documents = [];
    data.loanDetails = [];
    data.ksebDetails = [];
    data.installationDetails = [];
    data.subsidyDetails = [];
    data.followUps = [];
    data.tasks = [];
    data.duties = [];
    data.notes = [];
    data.auditLogs = [];
    data.notifications = [];
    saveDataFile(data);
  },

  // Reset demo
  resetDemoData(): void {
    const seed = generateSeedData();
    saveDataFile(seed);
  },

  // ==========================================
  // SUPER ADMIN OPERATIONS & GLOBAL AUDIT
  // ==========================================

  getSuperAdminStats(): SuperAdminStats {
    const data = ensureDataFile();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const totalEmployees = data.users.length;
    const pendingApprovalsCount = data.users.filter((u) => u.approvalStatus === "PENDING").length;
    const activeEmployees = data.users.filter((u) => (u.status === "ACTIVE" || (u.status === undefined && u.active !== false)) && u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED").length;
    const inactiveEmployees = data.users.filter((u) => (u.status === "INACTIVE" || (u.status === undefined && u.active === false)) && u.approvalStatus !== "PENDING").length;
    const suspendedEmployees = data.users.filter((u) => u.status === "SUSPENDED").length;

    const activeAdmins = data.users.filter(
      (u) => (u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.status !== "INACTIVE" && u.status !== "SUSPENDED" && u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED"
    ).length;

    const activeProjects = data.projects.filter(
      (p) => p.currentStage !== "COMPLETED" && p.currentStage !== "CANCELLED"
    ).length;

    const delayedProjects = data.projects.filter((p) => p.overallStatus === "DELAYED").length;

    const overdueDuties = data.duties.filter(
      (d) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && new Date(d.dueDate) < now
    ).length;

    const overdueTasks = data.tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < now
    ).length;

    const todayFollowUps = data.followUps.filter(
      (f) => f.status === "PENDING" && f.dueDate && f.dueDate.startsWith(todayStr)
    ).length;

    const recentSecurityEventsCount = data.auditLogs.filter((l) => l.actionCategory === "SECURITY").length;
    const recentAdminActionsCount = data.auditLogs.filter((l) => l.userRole === "ADMIN").length;

    return {
      totalEmployees: data.users.filter((u) => u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED").length,
      activeEmployees,
      inactiveEmployees,
      suspendedEmployees,
      pendingApprovalsCount,
      activeAdmins,
      activeProjects,
      delayedProjects,
      overdueDuties,
      overdueTasks,
      todayFollowUps,
      recentSecurityEventsCount,
      recentAdminActionsCount,
    };
  },

  getEmployeesWithWorkload(filters?: {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): EmployeeWorkloadSummary[] {
    const data = ensureDataFile();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    let users = data.users.filter((u) => u.approvalStatus === "APPROVED" || u.superAdmin === true || u.role === "SUPER_ADMIN");

    if (filters?.role && filters.role !== "ALL") {
      users = users.filter((u) => u.role === filters.role);
    }
    if (filters?.department && filters.department !== "ALL") {
      users = users.filter((u) => u.department === filters.department);
    }
    if (filters?.status && filters.status !== "ALL") {
      users = users.filter((u) => (u.status || (u.active ? "ACTIVE" : "INACTIVE")) === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeCode.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }

    return users.map((user) => {
      const activeLeadsCount = data.leads.filter(
        (l) => l.assignedSalespersonId === user.uid && l.currentStage !== "BOOKED" && l.currentStage !== "LOST"
      ).length;

      const activeProjectsCount = data.projects.filter(
        (p) =>
          (p.projectManagerId === user.uid ||
            p.salespersonId === user.uid ||
            p.siteSupervisorId === user.uid ||
            p.currentStageOwnerId === user.uid) &&
          p.currentStage !== "COMPLETED" &&
          p.currentStage !== "CANCELLED"
      ).length;

      const userDuties = data.duties.filter((d) => d.assignedTo === user.uid);
      const openDutiesCount = userDuties.filter((d) => d.status !== "COMPLETED" && d.status !== "CANCELLED").length;
      const overdueDutiesCount = userDuties.filter(
        (d) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && new Date(d.dueDate) < now
      ).length;

      const userTasks = data.tasks.filter((t) => t.assignedUserId === user.uid);
      const todayTasksCount = userTasks.filter((t) => t.status !== "COMPLETED" && t.dueDate.startsWith(todayStr)).length;
      const upcomingTasksCount = userTasks.filter(
        (t) => t.status !== "COMPLETED" && new Date(t.dueDate) > now && !t.dueDate.startsWith(todayStr)
      ).length;
      const completedTasksCount = userTasks.filter((t) => t.status === "COMPLETED").length;

      // Effective permissions: Base + Grants - Denials
      const basePerms = user.role && ROLES_CONFIG[user.role] ? ROLES_CONFIG[user.role].permissions : [];
      const grants = user.customPermissions?.grants || [];
      const denials = new Set(user.customPermissions?.denials || []);
      const effectivePermsSet = new Set<Permission>([...basePerms, ...grants]);
      denials.forEach((d) => effectivePermsSet.delete(d));

      return {
        user: {
          ...user,
          status: user.status || (user.active ? "ACTIVE" : "INACTIVE"),
        },
        activeLeadsCount,
        activeProjectsCount,
        openDutiesCount,
        overdueDutiesCount,
        todayTasksCount,
        upcomingTasksCount,
        completedTasksCount,
        effectivePermissions: Array.from(effectivePermsSet),
      };
    });
  },

  getEmployeeWorkloadDetail(uid: string): {
    summary: EmployeeWorkloadSummary;
    projects: Project[];
    leads: Lead[];
    duties: Duty[];
    tasks: Task[];
    recentActivity: AuditLog[];
  } | null {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) return null;

    const summaries = this.getEmployeesWithWorkload();
    const summary = summaries.find((s) => s.user.uid === user.uid) || {
      user,
      activeLeadsCount: 0,
      activeProjectsCount: 0,
      openDutiesCount: 0,
      overdueDutiesCount: 0,
      todayTasksCount: 0,
      upcomingTasksCount: 0,
      completedTasksCount: 0,
      effectivePermissions: user.role && ROLES_CONFIG[user.role] ? ROLES_CONFIG[user.role].permissions : [],
    };

    const projects = data.projects.filter(
      (p) =>
        p.projectManagerId === user.uid ||
        p.salespersonId === user.uid ||
        p.siteSupervisorId === user.uid ||
        p.currentStageOwnerId === user.uid
    );

    const leads = data.leads.filter((l) => l.assignedSalespersonId === user.uid);
    const duties = data.duties.filter((d) => d.assignedTo === user.uid);
    const tasks = data.tasks.filter((t) => t.assignedUserId === user.uid);

    const recentActivity = data.auditLogs
      .filter((a) => a.userId === user.uid || a.targetUserId === user.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return {
      summary,
      projects,
      leads,
      duties,
      tasks,
      recentActivity,
    };
  },

  updateEmployeeStatus(
    uid: string,
    newStatus: EmployeeStatus,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Self-Protection check
    if (targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") {
      if (actor.uid === targetUser.uid && newStatus !== "ACTIVE") {
        return { success: false, error: "Super Administrator cannot demote or deactivate their own account." };
      }
      if (actor.role !== "SUPER_ADMIN") {
        return { success: false, error: "ADMIN accounts cannot modify a Super Administrator account." };
      }
    }

    const oldStatus = targetUser.status || (targetUser.active ? "ACTIVE" : "INACTIVE");
    targetUser.status = newStatus;
    targetUser.active = newStatus === "ACTIVE";
    targetUser.updatedAt = new Date().toISOString();

    // Log security audit event
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: newStatus === "SUSPENDED" ? "USER_SUSPENDED" : newStatus === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
      description: `${actor.name} changed status of ${targetUser.name} from ${oldStatus} to ${newStatus}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: newStatus === "SUSPENDED" ? "WARNING" : "NORMAL",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  changeEmployeeRole(
    uid: string,
    newRole: Role,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Only existing Super Admin can grant SUPER_ADMIN
    if (newRole === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only an existing Super Administrator can grant Super Admin privileges." };
    }

    // Super Admin cannot self-demote
    if ((targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") && actor.uid === targetUser.uid && newRole !== "SUPER_ADMIN") {
      return { success: false, error: "Super Administrator cannot remove their own Super Admin privileges." };
    }

    // Admin cannot modify Super Admin
    if ((targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") && actor.role !== "SUPER_ADMIN") {
      return { success: false, error: "ADMIN accounts cannot modify a Super Administrator account." };
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.roleId = newRole;
    targetUser.superAdmin = newRole === "SUPER_ADMIN";
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "ROLE_CHANGED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      field: "role",
      oldValue: oldRole,
      newValue: newRole,
      description: `${actor.name} changed role of ${targetUser.name} from ${oldRole} to ${newRole}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  updateEmployeeProfile(
    uid: string,
    updates: Partial<User>,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Restrict protected fields from direct profile patch
    if (updates.role && updates.role !== targetUser.role) {
      return this.changeEmployeeRole(uid, updates.role, actor);
    }

    if (updates.name) targetUser.name = updates.name;
    if (updates.phone) targetUser.phone = updates.phone;
    if (updates.department) targetUser.department = updates.department;
    if (updates.designation) targetUser.designation = updates.designation;
    if (updates.employeeCode) targetUser.employeeCode = updates.employeeCode;
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} updated profile details for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  updateEmployeePermissions(
    uid: string,
    customPermissions: CustomPermissionOverrides,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];
    targetUser.customPermissions = customPermissions;
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "PERMISSION_CHANGED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} updated custom permission overrides for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  forceLogoutUser(
    uid: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const targetUser = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!targetUser) {
      return { success: false, error: "Employee not found." };
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "FORCE_LOGOUT",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} forced logout and revoked active sessions for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true };
  },

  reassignWorkAsSuperAdmin(
    type: "PROJECT" | "LEAD" | "DUTY",
    entityId: string,
    newOwnerId: string,
    reason: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const newOwner = data.users.find((u) => u.uid === newOwnerId || u.id === newOwnerId);
    if (!newOwner) {
      return { success: false, error: "Target employee not found." };
    }

    let oldOwnerName = "Unassigned";
    let entityTitle = entityId;

    if (type === "PROJECT") {
      const proj = data.projects.find((p) => p.id === entityId);
      if (!proj) return { success: false, error: "Project not found." };
      const oldOwner = data.users.find((u) => u.uid === proj.projectManagerId);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = proj.projectNumber;
      proj.projectManagerId = newOwner.uid;
      proj.updatedAt = new Date().toISOString();
    } else if (type === "LEAD") {
      const lead = data.leads.find((l) => l.id === entityId);
      if (!lead) return { success: false, error: "Lead not found." };
      const oldOwner = data.users.find((u) => u.uid === lead.assignedSalespersonId);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = `${lead.leadNumber} (${lead.customerName})`;
      lead.assignedSalespersonId = newOwner.uid;
      lead.updatedAt = new Date().toISOString();
    } else if (type === "DUTY") {
      const duty = data.duties.find((d) => d.id === entityId);
      if (!duty) return { success: false, error: "Duty not found." };
      const oldOwner = data.users.find((u) => u.uid === duty.assignedTo);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = duty.title;
      duty.assignedTo = newOwner.uid;
      duty.updatedAt = new Date().toISOString();
    }

    // Server generates explicit SUPER_ADMIN_OVERRIDE audit record
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: type,
      entityId,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "REASSIGN",
      actionCategory: "OVERRIDE",
      targetUserId: newOwner.uid,
      targetUserName: newOwner.name,
      oldValue: oldOwnerName,
      newValue: newOwner.name,
      isOverride: true,
      description: `SUPER_ADMIN_OVERRIDE: ${actor.name} reassigned ${type} ${entityTitle} from ${oldOwnerName} to ${newOwner.name}. Reason: ${reason || "Super Admin Operational Override"}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true };
  },

  getGlobalActivity(options: {
    page?: number;
    limit?: number;
    userId?: string;
    role?: string;
    action?: string;
    actionCategory?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): { logs: AuditLog[]; total: number; hasMore: boolean } {
    const data = ensureDataFile();
    let logs = [...data.auditLogs];

    if (options.userId && options.userId !== "ALL") {
      logs = logs.filter((l) => l.userId === options.userId || l.targetUserId === options.userId);
    }
    if (options.role && options.role !== "ALL") {
      logs = logs.filter((l) => l.userRole === options.role);
    }
    if (options.action && options.action !== "ALL") {
      logs = logs.filter((l) => l.action === options.action);
    }
    if (options.actionCategory && options.actionCategory !== "ALL") {
      logs = logs.filter((l) => l.actionCategory === options.actionCategory);
    }
    if (options.entityType && options.entityType !== "ALL") {
      logs = logs.filter((l) => l.entityType === options.entityType);
    }
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() >= start);
    }
    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() <= end);
    }

    const total = logs.length;
    const page = options.page || 1;
    const limit = options.limit || 25;
    const startIndex = (page - 1) * limit;
    const pagedLogs = logs.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return { logs: pagedLogs, total, hasMore };
  },

  getAdminActivity(options: { page?: number; limit?: number; startDate?: string; endDate?: string }): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    return this.getGlobalActivity({
      ...options,
      role: "ADMIN",
    });
  },

  getSecurityEvents(options: { page?: number; limit?: number; startDate?: string; endDate?: string }): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    return this.getGlobalActivity({
      ...options,
      actionCategory: "SECURITY",
    });
  },

  bulkEmployeeOperation(
    operation: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "CHANGE_ROLE",
    userIds: string[],
    newRole?: Role,
    actor?: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { modifiedCount: number; errors: string[] } {
    const act = actor || { uid: "usr-super-admin", name: "Super Administrator", role: "SUPER_ADMIN" };
    let modifiedCount = 0;
    const errors: string[] = [];

    for (const uid of userIds) {
      if (operation === "ACTIVATE" || operation === "DEACTIVATE" || operation === "SUSPEND") {
        const status: EmployeeStatus = operation === "ACTIVATE" ? "ACTIVE" : operation === "SUSPEND" ? "SUSPENDED" : "INACTIVE";
        const res = this.updateEmployeeStatus(uid, status, act);
        if (res.success) modifiedCount++;
        else errors.push(`${uid}: ${res.error}`);
      } else if (operation === "CHANGE_ROLE" && newRole) {
        const res = this.changeEmployeeRole(uid, newRole, act);
        if (res.success) modifiedCount++;
        else errors.push(`${uid}: ${res.error}`);
      }
    }

    return { modifiedCount, errors };
  },

  // ==========================================
  // EMPLOYEE SELF-REGISTRATION & APPROVAL
  // ==========================================

  registerEmployee(input: {
    uid?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    employeeCode?: string;
  }): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const existing = data.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() || (input.uid && (u.uid === input.uid || u.id === input.uid))
    );

    if (existing) {
      if (existing.approvalStatus === "PENDING") {
        return { success: false, error: "An account with this email is already awaiting administrator approval." };
      }
      return { success: false, error: "An account with this email address already exists." };
    }

    const uid = input.uid || `usr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newUser: User = {
      id: uid,
      uid,
      employeeCode: input.employeeCode?.trim() || "PENDING",
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: null,
      roleId: null,
      superAdmin: false,
      approvalStatus: "PENDING",
      department: input.department.trim(),
      designation: input.designation.trim(),
      active: false,
      status: "INACTIVE",
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.users.push(newUser);

    // Generate Super Admin notification
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: "usr-super-admin",
      title: "New Employee Registration",
      message: `${newUser.name} has registered for a VERTX ENERGIES employee account (${newUser.department} - ${newUser.designation}).`,
      type: "INFO",
      linkUrl: "/super-admin/approvals",
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: newUser.uid,
      userId: newUser.uid,
      userName: newUser.name,
      userRole: "PENDING_REGISTRATION",
      action: "CREATE",
      actionCategory: "USER_MANAGEMENT",
      targetUserId: newUser.uid,
      targetUserName: newUser.name,
      description: `${newUser.name} (${newUser.email}) submitted registration for ${newUser.department} (${newUser.designation}). Awaiting Super Admin approval.`,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user: newUser };
  },

  getApprovalQueue(filterStatus?: ApprovalStatus): User[] {
    const data = ensureDataFile();
    let queue = data.users.filter((u) => !u.superAdmin && u.role !== "SUPER_ADMIN");
    if (filterStatus) {
      queue = queue.filter((u) => u.approvalStatus === filterStatus);
    }
    return queue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  approveEmployeeRegistration(
    uid: string,
    role: Role,
    employeeCode: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    if (role === "SUPER_ADMIN") {
      return { success: false, error: "SUPER_ADMIN role cannot be assigned through standard registration approval." };
    }

    user.approvalStatus = "APPROVED";
    user.status = "ACTIVE";
    user.active = true;
    user.role = role;
    user.roleId = role;
    if (employeeCode?.trim()) {
      user.employeeCode = employeeCode.trim();
    }
    user.approvedAt = new Date().toISOString();
    user.approvedBy = actor.name;
    user.rejectionReason = null;
    user.updatedAt = new Date().toISOString();

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "PENDING",
      newValue: `APPROVED (Role: ${role}, Code: ${user.employeeCode})`,
      description: `${actor.name} approved employee registration for ${user.name} and assigned role ${role} (Employee Code: ${user.employeeCode}).`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    // Notification for user
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      title: "Account Approved",
      message: `Your VERTX ENERGIES CRM account has been approved with role ${role}. You now have full operational access.`,
      type: "SUCCESS",
      linkUrl: "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    saveDataFile(data);
    return { success: true, user };
  },

  rejectEmployeeRegistration(
    uid: string,
    rejectionReason: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    user.approvalStatus = "REJECTED";
    user.status = "INACTIVE";
    user.active = false;
    user.rejectionReason = rejectionReason?.trim() || "Registration was not approved by administration.";
    user.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "PENDING",
      newValue: "REJECTED",
      description: `${actor.name} rejected employee registration for ${user.name}. Reason: ${user.rejectionReason}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user };
  },

  reopenEmployeeRegistration(
    uid: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    user.approvalStatus = "PENDING";
    user.status = "INACTIVE";
    user.active = false;
    user.rejectionReason = null;
    user.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "REJECTED",
      newValue: "PENDING",
      description: `${actor.name} reopened rejected registration for ${user.name} to PENDING approval.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user };
  },
};

export { db as storage };
