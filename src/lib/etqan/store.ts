"use client";

import { collection, doc, onSnapshot, runTransaction, type Transaction } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS, type AuditRow, type Base, type Entity, type EntityMap, type SettingVersion } from "./types";

/** تعارض متزامن (412 في الوثيقة): عدّل شخص آخر السجل بعد أن فتحته. */
export class ConflictError extends Error {
  constructor() {
    super("عدّل شخص آخر هذا السجل بعد أن فتحته. أغلق النافذة وافتحه من جديد لترى آخر نسخة.");
  }
}

// ---------- سجل التدقيق: إلحاق فقط + سلسلة تجزئة (audit/hash.ts) ----------

const SEP = "\u001f";
const HEAD = doc(db, COLLECTIONS.meta, "audit_head");

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

type AuditInput = Pick<AuditRow, "action" | "entityType" | "entityId" | "beforeText" | "afterText" | "reason">;

function hashInput(r: Omit<AuditRow, "hash">): string {
  return [r.prevHash, r.id, r.actorId, r.action, r.entityType, r.entityId, String(r.atMs), r.beforeText ?? "", r.afterText ?? "", r.reason ?? ""].join(SEP);
}

/** يضيف سطر التدقيق في المعاملة نفسها التي تغيّر السجل. يجب قراءة رأس السلسلة قبل أي كتابة. */
async function readHead(tx: Transaction) {
  const snap = await tx.get(HEAD);
  return snap.exists() ? (snap.data() as { chainNo: number; hash: string }) : { chainNo: 0, hash: "" };
}

async function appendAudit(tx: Transaction, head: { chainNo: number; hash: string }, actor: User, input: AuditInput) {
  const chainNo = head.chainNo + 1;
  const id = String(chainNo).padStart(12, "0");
  const data = { chainNo, actorId: actor.uid, actorEmail: actor.email ?? "", atMs: Date.now(), prevHash: head.hash, ...input };
  const hash = await sha256Hex(hashInput({ id, ...data }));
  tx.set(doc(db, COLLECTIONS.audit, id), { ...data, hash });
  tx.set(HEAD, { chainNo, hash });
}

/** يتحقق من السلسلة؛ يُرجع رقم أول سطر مكسور أو null إن سلمت. */
export async function verifyChain(rows: AuditRow[]): Promise<number | null> {
  let prev = "";
  const sorted = [...rows].sort((a, b) => a.chainNo - b.chainNo);
  for (let k = 0; k < sorted.length; k++) {
    const r = sorted[k];
    if (r.chainNo !== k + 1 || r.prevHash !== prev || (await sha256Hex(hashInput(r))) !== r.hash) return r.chainNo;
    prev = r.hash;
  }
  return null;
}

// ---------- السجلات: إنشاء · تعديل بقفل متفائل · أرشفة · استعادة (لا حذف) ----------

const META_KEYS = new Set(["id", "version", "createdAt", "createdBy", "updatedAt", "updatedBy", "archivedAt", "archivedBy", "archiveReason"]);

function businessFields(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([k]) => !META_KEYS.has(k)));
}

type Fields<E extends Entity> = Omit<EntityMap[E], keyof Base>;

export async function createRecord<E extends Entity>(
  entity: E,
  fields: Fields<E> | ((id: string) => Fields<E>),
  actor: User,
): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS[entity]));
  const data = typeof fields === "function" ? fields(ref.id) : fields;
  await runTransaction(db, async (tx) => {
    const head = await readHead(tx);
    const now = Date.now();
    tx.set(ref, {
      ...data,
      version: 1,
      createdAt: now,
      createdBy: actor.uid,
      updatedAt: now,
      updatedBy: actor.uid,
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    });
    await appendAudit(tx, head, actor, {
      action: `${entity}.create`,
      entityType: entity,
      entityId: ref.id,
      beforeText: null,
      afterText: JSON.stringify(data),
      reason: null,
    });
  });
  return ref.id;
}

