import { QuranIndexView } from "@/components/etqan/QuranIndexView";

// Content renders only after client-side sign-in, so there is nothing to validate on the server.
export const instant = false;

export default function QuranPage() {
  return <QuranIndexView />;
}
