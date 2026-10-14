"use client";

import { useMemo } from "react";
import { useCollection } from "./store";

export interface ScopeOption { path: string; label: string; depth: number; kind: "organization" | "center" | "mosque" | "circle" }

const KIND_LABEL = { organization: "جهة", center: "مركز", mosque: "مسجد", circle: "حلقة" };

/** عقد الهيكل التنظيمي مرتبة كشجرة، لاختيار نطاق الدور (3.1). */
export function useScopeOptions() {
  const orgs = useCollection("organization");
  const centers = useCollection("center");
  const mosques = useCollection("mosque");
  const circles = useCollection("circle");

  return useMemo(() => {
    const options: ScopeOption[] = [];
    const labels = new Map<string, string>();
    const byName = <T extends { name: string; archivedAt: number | null }>(rows: T[] | null) =>
      (rows ?? []).filter((r) => !r.archivedAt).sort((a, b) => a.name.localeCompare(b.name, "ar"));

    for (const o of byName(orgs.data)) {
      options.push({ path: o.path, label: o.name, depth: 0, kind: "organization" });
      labels.set(o.path, o.name);
      for (const c of byName(centers.data).filter((c) => c.organizationId === o.id)) {
        options.push({ path: c.path, label: c.name, depth: 1, kind: "center" });
        labels.set(c.path, `${o.name} › ${c.name}`);
        for (const m of byName(mosques.data).filter((m) => m.centerId === c.id)) {
          options.push({ path: m.path, label: m.name, depth: 2, kind: "mosque" });
          labels.set(m.path, `${c.name} › ${m.name}`);
          for (const h of byName(circles.data).filter((h) => h.mosqueId === m.id)) {
            options.push({ path: h.path, label: h.name, depth: 3, kind: "circle" });
            labels.set(h.path, `${m.name} › ${h.name}`);
          }
        }
      }
    }
    const loading = !orgs.data || !centers.data || !mosques.data || !circles.data;
    return { options, labelOf: (path: string) => labels.get(path) ?? "نطاق مؤرشف", loading, kindLabel: KIND_LABEL };
  }, [orgs.data, centers.data, mosques.data, circles.data]);
}
