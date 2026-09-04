import { CATEGORY_TYPES, type NotificationCategory } from "@/features/notifications/lib/notificationVisuals";
import { supabase } from "@/lib/supabase/client";
import type { Notification } from "@/types";

const SELECT_COLUMNS =
  "id, user_id, type, title, message, is_read, read_at, created_at, reference_type, reference_id, period_start, period_end";

interface NotificationRow {
  id: string;
  user_id: string;
  type: Notification["type"];
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
  period_start: string | null;
  period_end: string | null;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

export type NotificationTab = "all" | "unread" | NotificationCategory;

/** Strips PostgREST filter-syntax delimiters out of free-text search input before it's interpolated into a raw `.or()` filter string. */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_,()]/g, " ").trim();
}

export interface ListNotificationsOptions {
  limit: number;
  offset?: number;
  tab?: NotificationTab;
  search?: string;
}

export interface ListNotificationsResult {
  notifications: Notification[];
  totalCount: number;
}

/** Newest first, soft-deleted rows excluded — every query here relies on RLS to scope to the caller's own rows. */
export async function listNotifications({
  limit,
  offset = 0,
  tab = "all",
  search,
}: ListNotificationsOptions): Promise<{ data?: ListNotificationsResult; error?: string }> {
  if (tab in CATEGORY_TYPES && CATEGORY_TYPES[tab as NotificationCategory].length === 0) {
    return { data: { notifications: [], totalCount: 0 } };
  }

  let query = supabase.from("notifications").select(SELECT_COLUMNS, { count: "exact" }).is("deleted_at", null);

  if (tab === "unread") query = query.eq("is_read", false);
  else if (tab in CATEGORY_TYPES) query = query.in("type", CATEGORY_TYPES[tab as NotificationCategory]);

  const term = search ? sanitizeSearchTerm(search) : "";
  if (term) query = query.or(`title.ilike.%${term}%,message.ilike.%${term}%`);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (error) return { error: "We couldn't load your notifications. Please try again." };
  return { data: { notifications: (data ?? []).map(toNotification), totalCount: count ?? 0 } };
}

export async function fetchNotification(id: string): Promise<{ data?: Notification; error?: string }> {
  const { data, error } = await supabase.from("notifications").select(SELECT_COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle();
  if (error || !data) return { error: "This notification couldn't be found." };
  return { data: toNotification(data) };
}

export interface NotificationCounts {
  all: number;
  unread: number;
  reports: number;
  security: number;
  insights: number;
}

async function countAll(): Promise<number> {
  const { count: c, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("deleted_at", null);
  return error ? 0 : (c ?? 0);
}

async function countUnread(): Promise<number> {
  const { count: c, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("is_read", false);
  return error ? 0 : (c ?? 0);
}

async function countCategory(category: NotificationCategory): Promise<number> {
  const types = CATEGORY_TYPES[category];
  if (types.length === 0) return 0;
  const { count: c, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .in("type", types);
  return error ? 0 : (c ?? 0);
}

export async function fetchNotificationCounts(): Promise<NotificationCounts> {
  const [all, unread, reports, security, insights] = await Promise.all([
    countAll(),
    countUnread(),
    countCategory("reports"),
    countCategory("security"),
    countCategory("insights"),
  ]);

  return { all, unread, reports, security, insights };
}

export const fetchUnreadCount = countUnread;

export async function markAsRead(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { error: "Couldn't mark this notification as read. Please try again." } : {};
}

export async function markAllAsRead(): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .is("deleted_at", null)
    .eq("is_read", false);
  return error ? { error: "Couldn't mark all notifications as read. Please try again." } : {};
}

/** Soft delete — the row stays in the database, just excluded from future queries via deleted_at. */
export async function softDeleteNotification(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return error ? { error: "Couldn't delete this notification. Please try again." } : {};
}

export async function clearNotificationHistory(): Promise<{ error?: string }> {
  const { error } = await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).is("deleted_at", null);
  return error ? { error: "Couldn't clear your notification history. Please try again." } : {};
}
