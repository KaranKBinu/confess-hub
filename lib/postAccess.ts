const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

type Viewer = { id: string; role: "USER" | "ADMIN" } | null;

type PostRow = {
  authorUserId: string | null;
  createdAt: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export function viewerCanEditPost(viewer: Viewer, post: PostRow): boolean {
  if (!viewer || !post.authorUserId || post.authorUserId !== viewer.id) return false;
  if (post.status !== "APPROVED" && post.status !== "PENDING") return false;
  return Date.now() - post.createdAt.getTime() <= EDIT_WINDOW_MS;
}

export function viewerCanDeletePost(viewer: Viewer, post: PostRow): boolean {
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  return Boolean(post.authorUserId && post.authorUserId === viewer.id);
}

export function viewerCanAppendPart(
  viewer: Viewer,
  post: PostRow & { partIndex: number; partTotal: number | null; seriesId: string | null },
  isLastPartInSeries: boolean,
): boolean {
  if (!viewer || !post.authorUserId || post.authorUserId !== viewer.id) return false;
  if (post.status !== "APPROVED") return false;
  if (!isLastPartInSeries) return false;
  const total = post.partTotal ?? 1;
  return total < 12;
}

export const POST_EDIT_WINDOW_MS = EDIT_WINDOW_MS;