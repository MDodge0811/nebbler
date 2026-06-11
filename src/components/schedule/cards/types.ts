export type AttendeeChip = {
  /** Optional — used as a stable list key when present (the S2 feed supplies it). */
  userId?: string;
  initials: string;
  color: string;
  rsvp: 'going' | 'pending';
};

export type EventCardProps = {
  title: string;
  timeRange: string;
  tintColor: string; // calendar hex, e.g. '#F472B6'
  starred?: boolean;
  location?: string; // placeholder — renders nothing when absent
  attendees?: AttendeeChip[]; // declined already filtered out upstream
  commentCount?: number; // placeholder
  hasUnreadComments?: boolean; // placeholder
  photoUri?: string; // placeholder
  onPress?: () => void;
  onLongPress?: () => void;
};
