import { createContext } from "react";

export interface NotificationsContextValue {
  unreadCount: number;
  /** Bumped on every realtime notifications event — components with an open list watch this to know when to refetch. */
  lastChangeAt: number;
  loading: boolean;
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);
