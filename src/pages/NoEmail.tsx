import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { Search, Phone, MapPin, Briefcase, Globe, Linkedin, Instagram, Twitter, Facebook, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const NoEmail = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const TABLE_NAME = 'lead_agent1';

  useEffect(() => {
    fetchLeadsWithoutEmail();

    // Set up real-time subscription
    const channel = supabase
      .channel('no-email-leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        fetchLeadsWithoutEmail();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm]);

  const fetchLeadsWithoutEmail = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .or('Email.is.null,Email.eq.')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads without email:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let result = [...leads];

    if (searchTerm) {
      result = result.filter(
        (lead) =>
          lead.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.Industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead['Phone Number']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead['Website URL']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full"
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
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-red-500" size={36} />
            <h1 className="text-4xl font-bold text-red-400">No Email Found</h1>
          </div>
          <p className="text-slate-400">Leads where no email address was found - contact via phone or other methods</p>
        </motion.div>

        {/* Search and Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-slate-700/50 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={20} />
              <input
                type="text"
                placeholder="Search by name, location, industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-12 pr-4 py-3 text-base"
              />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center md:justify-end">
              <span className="text-slate-300 font-semibold text-base">
                <span className="text-red-400 text-lg">{filteredLeads.length}</span> leads without email
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
            <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-300 text-lg">
              {searchTerm ? 'No matching leads found' : 'Great! All leads have email addresses'}
            </p>
            <p className="text-slate-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'No action needed for this section'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-8 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 relative overflow-hidden group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* No Email Badge */}
                <div className="absolute top-6 right-6">
                  <span className="badge bg-gradient-to-r from-red-500 to-orange-600 text-white border-0 flex items-center gap-1 shadow-lg shadow-red-500/30">
                    <AlertCircle size={12} />
                    No Email
                  </span>
                </div>

                <div className="relative z-10">
                  {/* Name & Avatar */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/30 flex-shrink-0">
                      {lead.Name?.charAt(0).toUpperCase() || 'L'}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-xl text-slate-100 truncate mb-1">
                        {lead.Name || 'Unknown Business'}
                      </h3>
                      <p className="text-base text-red-400 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Email not found
                      </p>
                    </div>
                  </div>

                  {/* PRIORITY: Phone Number */}
                  {lead['Phone Number'] && (
                    <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 mb-2 font-semibold">PRIMARY CONTACT:</p>
                      <a
                        href={`tel:${lead['Phone Number']}`}
                        className="flex items-center gap-3 text-lg text-slate-100 hover:text-emerald-400 transition-colors font-semibold"
                      >
                        <Phone size={20} className="text-emerald-400 flex-shrink-0" />
                        {lead['Phone Number']}
                      </a>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-3 mb-5">
                    {lead.Location && (
                      <div className="flex items-center gap-3 text-base text-slate-300">
                        <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                        <span className="truncate font-semibold">{lead.Location}</span>
                      </div>
                    )}
                    {lead.Country && (
                      <div className="flex items-center gap-3 text-base text-slate-400">
                        <Globe size={16} className="flex-shrink-0" />
                        <span className="truncate">{lead.Country}</span>
                      </div>
                    )}
                    {lead.Industry && (
                      <div className="flex items-center gap-3 text-base text-slate-300">
                        <Briefcase size={16} className="text-purple-400 flex-shrink-0" />
                        <span className="truncate font-semibold">{lead.Industry}</span>
                      </div>
                    )}
                    {lead['Website URL'] && (
                      <div className="flex items-center gap-3 text-base">
                        <Globe size={16} className="text-cyan-400 flex-shrink-0" />
                        <a
                          href={lead['Website URL']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 truncate flex items-center gap-2 transition-colors"
                        >
                          <span className="truncate">Visit Website</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {lead['LinkedIn URL'] && (
                      <a
                        href={lead['LinkedIn URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg glass border border-slate-600 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
                        title="LinkedIn"
                      >
                        <Linkedin size={18} className="text-blue-400" />
                      </a>
                    )}
                    {lead['Instagram URL'] && (
                      <a
                        href={lead['Instagram URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg glass border border-slate-600 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all"
                        title="Instagram"
                      >
                        <Instagram size={18} className="text-pink-400" />
                      </a>
                    )}
                    {lead['Twitter URL'] && (
                      <a
                        href={lead['Twitter URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg glass border border-slate-600 hover:border-sky-500/50 hover:bg-sky-500/10 transition-all"
                        title="Twitter"
                      >
                        <Twitter size={18} className="text-sky-400" />
                      </a>
                    )}
                    {lead['Facebook URL'] && (
                      <a
                        href={lead['Facebook URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg glass border border-slate-600 hover:border-blue-600/50 hover:bg-blue-600/10 transition-all"
                        title="Facebook"
                      >
                        <Facebook size={18} className="text-blue-500" />
                      </a>
                    )}
                  </div>

                  {/* Timestamp */}
                  {lead.created_at && (
                    <div className="text-sm text-slate-500">
                      Added: {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoEmail;
