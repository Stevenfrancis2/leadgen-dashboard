import { Eye, Edit, Send, X, Clock, MapPin, Briefcase, Phone, Globe } from 'lucide-react';
import { Lead } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface DraftCardProps {
  lead: Lead;
  onViewFull: () => void;
  onEdit: () => void;
  onSend: () => void;
  onReject: () => void;
}

const DraftCard = ({ lead, onViewFull, onEdit, onSend, onReject }: DraftCardProps) => {
  const getPreview = (html: string, maxLength: number = 150) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const timeAgo = lead.created_at
    ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
    : 'Unknown';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 relative overflow-hidden group"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-600" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-slate-100 mb-1">
              {lead.Name}
            </h3>
            <p className="text-sm text-cyan-400">{lead.Email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              {lead['Phone Number'] && (
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-emerald-400" />
                  {lead['Phone Number']}
                </span>
              )}
              {lead['Website URL'] && (
                <a
                  href={lead['Website URL']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe size={12} className="text-blue-400" />
                  Website
                </a>
              )}
              {lead.Location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {lead.Location}
                </span>
              )}
              {lead.Industry && (
                <span className="flex items-center gap-1">
                  <Briefcase size={12} />
                  {lead.Industry}
                </span>
              )}
            </div>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-3 py-1 glass border border-amber-500/50 text-amber-400 rounded-full text-xs font-semibold shadow-lg shadow-amber-500/20"
          >
            Pending
          </motion.span>
        </div>

        {/* Subject */}
        {lead.draft_subject && (
          <div className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm font-medium text-slate-300">
              <span className="text-slate-500">Subject:</span> {lead.draft_subject}
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="mb-4 p-4 rounded-lg bg-slate-900/30 border border-slate-700/30">
          <p className="text-sm text-slate-300 leading-relaxed">
            {getPreview(lead['Email Drafted'] || '')}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewFull}
            className="flex items-center justify-center gap-2 px-4 py-2 glass border border-slate-600 text-slate-300 rounded-lg hover:border-cyan-500/50 hover:text-cyan-400 transition-all text-sm font-medium"
          >
            <Eye size={16} />
            View Full
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex items-center justify-center gap-2 px-4 py-2 glass border border-slate-600 text-slate-300 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-all text-sm font-medium"
          >
            <Edit size={16} />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSend}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all text-sm font-semibold shadow-lg shadow-emerald-500/30"
          >
            <Send size={16} />
            Send
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all text-sm font-semibold shadow-lg shadow-red-500/30"
          >
            <X size={16} />
            Reject
          </motion.button>
        </div>

        {/* Timestamp */}
        <div className="flex items-center text-xs text-slate-500">
          <Clock size={14} className="mr-1" />
          Created {timeAgo}
        </div>
      </div>
    </motion.div>
  );
};

export default DraftCard;
