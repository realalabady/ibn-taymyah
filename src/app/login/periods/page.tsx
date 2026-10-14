import { PeriodsManager } from "@/components/etqan/PeriodsManager";

// Content renders only after client-side sign-in, so there is nothing to validate on the server.
export const instant = false;

export default function PeriodsPage() {
  return <PeriodsManager />;
}
