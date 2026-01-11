import { useState } from 'react';
import { X, Send, Save, Mail, User, MapPin, Briefcase, MessageSquare, Clock, Phone, Globe } from 'lucide-react';
import { Lead } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface DraftModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSend: (lead: Lead, subject: string, htmlBody: string) => Promise<void>;
  onSave: (lead: Lead, subject: string, htmlBody: string) => Promise<void>;
}

const DraftModal = ({ lead, isOpen, onClose, onSend, onSave }: DraftModalProps) => {
  const [subject, setSubject] = useState(lead.draft_subject || 'Partnership Opportunity');
  const [htmlBody, setHtmlBody] = useState(lead['Email Drafted'] || '');
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(lead, subject, htmlBody);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(lead, subject, htmlBody);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass border border-slate-700/50 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-3">Review Draft</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={16} className="text-cyan-400" />
                  <span className="font-medium text-slate-400">To:</span>
                  <span>{lead.Email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <User size={16} className="text-purple-400" />
                  <span className="font-medium text-slate-400">Name:</span>
                  <span>{lead.Name}</span>
                </div>
                {lead['Phone Number'] && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Phone size={16} className="text-emerald-400" />
                    <span className="font-medium text-slate-400">Phone:</span>
                    <span>{lead['Phone Number']}</span>
                  </div>
                )}
                {lead['Website URL'] && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Globe size={16} className="text-blue-400" />
                    <span className="font-medium text-slate-400">Website:</span>
                    <a
                      href={lead['Website URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    >
                      {lead['Website URL']}
                    </a>
                  </div>
                )}
                {lead.Location && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={16} className="text-emerald-400" />
                    <span className="font-medium text-slate-400">Location:</span>
                    <span>{lead.Location}</span>
                  </div>
                )}
                {lead.Industry && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Briefcase size={16} className="text-amber-400" />
                    <span className="font-medium text-slate-400">Industry:</span>
                    <span>{lead.Industry}</span>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-800/50"
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Lead Reply Section - Show if lead has replied */}
            {lead.has_replied && lead['Lead Reply 1'] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-emerald-500/50 rounded-xl p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={20} className="text-emerald-400" />
                  <h3 className="text-lg font-bold text-emerald-400">Lead Replied!</h3>
                  {lead.first_reply_at && (
                    <div className="flex items-center gap-1 ml-auto text-sm text-slate-400">
                      <Clock size={14} />
                      {format(new Date(lead.first_reply_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {lead['Lead Reply 1']}
                  </p>
                </div>
                {lead.reply_count && lead.reply_count > 1 && (
                  <div className="mt-2 text-xs text-slate-400">
                    Total replies: {lead.reply_count}
                  </div>
                )}
              </motion.div>
            )}

            {/* Subject Line */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input w-full"
                placeholder="Email subject..."
              />
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Content (HTML)
              </label>
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={12}
                className="input w-full font-mono text-xs"
                placeholder="Email HTML content..."
              />
            </div>

            {/* HTML Preview */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Preview
              </label>
              <div
                className="glass border border-slate-700/50 rounded-xl p-6 bg-slate-900/30 min-h-[300px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-700/50 glass">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-2 text-slate-300 hover:text-slate-100 font-medium transition-colors"
            >
              Cancel
            </motion.button>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-500 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-500/20 font-semibold"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isSending || !subject || !htmlBody}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 font-semibold"
              >
                <Send size={18} />
                {isSending ? 'Sending...' : 'Send Now'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DraftModal;
