import { NextRequest } from "next/server";
import { User, Project, Lead, Customer, Role } from "@/types";
import { db } from "@/lib/storage";
import { verifyAuthToken, getUserFromFirestore, getUserByEmailFromFirestore } from "@/lib/firebase/admin";

/**
 * Resolves and verifies the authenticated VERTX employee profile from the incoming request header.
 * Uses Firebase ID tokens and server-side profile lookups.
 * Returns null if missing, invalid, or unauthenticated.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) return null;

    const decodedToken = await verifyAuthToken(authHeader);
    if (!decodedToken || !decodedToken.uid) return null;

    const uid = decodedToken.uid;
    const email = (decodedToken.email || "").trim().toLowerCase();

    // 1. Try local storage lookup by UID or email
    const users = db.getUsers();
    let user = users.find((u) => u.uid === uid || u.id === uid);

    if (!user && email) {
      user = users.find((u) => u.email?.trim().toLowerCase() === email);
      if (user) {
        user.id = uid;
        user.uid = uid;
        db.createUser(user);
      }
    }

    // 2. Fallback to Firestore lookup if not in local storage memory
    if (!user) {
      let firestoreUser = await getUserFromFirestore(uid);
      if (!firestoreUser && email) {
        firestoreUser = await getUserByEmailFromFirestore(email);
      }
      if (firestoreUser) {
        firestoreUser.id = uid;
        firestoreUser.uid = uid;
        db.createUser(firestoreUser);
        user = firestoreUser;
      }
    }

    // 3. Fallback for root Super Admin email
    if (!user && email === "vertxenergies@gmail.com") {
      const superAdminUser: User = {
        id: uid,
        uid: uid,
        employeeCode: "EMP-000",
        name: "Vertx Energies Super Admin",
        email: "vertxenergies@gmail.com",
        phone: "+91 98470 00000",
        role: "SUPER_ADMIN",
        roleId: "SUPER_ADMIN",
        superAdmin: true,
        approvalStatus: "APPROVED",
        department: "Executive & Global Security",
        designation: "Chief Information Security Officer",
        active: true,
        status: "ACTIVE",
        mustChangePassword: false,
        createdAt: "2026-01-15T09:00:00.000Z",
        updatedAt: new Date().toISOString(),
      };
      db.createUser(superAdminUser);
      user = superAdminUser;
    }

    return user || null;
  } catch (error) {
    console.error("[Auth] Error resolving authenticated user:", error);
    return null;
  }
}

/**
 * Evaluates whether a user has Management or Super Admin global visibility.
 */
export function isManagementOrSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.superAdmin === true) return true;
  const role = user.role;
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGEMENT";
}

/**
 * Evaluates whether a user is authorized to VIEW a specific project.
 */
export function canViewProject(user: User | null | undefined, project: Project | null | undefined): boolean {
  if (!user || !project) return false;

  // Global access for Super Admin, Admin, Management
  if (isManagementOrSuperAdmin(user)) {
    return true;
  }

  const uId = user.uid || user.id;
  const uEmail = user.email?.trim().toLowerCase();

  // Direct project assignment checks
  if (project.salespersonId === uId) return true;
  if (project.projectManagerId === uId) return true;
  if (project.siteSupervisorId === uId) return true;
  if (project.currentStageOwnerId === uId) return true;
  if (project.nextActionOwnerId === uId) return true;

  if (project.createdBy && (project.createdBy === uId || project.createdBy.trim().toLowerCase() === uEmail)) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether a user is authorized to EDIT a specific project.
 */
export function canEditProject(user: User | null | undefined, project: Project | null | undefined): boolean {
  if (!user || !project) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  if (!canViewProject(user, project)) return false;

  const uId = user.uid || user.id;
  return (
    project.projectManagerId === uId ||
    project.salespersonId === uId ||
    project.currentStageOwnerId === uId ||
    user.role === "PROJECT_MANAGER" ||
    user.role === "SALES_EXECUTIVE"
  );
}

/**
 * Evaluates whether a user is authorized to MANAGE project assignments/settings.
 */
export function canManageProject(user: User | null | undefined, project: Project | null | undefined): boolean {
  if (!user || !project) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  const uId = user.uid || user.id;
  return project.projectManagerId === uId;
}

/**
 * Evaluates whether a user is authorized to view FINANCIAL details of a project (contract values, margins, loan amounts).
 */
export function canViewFinancialData(user: User | null | undefined, project: Project | null | undefined): boolean {
  if (!user || !project) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  if (!canViewProject(user, project)) return false;

  // Only Sales Executive and Project Manager assigned to the project can view detailed financial figures
  const uId = user.uid || user.id;
  if (project.salespersonId === uId || project.projectManagerId === uId) return true;

  return false;
}

/**
 * Evaluates whether a user is authorized to advance/change project stage.
 */
export function canChangeProjectStage(user: User | null | undefined, project: Project | null | undefined): boolean {
  if (!user || !project) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  if (!canViewProject(user, project)) return false;

  const uId = user.uid || user.id;
  return (
    project.projectManagerId === uId ||
    project.salespersonId === uId ||
    project.currentStageOwnerId === uId
  );
}

/**
 * Evaluates whether a user is authorized to OVERRIDE project stage gating (Super Admin only).
 */
export function canOverrideProjectStage(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.superAdmin === true || user.role === "SUPER_ADMIN";
}

/**
 * Evaluates whether a user is authorized to VIEW a lead.
 */
export function canViewLead(user: User | null | undefined, lead: Lead | null | undefined): boolean {
  if (!user || !lead) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  const uId = user.uid || user.id;
  const uEmail = user.email?.trim().toLowerCase();

  if (lead.assignedToUid === uId || lead.assignedSalespersonId === uId) return true;
  if (lead.createdBy && (lead.createdBy === uId || lead.createdBy.trim().toLowerCase() === uEmail)) return true;

  return false;
}

/**
 * Evaluates whether a user is authorized to VIEW a customer.
 */
export function canViewCustomer(user: User | null | undefined, customer: Customer | null | undefined): boolean {
  if (!user || !customer) return false;
  if (isManagementOrSuperAdmin(user)) return true;

  const uId = user.uid || user.id;
  const uEmail = user.email?.trim().toLowerCase();

  if (customer.createdBy && (customer.createdBy === uId || customer.createdBy.trim().toLowerCase() === uEmail)) {
    return true;
  }

  // Check if customer is linked to any authorized project
  if (customer.projects && Array.isArray(customer.projects)) {
    return customer.projects.some((p) => canViewProject(user, p));
  }

  const projects = db.getProjects ? db.getProjects({ search: customer.id }) : [];
  return projects.some((p) => p.customerId === customer.id && canViewProject(user, p));
}
