import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { Mail, Send, Calendar, User, Eye, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const SentEmails = () => {
  const [sentEmails, setSentEmails] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Lead | null>(null);

  const TABLE_NAME = 'lead_agent1';

  useEffect(() => {
    fetchSentEmails();

    // Set up real-time subscription
    const channel = supabase
      .channel('sent-emails-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        fetchSentEmails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSentEmails = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('draft_status', 'sent')
        .order('draft_sent_at', { ascending: false });

      if (error) throw error;
      if (data) setSentEmails(data);
    } catch (error) {
      console.error('Error fetching sent emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmailPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Send className="text-cyan-400" size={36} />
            <h1 className="text-4xl font-bold gradient-text">Sent Emails</h1>
          </div>
          <p className="text-slate-400">View all emails sent to your leads</p>
          <div className="mt-4">
            <span className="text-2xl font-bold text-cyan-400">{sentEmails.length}</span>
            <span className="text-slate-400 ml-2">emails sent</span>
          </div>
        </motion.div>

        {/* Emails Grid */}
        {sentEmails.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-slate-700/50 p-12 text-center"
          >
            <Send size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">No Sent Emails</h3>
            <p className="text-slate-400">Emails you send to leads will appear here</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sentEmails.map((email, index) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/30 flex-shrink-0">
                      {email.Name?.charAt(0).toUpperCase() || 'L'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-slate-500 flex-shrink-0" />
                        <h3 className="font-bold text-lg text-slate-100 truncate">{email.Name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-cyan-400 text-sm">
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{email.Email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {email.draft_sent_at && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar size={14} />
                        <span>{format(new Date(email.draft_sent_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {email.draft_sent_at && format(new Date(email.draft_sent_at), 'HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded"></div>
                    <h4 className="font-semibold text-slate-200">{email.draft_subject || 'No Subject'}</h4>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2 ml-3">
                    {getEmailPreview(email['Email Drafted'] || '')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {email.has_replied && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Mail size={12} />
                        Replied
                      </span>
                    )}
                    {email.Location && (
                      <span>{email.Location}</span>
                    )}
                    {email.Industry && (
                      <span>{email.Industry}</span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm font-medium"
                  >
                    <Eye size={14} />
                    View Full
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Email Modal */}
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass border border-slate-700/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold gradient-text">Email Details</h2>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User size={16} className="text-purple-400" />
                    <span className="font-medium text-slate-400">To:</span>
                    <span>{selectedEmail.Name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail size={16} className="text-cyan-400" />
                    <span className="font-medium text-slate-400">Email:</span>
                    <span>{selectedEmail.Email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={16} className="text-emerald-400" />
                    <span className="font-medium text-slate-400">Sent:</span>
                    <span>
                      {selectedEmail.draft_sent_at && format(new Date(selectedEmail.draft_sent_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {selectedEmail['Website URL'] && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <ExternalLink size={16} className="text-blue-400" />
                      <a
                        href={selectedEmail['Website URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Subject</label>
                  <p className="text-lg text-slate-100 font-semibold">{selectedEmail.draft_subject || 'No Subject'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email Content</label>
                  <div
                    className="glass border border-slate-700/50 rounded-xl p-6 bg-slate-900/30"
                    dangerouslySetInnerHTML={{ __html: selectedEmail['Email Drafted'] || '' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SentEmails;
