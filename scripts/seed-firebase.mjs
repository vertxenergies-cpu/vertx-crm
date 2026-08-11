import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-kerala-solar";

if (!getApps().length) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";

  initializeApp({
    projectId,
  });
}

const auth = getAuth();
const db = getFirestore();

async function seed() {
  console.log(`🚀 Seeding Firebase Firestore & Auth on project: ${projectId}...`);

  // 1. Roles & Permissions Master
  const roles = [
    {
      id: "ADMIN",
      name: "System Administrator",
      department: "Executive & IT",
      permissions: [
        "lead.view", "lead.create", "lead.edit", "lead.assign",
        "customer.view", "customer.create", "customer.edit",
        "project.view", "project.create", "project.edit", "project.assign", "project.change_stage",
        "documents.view", "documents.change_status", "loan.view", "loan.edit",
        "kseb.view", "kseb.edit", "installation.view", "installation.edit",
        "subsidy.view", "subsidy.edit", "duty.view", "duty.create", "duty.edit", "duty.assign", "duty.complete",
        "task.view", "task.create", "task.edit", "task.assign", "task.complete",
        "followup.view", "followup.create", "followup.edit", "followup.complete",
        "reports.view", "team.view", "team.manage", "settings.view", "settings.manage",
        "audit.view", "user.create", "user.edit", "user.deactivate", "notifications.view"
      ],
    },
    {
      id: "MANAGEMENT",
      name: "Executive Management",
      department: "Management",
      permissions: [
        "lead.view", "customer.view", "project.view", "documents.view",
        "loan.view", "kseb.view", "installation.view", "subsidy.view",
        "duty.view", "duty.create", "duty.assign", "task.view", "followup.view",
        "reports.view", "team.view", "settings.view", "audit.view", "notifications.view"
      ],
    },
    {
      id: "PROJECT_MANAGER",
      name: "Project Manager",
      department: "Operations",
      permissions: [
        "lead.view", "customer.view", "customer.create", "customer.edit",
        "project.view", "project.create", "project.edit", "project.assign", "project.change_stage",
        "documents.view", "documents.change_status", "loan.view", "loan.edit",
        "kseb.view", "kseb.edit", "installation.view", "installation.edit", "subsidy.view", "subsidy.edit",
        "duty.view", "duty.create", "duty.edit", "duty.assign", "duty.complete",
        "task.view", "task.create", "task.edit", "task.assign", "task.complete",
        "followup.view", "reports.view", "team.view", "notifications.view"
      ],
    },
    {
      id: "SALES_EXECUTIVE",
      name: "Sales Executive",
      department: "Sales & Marketing",
      permissions: [
        "lead.view", "lead.create", "lead.edit", "customer.view", "customer.create", "customer.edit",
        "project.view", "documents.view", "documents.change_status", "loan.view", "loan.edit",
        "duty.view", "duty.complete", "task.view", "task.create", "task.complete",
        "followup.view", "followup.create", "followup.edit", "followup.complete", "notifications.view"
      ],
    },
    {
      id: "SURVEY_TEAM",
      name: "Site Surveyor",
      department: "Engineering",
      permissions: [
        "lead.view", "customer.view", "project.view", "duty.view", "duty.complete",
        "task.view", "task.complete", "documents.view", "documents.change_status", "notifications.view"
      ],
    },
    {
      id: "DOCUMENTATION_TEAM",
      name: "Documentation Specialist",
      department: "Operations",
      permissions: [
        "customer.view", "project.view", "documents.view", "documents.change_status",
        "loan.view", "loan.edit", "duty.view", "duty.complete", "task.view", "task.complete", "notifications.view"
      ],
    },
    {
      id: "KSEB_TEAM",
      name: "KSEB Coordinator",
      department: "Liaison & Regulatory",
      permissions: [
        "customer.view", "project.view", "kseb.view", "kseb.edit",
        "documents.view", "documents.change_status", "subsidy.view", "subsidy.edit",
        "duty.view", "duty.complete", "task.view", "task.complete", "notifications.view"
      ],
    },
    {
      id: "INSTALLATION_TEAM",
      name: "Site Installation Lead",
      department: "Field Engineering",
      permissions: [
        "customer.view", "project.view", "installation.view", "installation.edit",
        "duty.view", "duty.complete", "task.view", "task.complete", "notifications.view"
      ],
    },
  ];

  for (const role of roles) {
    await db.collection("roles").doc(role.id).set(role);
  }
  console.log(`✓ Seeded ${roles.length} roles and permissions in Firestore`);

  // 2. Initial Users & Auth Records
  const initialUsers = [
    { uid: "usr-admin-1", email: "admin@keralasolar.local", name: "Anoop Varma", roleId: "ADMIN", empCode: "EMP-001", dept: "Executive & IT", desig: "Managing Director" },
    { uid: "usr-mgmt-1", email: "manager@keralasolar.local", name: "Dr. Thomas Mathew", roleId: "MANAGEMENT", empCode: "EMP-002", dept: "Management", desig: "Chief Operations Officer" },
    { uid: "usr-pm-1", email: "pm@keralasolar.local", name: "Arun Krishnan", roleId: "PROJECT_MANAGER", empCode: "EMP-003", dept: "Operations", desig: "Project Manager" },
    { uid: "usr-sales-1", email: "sales@keralasolar.local", name: "Rahul Raj", roleId: "SALES_EXECUTIVE", empCode: "EMP-004", dept: "Sales & Marketing", desig: "Senior Solar Consultant" },
    { uid: "usr-survey-1", email: "survey@keralasolar.local", name: "Faisal Rahman", roleId: "SURVEY_TEAM", empCode: "EMP-005", dept: "Engineering", desig: "Site Assessment Lead" },
    { uid: "usr-docs-1", email: "docs@keralasolar.local", name: "Anjali Nair", roleId: "DOCUMENTATION_TEAM", empCode: "EMP-006", dept: "Operations", desig: "Documentation Specialist" },
    { uid: "usr-kseb-1", email: "kseb@keralasolar.local", name: "Sumegh K. S.", roleId: "KSEB_TEAM", empCode: "EMP-007", dept: "Liaison & Regulatory", desig: "KSEB Soura Coordinator" },
    { uid: "usr-install-1", email: "installation@keralasolar.local", name: "Jijo Varghese", roleId: "INSTALLATION_TEAM", empCode: "EMP-008", dept: "Field Engineering", desig: "Technical Rigging Lead" },
  ];

  for (const u of initialUsers) {
    try {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: "password123",
        displayName: u.name,
      });
    } catch (e) {
      // User might already exist in emulator
    }

    await db.collection("users").doc(u.uid).set({
      uid: u.uid,
      employeeCode: u.empCode,
      name: u.name,
      email: u.email,
      phone: "+91 98470 12345",
      roleId: u.roleId,
      department: u.dept,
      designation: u.desig,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  console.log(`✓ Seeded ${initialUsers.length} Firebase Auth accounts and /users/{uid} profiles`);

  console.log("🎉 Firebase Firestore & Auth seeding complete!");
}

seed().catch(console.error);
