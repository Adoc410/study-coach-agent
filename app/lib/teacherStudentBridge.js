/**
 * teacherStudentBridge.js
 * All Firebase read/write operations for teacher → student data sharing.
 *
 * Collections:
 *   sca_quizzes      — quizzes created by teachers
 *   sca_assignments  — assignments created by teachers
 *   sca_materials    — study materials uploaded by teachers
 *   sca_notices      — announcements from teachers
 */

import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── TEACHER: Save a quiz ─────────────────────────────────────────────────────
export async function saveQuizToCloud(quiz) {
  try {
    await addDoc(collection(db, "sca_quizzes"), {
      ...quiz,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("[Firebase] saveQuizToCloud error:", err);
    return { error: err.message };
  }
}

// ─── STUDENT: Fetch all quizzes ───────────────────────────────────────────────
export async function fetchQuizzesFromCloud() {
  try {
    const q     = query(collection(db, "sca_quizzes"), orderBy("createdAt", "desc"));
    const snap  = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[Firebase] fetchQuizzesFromCloud error:", err);
    return [];
  }
}

// ─── TEACHER: Delete a quiz ───────────────────────────────────────────────────
export async function deleteQuizFromCloud(id) {
  try {
    await deleteDoc(doc(db, "sca_quizzes", id));
    return { success: true };
  } catch (err) {
    console.error("[Firebase] deleteQuizFromCloud error:", err);
    return { error: err.message };
  }
}

// ─── TEACHER: Save an assignment ──────────────────────────────────────────────
export async function saveAssignmentToCloud(assignment) {
  try {
    await addDoc(collection(db, "sca_assignments"), {
      ...assignment,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("[Firebase] saveAssignmentToCloud error:", err);
    return { error: err.message };
  }
}

// ─── STUDENT: Fetch all assignments ──────────────────────────────────────────
export async function fetchAssignmentsFromCloud() {
  try {
    const q    = query(collection(db, "sca_assignments"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[Firebase] fetchAssignmentsFromCloud error:", err);
    return [];
  }
}

// ─── TEACHER: Delete an assignment ───────────────────────────────────────────
export async function deleteAssignmentFromCloud(id) {
  try {
    await deleteDoc(doc(db, "sca_assignments", id));
    return { success: true };
  } catch (err) {
    console.error("[Firebase] deleteAssignmentFromCloud error:", err);
    return { error: err.message };
  }
}

// ─── TEACHER: Save a material (PDF text) ─────────────────────────────────────
export async function saveMaterialToCloud(material) {
  try {
    await addDoc(collection(db, "sca_materials"), {
      ...material,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("[Firebase] saveMaterialToCloud error:", err);
    return { error: err.message };
  }
}

// ─── STUDENT: Fetch all materials ────────────────────────────────────────────
export async function fetchMaterialsFromCloud() {
  try {
    const q    = query(collection(db, "sca_materials"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[Firebase] fetchMaterialsFromCloud error:", err);
    return [];
  }
}

// ─── TEACHER: Delete a material ──────────────────────────────────────────────
export async function deleteMaterialFromCloud(id) {
  try {
    await deleteDoc(doc(db, "sca_materials", id));
    return { success: true };
  } catch (err) {
    console.error("[Firebase] deleteMaterialFromCloud error:", err);
    return { error: err.message };
  }
}

// ─── TEACHER: Post a notice/announcement ─────────────────────────────────────
export async function saveNoticeToCloud(notice) {
  try {
    await addDoc(collection(db, "sca_notices"), {
      ...notice,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("[Firebase] saveNoticeToCloud error:", err);
    return { error: err.message };
  }
}

// ─── STUDENT: Fetch all notices ──────────────────────────────────────────────
export async function fetchNoticesFromCloud() {
  try {
    const q    = query(collection(db, "sca_notices"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[Firebase] fetchNoticesFromCloud error:", err);
    return [];
  }
}