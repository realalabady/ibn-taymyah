import { PostsList } from "@/components/admin/PostsList";

// Content renders only after client-side sign-in, so there is nothing to validate on the server.
export const instant = false;

export default function AdminPostsPage() {
  return <PostsList />;
}
