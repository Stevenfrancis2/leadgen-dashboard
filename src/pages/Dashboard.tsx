import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lead, LeadStatistics } from '../types';
import {
  Users,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Zap,
} from 'lucide-react';
import { startOfWeek, startOfMonth } from 'date-fns';
import DraftCard from '../components/DraftCard';
import DraftModal from '../components/DraftModal';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<LeadStatistics>({
    total: 0,
    pendingReview: 0,
    emailsSent: 0,
    repliesReceived: 0,
    meetingsBooked: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [pendingDrafts, setPendingDrafts] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const TABLE_NAME = 'lead_agent1';
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_SEND_EMAIL_WEBHOOK;

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscription
    const channel = supabase
      .channel('lead-agent-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        console.log('Real-time update detected');
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching from table:', TABLE_NAME);

      // Fetch all leads
      const { data: leads, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { leads, error });

      if (error) {
        console.error('Error fetching leads:', error);
        showToast(`Database error: ${error.message}`, 'error');
        throw error;
      }

      if (leads) {
        console.log(`Found ${leads.length} total leads`);
        console.log('Sample lead:', leads[0]);
        const now = new Date();
        const weekStart = startOfWeek(now);
        const monthStart = startOfMonth(now);

        // Calculate statistics using correct column names
        // Pending drafts: those with "Email Drafted" field filled AND not sent/rejected
        const pendingReviewCount = leads.filter(
          l => l['Email Drafted'] &&
               l['Email Drafted'].trim() !== '' &&
               l.draft_status !== 'sent' &&
               l.draft_status !== 'rejected'
        ).length;

        // Emails sent: those with draft_status = 'sent' (if column exists)
        const emailsSentCount = leads.filter(l => l.draft_status === 'sent').length;

        // Replies received: those with has_replied = true
        const repliesReceivedCount = leads.filter(l => l.has_replied).length;

        // Meetings booked: those with appointment_at filled
        const meetingsBookedCount = leads.filter(
          l => l.appointment_at && l.appointment_at.trim() !== ''
        ).length;

        const stats: LeadStatistics = {
          total: leads.length,
          pendingReview: pendingReviewCount,
          emailsSent: emailsSentCount,
          repliesReceived: repliesReceivedCount,
          meetingsBooked: meetingsBookedCount,
          thisWeek: leads.filter(l => l.created_at && new Date(l.created_at) >= weekStart).length,
          thisMonth: leads.filter(l => l.created_at && new Date(l.created_at) >= monthStart).length,
        };

        setStatistics(stats);

        // Get pending drafts: leads with "Email Drafted" field filled
        const pending = leads.filter(
          l => l['Email Drafted'] &&
               l['Email Drafted'].trim() !== '' &&
               l.draft_status !== 'sent' &&
               l.draft_status !== 'rejected'
        );

        console.log(`Found ${pending.length} pending drafts:`);
        pending.forEach(lead => {
          console.log(`- ${lead.Name} (${lead.Email}): draft_status=${lead.draft_status}`);
        });

        setPendingDrafts(pending);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleViewFull = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const extractSubject = (htmlContent: string): string => {
    // Try to extract subject from email or use default
    const subjectMatch = htmlContent?.match(/<title>(.*?)<\/title>/i);
    if (subjectMatch) return subjectMatch[1];

    // Default subject
    return 'Partnership Opportunity';
  };

  const handleSendEmail = async (lead: Lead, subject: string, htmlBody: string) => {
    try {
      // CRITICAL: Prevent re-contacting leads that were already contacted
      if (lead.lead_status === 'contacted' || lead.draft_status === 'sent') {
        const confirmRecontact = window.confirm(
          `⚠️ WARNING: This lead was already contacted on ${lead.draft_sent_at ? new Date(lead.draft_sent_at).toLocaleDateString() : 'a previous date'}.\n\nAre you SURE you want to send another email to ${lead.Email}?`
        );
        if (!confirmRecontact) {
          return;
        }
      }

      // Call n8n webhook to send email
      if (!N8N_WEBHOOK_URL) {
        throw new Error('n8n webhook URL not configured. Please set VITE_N8N_SEND_EMAIL_WEBHOOK in .env');
      }

      console.log('Sending email to:', lead.Email);
      console.log('Subject:', subject);
      console.log('Webhook URL:', N8N_WEBHOOK_URL);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: lead.Email,
          subject: subject,
          htmlBody: htmlBody,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email via n8n webhook: ${response.statusText}`);
      }

      // Update Supabase: mark as sent
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          draft_status: 'sent',
          draft_sent_at: new Date().toISOString(),
          lead_status: 'contacted',
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) throw error;

      console.log(`✅ Email sent! Updated lead ID ${lead.id} to 'sent' status`);
      showToast(`Email sent successfully to ${lead.Email}`, 'success');

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error sending email:', error);
      showToast(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      throw error;
    }
  };

  const handleSaveDraft = async (lead: Lead, subject: string, htmlBody: string) => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          'Email Drafted': htmlBody,
          draft_subject: subject,
        })
        .eq('id', lead.id);

      if (error) throw error;

      showToast('Draft saved successfully', 'success');
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Failed to save draft', 'error');
      throw error;
    }
  };

  const handleRejectDraft = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to reject the draft for ${lead.Name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          draft_status: 'rejected',
        })
        .eq('id', lead.id);

      if (error) throw error;

      console.log(`✅ Draft rejected! Updated lead ID ${lead.id} to 'rejected' status`);
      showToast('Draft rejected', 'success');

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting draft:', error);
      showToast('Failed to reject draft', 'error');
    }
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: statistics.total,
      icon: Users,
      gradient: 'from-cyan-500 to-blue-600',
      iconColor: 'text-cyan-400',
      glow: 'shadow-cyan-500/50',
    },
    {
      title: 'Pending Review',
      value: statistics.pendingReview,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-400',
      glow: 'shadow-amber-500/50',
    },
    {
      title: 'Emails Sent',
      value: statistics.emailsSent,
      icon: Mail,
      gradient: 'from-purple-500 to-pink-600',
      iconColor: 'text-purple-400',
      glow: 'shadow-purple-500/50',
    },
    {
      title: 'Replies Received',
      value: statistics.repliesReceived,
      icon: MessageSquare,
      gradient: 'from-emerald-500 to-teal-600',
      iconColor: 'text-emerald-400',
      glow: 'shadow-emerald-500/50',
    },
    {
      title: 'Meetings Booked',
      value: statistics.meetingsBooked,
      icon: Calendar,
      gradient: 'from-blue-500 to-indigo-600',
      iconColor: 'text-blue-400',
      glow: 'shadow-blue-500/50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">RatioX Lead Intelligence</h1>
              <p className="text-slate-400">Review and approve AI-drafted emails before sending</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-2xl hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 transition-all text-lg font-bold shadow-2xl shadow-cyan-500/50 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                <Zap className="text-white" size={24} />
              </div>
              <span>Generate New Leads</span>
              <Plus size={24} />
            </motion.button>
          </div>
        </motion.div>

        {/* Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl glass border ${
              toast.type === 'success'
                ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'border-red-500/50 shadow-lg shadow-red-500/20'
            } flex items-center gap-3`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-400" />
            ) : (
              <AlertCircle size={20} className="text-red-400" />
            )}
            <span className="text-slate-100">{toast.message}</span>
          </motion.div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.glow} group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <TrendingUp className={`${card.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} size={20} />
                </div>
                <p className="text-3xl font-bold text-slate-100 mb-1">{card.value}</p>
                <h3 className="text-slate-400 font-medium text-sm">{card.title}</h3>
              </motion.div>
            );
          })}
        </div>

        {/* Pending Drafts Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Pending Drafts</h2>
            {pendingDrafts.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 glass border border-amber-500/50 text-amber-400 rounded-full text-sm font-semibold shadow-lg shadow-amber-500/20"
              >
                {pendingDrafts.length} awaiting review
              </motion.span>
            )}
          </div>

          {pendingDrafts.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-2xl border border-slate-700/50 p-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">All caught up!</h3>
              <p className="text-slate-400">No pending drafts to review at the moment.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingDrafts.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DraftCard
                    lead={lead}
                    onViewFull={() => handleViewFull(lead)}
                    onEdit={() => handleViewFull(lead)}
                    onSend={() => {
                      const subject = lead.draft_subject || extractSubject(lead['Email Drafted'] || '');
                      handleSendEmail(lead, subject, lead['Email Drafted'] || '');
                    }}
                    onReject={() => handleRejectDraft(lead)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Draft Modal */}
        {selectedLead && (
          <DraftModal
            lead={selectedLead}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedLead(null);
            }}
            onSend={handleSendEmail}
            onSave={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
