import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const Analytics = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase')) {
      setIsSupabaseConfigured(false);
      setLoading(false);
      return;
    }

    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_agent1')
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

  // Status distribution data
  const statusData = [
    { name: 'New', value: leads.filter(l => l.lead_status === 'new').length, color: '#FBBF24' },
    { name: 'Contacted', value: leads.filter(l => l.lead_status === 'contacted').length, color: '#A855F7' },
    { name: 'Replied', value: leads.filter(l => l.lead_status === 'replied' || l.has_replied).length, color: '#10B981' },
    { name: 'Meeting Booked', value: leads.filter(l => l.lead_status === 'meeting_booked').length, color: '#3B82F6' },
    { name: 'Closed', value: leads.filter(l => l.lead_status === 'closed').length, color: '#059669' },
  ];

  // Leads by country
  const countryData = leads.reduce((acc, lead) => {
    const country = lead.Country || lead.Location || 'Unknown';
    const existing = acc.find(item => item.name === country);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: country, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[])
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

  // Leads over time (last 14 days)
  const timeData = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 13 - i));
    const count = leads.filter(lead => {
      const leadDate = startOfDay(new Date(lead.created_at));
      return leadDate.getTime() === date.getTime();
    }).length;

    return {
      date: format(date, 'MMM dd'),
      leads: count,
    };
  });

  // Conversion funnel
  const funnelData = [
    { name: 'Total Leads', value: leads.length },
    { name: 'Contacted', value: leads.filter(l => l.draft_status === 'sent').length },
    { name: 'Replied', value: leads.filter(l => l.has_replied).length },
    { name: 'Meetings Booked', value: leads.filter(l => l.appointment_at).length },
  ];

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Supabase Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please configure Supabase to view analytics. Check the <code className="bg-gray-100 px-2 py-1 rounded">SUPABASE_SETUP.md</code> file for instructions.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics</h1>
          <p className="text-gray-600">Insights and trends from your lead data</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Activity className="text-purple-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Lead Status Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leads Over Time */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="text-blue-600 mr-2" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Leads Over Time (14 Days)</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full Width Charts */}
        <div className="space-y-6">
          {/* Leads by Country */}
          {countryData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Top Countries</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Conversion Funnel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10B981" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-600 font-medium mb-2">Emails Sent</h3>
            <p className="text-3xl font-bold text-purple-600">
              {leads.filter(l => l.draft_status === 'sent').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total outreach emails</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-600 font-medium mb-2">Reply Rate</h3>
            <p className="text-3xl font-bold text-blue-600">
              {leads.filter(l => l.draft_status === 'sent').length > 0
                ? ((leads.filter(l => l.has_replied).length /
                    leads.filter(l => l.draft_status === 'sent').length) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Leads who replied</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-600 font-medium mb-2">Total Replies</h3>
            <p className="text-3xl font-bold text-green-600">
              {leads.filter(l => l.has_replied).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Leads engaged</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-600 font-medium mb-2">Meeting Rate</h3>
            <p className="text-3xl font-bold text-orange-600">
              {leads.filter(l => l.has_replied).length > 0
                ? ((leads.filter(l => l.appointment_at).length /
                    leads.filter(l => l.has_replied).length) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Replies to meetings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
