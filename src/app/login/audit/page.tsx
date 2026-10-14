import { AuditLog } from "@/components/etqan/AuditLog";

// Content renders only after client-side sign-in, so there is nothing to validate on the server.
export const instant = false;

export default function AuditPage() {
  return <AuditLog />;
}