async function mutate<E extends Entity>(
  entity: E,
  id: string,
  expectedVersion: number,
  actor: User,
  action: string,
  patch: Record<string, unknown>,
  reason: string | null,
) {
  const ref = doc(db, COLLECTIONS[entity], id);
  await runTransaction(db, async (tx) => {
    const head = await readHead(tx);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("السجل غير موجود.");
    const current = snap.data() as Record<string, unknown>;
    if (current.version !== expectedVersion) throw new ConflictError();
    const before = businessFields(current);
    const changedBefore = Object.fromEntries(Object.keys(patch).map((k) => [k, before[k] ?? current[k] ?? null]));
    tx.update(ref, { ...patch, version: expectedVersion + 1, updatedAt: Date.now(), updatedBy: actor.uid });
    await appendAudit(tx, head, actor, {
      action,
      entityType: entity,
      entityId: id,
      beforeText: JSON.stringify(changedBefore),
      afterText: JSON.stringify(patch),
      reason,
    });
  });
}

export function updateRecord<E extends Entity>(entity: E, id: string, expectedVersion: number, patch: Partial<Fields<E>>, actor: User) {
  return mutate(entity, id, expectedVersion, actor, `${entity}.update`, patch as Record<string, unknown>, null);
}

export function archiveRecord(entity: Entity, id: string, expectedVersion: number, reason: string, actor: User) {
  return mutate(entity, id, expectedVersion, actor, `${entity}.archive`, { archivedAt: Date.now(), archivedBy: actor.uid, archiveReason: reason }, reason);
}

export function restoreRecord(entity: Entity, id: string, expectedVersion: number, actor: User) {
  return mutate(entity, id, expectedVersion, actor, `${entity}.restore`, { archivedAt: null, archivedBy: null, archiveReason: null }, null);
}

// ---------- الإعدادات: إدراج فقط، كل تغيير إصدار جديد بتاريخ سريان ----------

export async function addSettingVersion(key: string, nextVersion: number, effectiveFrom: string, value: unknown, reason: string, actor: User) {
  const ref = doc(db, COLLECTIONS.setting, `${key}@${nextVersion}`);
  const prev = nextVersion > 1 ? doc(db, COLLECTIONS.setting, `${key}@${nextVersion - 1}`) : null;
  await runTransaction(db, async (tx) => {
    const head = await readHead(tx);
    const [mine, before] = await Promise.all([tx.get(ref), prev ? tx.get(prev) : Promise.resolve(null)]);
    if (mine.exists() || (prev && !before?.exists())) throw new ConflictError();
    tx.set(ref, { key, version: nextVersion, effectiveFrom, value, reason, createdAt: Date.now(), createdBy: actor.uid });
    await appendAudit(tx, head, actor, {
      action: "setting.create_version",
      entityType: "setting",
      entityId: `${key}@${nextVersion}`,
      beforeText: before?.exists() ? JSON.stringify(before.data().value) : null,
      afterText: JSON.stringify(value),
      reason,
    });
  });
}

/** يختار الإصدار السارِي في تاريخ معيّن: أحدث effectiveFrom ≤ التاريخ، وعند التساوي الأعلى رقمًا. */
export function resolveEffective(versions: SettingVersion[], onDate: string): SettingVersion | undefined {
  let best: SettingVersion | undefined;
  for (const v of versions) {
    if (v.effectiveFrom > onDate) continue;
    if (!best || v.effectiveFrom > best.effectiveFrom || (v.effectiveFrom === best.effectiveFrom && v.version > best.version)) best = v;
  }
  return best;
}

// ---------- قراءة حية ----------

type CollectionKey = keyof typeof COLLECTIONS;
type RowOf<K extends CollectionKey> = K extends Entity ? EntityMap[K] : K extends "setting" ? SettingVersion : K extends "audit" ? AuditRow : never;

export function useCollection<K extends Exclude<CollectionKey, "meta">>(key: K) {
  const [state, setState] = useState<{ data: RowOf<K>[] | null; error: string }>({ data: null, error: "" });
  useEffect(
    () =>
      onSnapshot(
        collection(db, COLLECTIONS[key]),
        (snap) => setState({ data: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as RowOf<K>), error: "" }),
        () => setState((s) => ({ ...s, error: "تعذّر تحميل البيانات. تحقق من الصلاحيات أو الاتصال." })),
      ),
    [key],
  );
  return state;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function errorText(err: unknown): string {
  if (err instanceof ConflictError) return err.message;
  if (err instanceof Error && /permission/i.test(err.message)) return "لا تملك صلاحية تنفيذ هذا الإجراء.";
  if (err instanceof Error && err.message && /[؀-ۿ]/.test(err.message)) return err.message;
  return "تعذّر الحفظ. تحقق من الاتصال ثم حاول مرة أخرى.";
}
