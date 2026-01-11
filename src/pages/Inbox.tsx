import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { Inbox as InboxIcon, MessageSquare, Calendar, User, Mail, Eye, ExternalLink, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const Inbox = () => {
  const [replies, setReplies] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<Lead | null>(null);

  const TABLE_NAME = 'lead_agent1';

  useEffect(() => {
    fetchReplies();

    // Set up real-time subscription
    const channel = supabase
      .channel('inbox-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        fetchReplies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('has_replied', true)
        .order('first_reply_at', { ascending: false });

      if (error) throw error;
      if (data) setReplies(data);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
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
            <InboxIcon className="text-emerald-400" size={36} />
            <h1 className="text-4xl font-bold gradient-text">Inbox</h1>
          </div>
          <p className="text-slate-400">Replies received from your leads</p>
          <div className="mt-4 flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-emerald-400">{replies.length}</span>
              <span className="text-slate-400 ml-2">total replies</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-purple-400">
                {replies.reduce((sum, lead) => sum + (lead.reply_count || 1), 0)}
              </span>
              <span className="text-slate-400 ml-2">total messages</span>
            </div>
          </div>
        </motion.div>

        {/* Replies Grid */}
        {replies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-slate-700/50 p-12 text-center"
          >
            <InboxIcon size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">No Replies Yet</h3>
            <p className="text-slate-400">When leads reply to your emails, they'll appear here</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {replies.map((reply, index) => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => setSelectedReply(reply)}
              >
                {/* Animated glow */}
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none"
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30 flex-shrink-0 relative">
                        {reply.Name?.charAt(0).toUpperCase() || 'L'}
                        {reply.reply_count && reply.reply_count > 1 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-900">
                            {reply.reply_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={14} className="text-slate-500 flex-shrink-0" />
                          <h3 className="font-bold text-lg text-slate-100 truncate">{reply.Name}</h3>
                          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <Mail size={14} className="flex-shrink-0" />
                          <span className="truncate">{reply.Email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {reply.first_reply_at && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar size={14} />
                          <span>{format(new Date(reply.first_reply_at), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        {reply.first_reply_at && format(new Date(reply.first_reply_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} className="text-emerald-400 flex-shrink-0" />
                      <h4 className="font-semibold text-slate-200">Lead Reply</h4>
                    </div>
                    <div className="glass border border-slate-700/50 rounded-lg p-4 bg-slate-900/50">
                      <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-3">
                        {reply['Lead Reply 1'] || 'No reply content'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {reply.appointment_at && (
                        <span className="flex items-center gap-1 text-blue-400 font-semibold">
                          <Calendar size={12} />
                          Meeting Scheduled
                        </span>
                      )}
                      {reply.Location && (
                        <span>{reply.Location}</span>
                      )}
                      {reply.Industry && (
                        <span>{reply.Industry}</span>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all text-sm font-medium"
                    >
                      <Eye size={14} />
                      View Full
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        {selectedReply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReply(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass border border-emerald-500/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400 animate-pulse" size={28} />
                    <h2 className="text-2xl font-bold gradient-text">Reply Details</h2>
                  </div>
                  <button
                    onClick={() => setSelectedReply(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User size={16} className="text-purple-400" />
                    <span className="font-medium text-slate-400">From:</span>
                    <span>{selectedReply.Name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail size={16} className="text-emerald-400" />
                    <span className="font-medium text-slate-400">Email:</span>
                    <span>{selectedReply.Email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={16} className="text-cyan-400" />
                    <span className="font-medium text-slate-400">Received:</span>
                    <span>
                      {selectedReply.first_reply_at && format(new Date(selectedReply.first_reply_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {selectedReply.reply_count && selectedReply.reply_count > 1 && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MessageSquare size={16} className="text-purple-400" />
                      <span className="font-medium text-slate-400">Total Replies:</span>
                      <span className="text-purple-400 font-bold">{selectedReply.reply_count}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Original Email Sent */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <Mail size={14} />
                    Original Email Sent
                  </label>
                  <div className="glass border border-slate-700/50 rounded-xl p-4 bg-slate-900/30">
                    <p className="text-sm font-semibold text-cyan-400 mb-2">
                      {selectedReply.draft_subject || 'No Subject'}
                    </p>
                    <div
                      className="text-sm text-slate-300"
                      dangerouslySetInnerHTML={{ __html: selectedReply['Email Drafted'] || 'No email content' }}
                    />
                  </div>
                </div>

                {/* Lead Reply */}
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-400" />
                    Lead Reply {selectedReply.reply_count && selectedReply.reply_count > 1 ? `(${selectedReply.reply_count} replies)` : ''}
                  </label>
                  <div className="glass border border-emerald-500/30 rounded-xl p-6 bg-emerald-900/10">
                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {selectedReply['Lead Reply 1'] || 'No reply content'}
                    </p>
                  </div>
                </div>

                {/* Additional info */}
                {selectedReply.appointment_at && (
                  <div className="glass border border-blue-500/30 rounded-xl p-4 bg-blue-900/10">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold">
                      <Calendar size={16} />
                      Meeting Scheduled: {selectedReply.appointment_at}
                    </div>
                  </div>
                )}

                {selectedReply['Website URL'] && (
                  <div>
                    <a
                      href={selectedReply['Website URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink size={16} />
                      Visit Lead's Website
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
