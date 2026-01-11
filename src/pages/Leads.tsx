import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { Search, Filter, Mail, Eye, Trash2, CheckCircle2, Clock, Send, Phone, Globe, MapPin, Briefcase, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import DraftModal from '../components/DraftModal';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TABLE_NAME = 'lead_agent1';
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_SEND_EMAIL_WEBHOOK;

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription
    const channel = supabase
      .channel('leads-table-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let result = [...leads];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (lead) =>
          lead.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.Industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead['Phone Number']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead['Website URL']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by draft status
    if (statusFilter !== 'all') {
      if (statusFilter === 'has_draft') {
        result = result.filter((lead) => lead['Email Drafted'] && lead['Email Drafted'].trim() !== '');
      } else if (statusFilter === 'no_draft') {
        result = result.filter((lead) => !lead['Email Drafted'] || lead['Email Drafted'].trim() === '');
      } else if (statusFilter === 'sent') {
        result = result.filter((lead) => lead.draft_status === 'sent');
      } else if (statusFilter === 'pending') {
        result = result.filter((lead) => lead.draft_status === 'pending_review');
      } else if (statusFilter === 'replied') {
        result = result.filter((lead) => lead['Lead Reply 1'] && lead['Lead Reply 1'].trim() !== '');
      }
    }

    setFilteredLeads(result);
  };

  const deleteLead = async (leadId: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', leadId);

      if (error) throw error;
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleViewDraft = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleSendEmail = async (lead: Lead, subject: string, htmlBody: string) => {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('n8n webhook URL not configured');
      }

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
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

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

      alert(`Email sent successfully to ${lead.Email}`);
      fetchLeads();
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      alert('Draft saved successfully');
      fetchLeads();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
      throw error;
    }
  };

  const getStatusBadge = (lead: Lead) => {
    // Priority order: Replied > Sent > Pending > Drafted > New
    if (lead.has_replied) {
      return {
        className: 'badge bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 flex items-center gap-1 shadow-lg shadow-emerald-500/30 animate-pulse',
        icon: <CheckCircle2 size={12} />,
        label: `Replied ${lead.reply_count && lead.reply_count > 1 ? `(${lead.reply_count}x)` : ''}`
      };
    }
    if (lead.draft_status === 'sent') {
      return {
        className: 'badge badge-success flex items-center gap-1',
        icon: <Send size={12} />,
        label: 'Sent'
      };
    }
    if (lead.draft_status === 'pending_review') {
      return {
        className: 'badge badge-warning flex items-center gap-1',
        icon: <Clock size={12} />,
        label: 'Pending'
      };
    }
    if (lead['Email Drafted'] && lead['Email Drafted'].trim() !== '') {
      return {
        className: 'badge badge-purple flex items-center gap-1',
        icon: <Mail size={12} />,
        label: 'Drafted'
      };
    }
    return {
      className: 'badge bg-slate-500/20 text-slate-400 border border-slate-500/30 flex items-center gap-1',
      icon: null,
      label: 'New'
    };
  };

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
          <h1 className="text-4xl font-bold gradient-text mb-2">All Leads</h1>
          <p className="text-slate-400">Manage and track all your leads in one place</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-slate-700/50 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-12 pr-4 py-3 text-base"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full pl-12 pr-4 py-3 text-base appearance-none cursor-pointer"
              >
                <option value="all">All Leads</option>
                <option value="has_draft">Has Draft</option>
                <option value="no_draft">No Draft</option>
                <option value="pending">Pending Review</option>
                <option value="sent">Sent</option>
                <option value="replied">Replied</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center md:justify-end">
              <span className="text-slate-300 font-semibold text-base">
                <span className="text-cyan-400 text-lg">{filteredLeads.length}</span> of {leads.length} leads
              </span>
            </div>
          </div>
        </motion.div>

        {/* Leads Grid */}
        {filteredLeads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-slate-700/50 overflow-hidden text-center py-12"
          >
            <Search size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-300 text-lg">No leads found</p>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead, index) => {
              const status = getStatusBadge(lead);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-2xl p-8 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 relative overflow-hidden group"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Status Badge */}
                  <div className="absolute top-6 right-6">
                    <span className={status.className}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="relative z-10">
                    {/* Name & Avatar */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30 flex-shrink-0">
                        {lead.Name?.charAt(0).toUpperCase() || 'L'}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-xl text-slate-100 truncate mb-1">
                          {lead.Name || 'Unknown'}
                        </h3>
                        <p className="text-base text-cyan-400 truncate">{lead.Email || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-5">
                      {lead['Phone Number'] && (
                        <div className="flex items-center gap-3 text-base text-slate-300">
                          <Phone size={16} className="text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{lead['Phone Number']}</span>
                        </div>
                      )}
                      {lead['Website URL'] && (
                        <div className="flex items-center gap-3 text-base">
                          <Globe size={16} className="text-blue-400 flex-shrink-0" />
                          <a
                            href={lead['Website URL']}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 truncate flex items-center gap-2 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">Visit Website</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      )}
                      {lead.Location && (
                        <div className="flex items-center gap-3 text-base text-slate-400">
                          <MapPin size={16} className="flex-shrink-0" />
                          <span className="truncate">{lead.Location}</span>
                        </div>
                      )}
                      {lead.Industry && (
                        <div className="flex items-center gap-3 text-base text-slate-400">
                          <Briefcase size={16} className="flex-shrink-0" />
                          <span className="truncate">{lead.Industry}</span>
                        </div>
                      )}
                    </div>

                    {/* Draft Subject Preview */}
                    {lead.draft_subject && (
                      <div className="mb-5 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-2">Email Subject:</p>
                        <p className="text-base text-slate-300 truncate">{lead.draft_subject}</p>
                      </div>
                    )}

                    {/* Timestamp */}
                    {lead.created_at && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
                        <Clock size={14} />
                        <span>{format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-3">
                      {lead['Email Drafted'] ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDraft(lead)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all text-sm font-semibold shadow-lg shadow-cyan-500/30"
                          title="View Draft"
                        >
                          <Mail size={16} />
                          Draft
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDraft(lead)}
                          className="flex items-center justify-center gap-2 px-4 py-3 glass border border-slate-600 text-slate-400 rounded-lg hover:border-slate-500 transition-all text-sm font-medium"
                          title="No Draft"
                        >
                          <Mail size={16} />
                          No Draft
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDraft(lead)}
                        className="flex items-center justify-center gap-2 px-4 py-3 glass border border-slate-600 text-slate-300 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-all text-sm font-medium"
                        title="View Details"
                      >
                        <Eye size={16} />
                        View
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => lead.id && deleteLead(lead.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 glass border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm font-medium"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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

export default Leads;
