import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Middleware: Verify Auth Context & Active User status
 */
async function verifyActiveUser(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data()?.active === false) {
    throw new functions.https.HttpsError("permission-denied", "User account is inactive or not found.");
  }

  return {
    uid: context.auth.uid,
    userData: userDoc.data()!,
  };
}

/**
 * 1. Convert Lead to Customer and Solar Project (Atomic Transaction)
 */
export const convertLead = functions.https.onCall(async (data, context) => {
  const { uid, userData } = await verifyActiveUser(context);
  const { leadId, systemSizeKw, projectType, estimatedProjectValue, notes } = data;

  if (!leadId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing leadId.");
  }

  return db.runTransaction(async (transaction) => {
    const leadRef = db.collection("leads").doc(leadId);
    const leadSnap = await transaction.get(leadRef);

    if (!leadSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Lead not found.");
    }

    const leadData = leadSnap.data()!;
    if (leadData.currentStage === "BOOKED" && leadData.convertedToProjectId) {
      throw new functions.https.HttpsError("already-exists", "Lead is already booked and converted.");
    }

    const customerId = `cust-${Date.now()}`;
    const projectId = `proj-${Date.now()}`;
    const projectNumber = `SOL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newCustomerRef = db.collection("customers").doc(customerId);
    const newProjectRef = db.collection("projects").doc(projectId);
    const auditRef = db.collection("auditLogs").doc();
    const dutyRef = db.collection("duties").doc();

    const customerData = {
      id: customerId,
      customerNumber: `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: leadData.customerName,
      phone: leadData.phone,
      whatsapp: leadData.whatsapp || leadData.phone,
      email: leadData.email || null,
      address: leadData.address || "Kerala, India",
      district: leadData.district || "Kozhikode",
      propertyType: projectType || "RESIDENTIAL",
      originalLeadId: leadId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
    };

    const projectData = {
      id: projectId,
      projectNumber,
      customerId,
      leadId,
      systemSizeKw: Number(systemSizeKw) || Number(leadData.estimatedSystemSizeKw) || 5.0,
      projectType: projectType || "RESIDENTIAL",
      salespersonId: leadData.assignedSalespersonId || uid,
      projectManagerId: uid,
      currentStage: "BOOKING_CONFIRMED",
      overallStatus: "ON_TRACK",
      priority: "HIGH",
      estimatedProjectValue: Number(estimatedProjectValue) || 285000,
      startDate: new Date().toISOString(),
      nextActionTitle: "Collect mandatory KYC documents and property tax receipt",
      nextActionOwnerId: leadData.assignedSalespersonId || uid,
      nextActionDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      nextActionStatus: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
    };

    const initialDuty = {
      id: dutyRef.id,
      title: "Collect KYC & Electricity Bill Documents",
      description: `Collect signed building tax receipt, latest KSEB bill, and Aadhaar for ${leadData.customerName}`,
      dutyType: "DOCUMENT_COLLECTION",
      assignedTo: leadData.assignedSalespersonId || uid,
      assignedBy: uid,
      leadId,
      customerId,
      projectId,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: "HIGH",
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const auditEntry = {
      id: auditRef.id,
      entityType: "PROJECT",
      entityId: projectId,
      userId: uid,
      userName: userData.name || "User",
      userRole: userData.roleId || "SALES_EXECUTIVE",
      action: "CONVERT_LEAD",
      description: `${userData.name} converted lead #${leadData.leadNumber} to customer project ${projectNumber}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    transaction.set(newCustomerRef, customerData);
    transaction.set(newProjectRef, projectData);
    transaction.set(dutyRef, initialDuty);
    transaction.set(auditRef, auditEntry);

    transaction.update(leadRef, {
      currentStage: "BOOKED",
      convertedToCustomerId: customerId,
      convertedToProjectId: projectId,
      stageChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      customerId,
      projectId,
      projectNumber,
    };
  });
});

/**
 * 2. Transition Project Stage (Atomic Transaction & Duty Generation)
 */
export const transitionProjectStage = functions.https.onCall(async (data, context) => {
  const { uid, userData } = await verifyActiveUser(context);
  const { projectId, newStage, stageNotes, nextActionTitle, nextActionOwnerId, nextActionDueDate } = data;

  if (!projectId || !newStage) {
    throw new functions.https.HttpsError("invalid-argument", "Missing projectId or newStage.");
  }

  return db.runTransaction(async (transaction) => {
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await transaction.get(projectRef);

    if (!projectSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Project not found.");
    }

    const currentProj = projectSnap.data()!;
    const oldStage = currentProj.currentStage;

    const auditRef = db.collection("auditLogs").doc();
    const auditEntry = {
      id: auditRef.id,
      entityType: "PROJECT",
      entityId: projectId,
      userId: uid,
      userName: userData.name || "User",
      userRole: userData.roleId || "PROJECT_MANAGER",
      action: "STAGE_CHANGE",
      field: "currentStage",
      oldValue: oldStage,
      newValue: newStage,
      description: `${userData.name} transitioned project #${currentProj.projectNumber} stage from '${oldStage}' to '${newStage}'`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    transaction.set(auditRef, auditEntry);

    const updates: any = {
      currentStage: newStage,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (nextActionTitle) updates.nextActionTitle = nextActionTitle;
    if (nextActionOwnerId) updates.nextActionOwnerId = nextActionOwnerId;
    if (nextActionDueDate) updates.nextActionDueDate = nextActionDueDate;

    if (newStage === "COMPLETED") {
      updates.actualCompletionDate = new Date().toISOString();
      updates.overallStatus = "COMPLETED";
    }

    transaction.update(projectRef, updates);

    // Create Notification if assignee is another user
    if (nextActionOwnerId && nextActionOwnerId !== uid) {
      const notifRef = db.collection("notifications").doc();
      transaction.set(notifRef, {
        id: notifRef.id,
        userId: nextActionOwnerId,
        type: "STAGE_TRANSITION",
        title: `Project ${currentProj.projectNumber} Stage Updated`,
        message: `${userData.name} transitioned stage to ${newStage}. Next action assigned: ${nextActionTitle || "Review project"}`,
        linkUrl: `/projects/${projectId}`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      projectId,
      oldStage,
      newStage,
    };
  });
});

/**
 * 3. Assign Duty to Employee
 */
export const assignDuty = functions.https.onCall(async (data, context) => {
  const { uid, userData } = await verifyActiveUser(context);
  const { title, description, dutyType, assignedTo, projectId, leadId, dueDate, priority } = data;

  if (!title || !assignedTo || !dueDate) {
    throw new functions.https.HttpsError("invalid-argument", "Missing duty fields.");
  }

  // Verify assigned employee exists and is active
  const assigneeDoc = await db.collection("users").doc(assignedTo).get();
  if (!assigneeDoc.exists || assigneeDoc.data()?.active === false) {
    throw new functions.https.HttpsError("invalid-argument", "Assigned employee does not exist or is inactive.");
  }

  const dutyRef = db.collection("duties").doc();
  const dutyData = {
    id: dutyRef.id,
    title,
    description: description || null,
    dutyType: dutyType || "OTHER",
    assignedTo,
    assignedBy: uid,
    projectId: projectId || null,
    leadId: leadId || null,
    dueDate,
    priority: priority || "MEDIUM",
    status: "PENDING",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await dutyRef.set(dutyData);

  // Audit Log
  await db.collection("auditLogs").add({
    entityType: "DUTY",
    entityId: dutyRef.id,
    userId: uid,
    userName: userData.name || "User",
    userRole: userData.roleId || "MANAGEMENT",
    action: "DUTY_ASSIGNED",
    description: `${userData.name} assigned duty '${title}' to ${assigneeDoc.data()?.name}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notification to Assignee
  if (assignedTo !== uid) {
    await db.collection("notifications").add({
      userId: assignedTo,
      type: "DUTY_ASSIGNED",
      title: "New Duty Assigned",
      message: `${userData.name} assigned you: ${title}`,
      linkUrl: projectId ? `/projects/${projectId}` : "/my-work",
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true, dutyId: dutyRef.id };
});

/**
 * 4. Complete Duty
 */
export const completeDuty = functions.https.onCall(async (data, context) => {
  const { uid, userData } = await verifyActiveUser(context);
  const { dutyId } = data;

  if (!dutyId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing dutyId.");
  }

  const dutyRef = db.collection("duties").doc(dutyId);
  const dutySnap = await dutyRef.get();
  if (!dutySnap.exists) {
    throw new functions.https.HttpsError("not-found", "Duty not found.");
  }

  const dutyData = dutySnap.data()!;
  await dutyRef.update({
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    entityType: "DUTY",
    entityId: dutyId,
    userId: uid,
    userName: userData.name || "User",
    userRole: userData.roleId || "STAFF",
    action: "DUTY_COMPLETED",
    description: `${userData.name} marked duty '${dutyData.title}' as COMPLETED`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, dutyId };
});

/**
 * 5. Create Employee (Admin-Only)
 */
export const createEmployee = functions.https.onCall(async (data, context) => {
  const { uid, userData } = await verifyActiveUser(context);

  if (userData.roleId !== "ADMIN") {
    throw new functions.https.HttpsError("permission-denied", "Only administrators can create employees.");
  }

  const { name, email, phone, roleId, department, designation, password } = data;

  if (!name || !email || !roleId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing employee fields.");
  }

  // Create Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password: password || "KeralaSolar@2026",
    displayName: name,
    phoneNumber: phone && phone.startsWith("+") ? phone : undefined,
  });

  const employeeCode = `EMP-${Math.floor(100 + Math.random() * 900)}`;

  // Create Firestore profile /users/{uid}
  await db.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    employeeCode,
    name,
    email,
    phone: phone || "",
    roleId,
    department: department || "Operations",
    designation: designation || "Specialist",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Audit Log
  await db.collection("auditLogs").add({
    entityType: "USER",
    entityId: userRecord.uid,
    userId: uid,
    userName: userData.name,
    userRole: "ADMIN",
    action: "USER_CREATE",
    description: `Admin ${userData.name} created new employee profile for ${name} (${roleId})`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    uid: userRecord.uid,
    employeeCode,
  };
});
