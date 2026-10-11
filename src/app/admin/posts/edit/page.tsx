import { Suspense } from "react";
import { PostEditor } from "@/components/admin/PostEditor";

// Content renders only after client-side sign-in, so there is nothing to validate on the server.
export const instant = false;

export default function AdminPostEditPage() {
  return (
    <Suspense fallback={null}>
      <PostEditor />
    </Suspense>
  );
}
