// Form data structure
export interface LeadFormData {
  "Lead Type": string;
  "Country": string;
  "City": string;
  "number of results": number;
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Lead Status types
export type LeadStatus = 'new' | 'contacted' | 'replied' | 'closed' | 'lost';

// Lead Database structure (from Supabase) - matches lead_agent1 table
// IMPORTANT: Column names have SPACES and CAPITALS!
export interface Lead {
  id?: number;
  Name: string;
  Email: string;
  'Phone Number'?: string;
  Country?: string;
  Location?: string;
  Industry?: string;
  'Website URL'?: string;
  'LinkedIn URL'?: string;
  'Instagram URL'?: string;
  'Twitter URL'?: string;
  'Facebook URL'?: string;

  // Email Campaign Fields
  'Email Drafted'?: string;
  'Lead Reply 1'?: string;
  'Reply 1 Drafted'?: string;
  'Lead Reply 2'?: string;
  'Reply 2 Drafted'?: string;

  // New columns (may not exist yet in database)
  draft_subject?: string;
  draft_status?: 'pending_review' | 'sent' | 'rejected' | 'none';
  draft_created_at?: string;
  draft_sent_at?: string;

  // Meeting Fields
  appointment_at?: string;
  appointment_status?: 'proposed' | 'confirmed' | 'completed';

  // Tracking
  lead_status?: 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'closed';
  created_at?: string;
  last_interaction_at?: string;

  // Reply tracking
  has_replied?: boolean;
  first_reply_at?: string;
  reply_count?: number;
}

// Lead Interaction for timeline
export interface LeadInteraction {
  id: string;
  lead_id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'status_change';
  description: string;
  created_at: string;
  created_by?: string;
}

// Statistics for dashboard
export interface LeadStatistics {
  total: number;
  pendingReview: number;
  emailsSent: number;
  repliesReceived: number;
  meetingsBooked: number;
  thisWeek: number;
  thisMonth: number;
}
