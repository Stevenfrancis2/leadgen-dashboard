import React, { useState } from 'react';
import { LeadFormData } from '../types';
import { countries } from '../data/countries';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Building2, Hash } from 'lucide-react';

/**
 * RatioX Lead Generation Form - Redesigned
 */
interface LeadGenFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Lead Generation Form Component
 * Collects lead information and submits to webhook
 */
const LeadGenForm: React.FC<LeadGenFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    "Lead Type": "",
    "Country": "",
    "City": "",
    "number of results": 5,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

  /**
   * Validates form fields
   * Returns true if all validations pass
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!formData["Lead Type"].trim()) {
      newErrors["Lead Type"] = "Lead Type is required";
    }

    if (!formData["Country"].trim()) {
      newErrors["Country"] = "Country is required";
    }

    if (!formData["City"].trim()) {
      newErrors["City"] = "City is required";
    }

    if (formData["number of results"] < 1 || formData["number of results"] > 50) {
      newErrors["number of results"] = "Number of results must be between 1 and 50";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * Sends data to webhook URL from environment variable
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      onError("Please fill in all required fields correctly");
      return;
    }

    // Get webhook URL from environment variable
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;

    if (!webhookUrl) {
      onError("Webhook URL is not configured. Please set VITE_WEBHOOK_URL in your .env file");
      console.error("VITE_WEBHOOK_URL is not defined in environment variables");
      return;
    }

    setIsLoading(true);
    console.log("Submitting form data:", formData);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log("Response data:", responseData);

      if (response.ok) {
        onSuccess("Lead submitted successfully!");
        // Clear form after successful submission
        setFormData({
          "Lead Type": "",
          "Country": "",
          "City": "",
          "number of results": 5,
        });
        setErrors({});
      } else {
        onError(`Failed to submit lead: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      onError(`Error: ${error instanceof Error ? error.message : 'Failed to connect to webhook'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof LeadFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handles select dropdown changes
   */
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user selects
    if (errors[name as keyof LeadFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="text-cyan-400" size={32} />
            <h1 className="text-3xl font-bold gradient-text">Lead Generation</h1>
          </div>
          <p className="text-slate-400">Find your perfect leads with RatioX</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Type */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="Lead Type" className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Building2 size={16} className="text-cyan-400" />
              Lead Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="Lead Type"
              name="Lead Type"
              value={formData["Lead Type"]}
              onChange={handleChange}
              placeholder="e.g., Marketing Agencies"
              className={`input w-full ${errors["Lead Type"] ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors["Lead Type"] && (
              <p className="mt-1 text-sm text-red-400">{errors["Lead Type"]}</p>
            )}
          </motion.div>

          {/* Country */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="Country" className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-purple-400" />
              Country <span className="text-red-400">*</span>
            </label>
            <select
              id="Country"
              name="Country"
              value={formData["Country"]}
              onChange={handleSelectChange}
              className={`input w-full appearance-none ${errors["Country"] ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            >
              <option value="">Select a country...</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors["Country"] && (
              <p className="mt-1 text-sm text-red-400">{errors["Country"]}</p>
            )}
          </motion.div>

          {/* City */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="City" className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-emerald-400" />
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="City"
              name="City"
              value={formData["City"]}
              onChange={handleChange}
              placeholder="e.g., Beirut"
              className={`input w-full ${errors["City"] ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors["City"] && (
              <p className="mt-1 text-sm text-red-400">{errors["City"]}</p>
            )}
          </motion.div>

          {/* Number of Results */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label htmlFor="number of results" className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Hash size={16} className="text-amber-400" />
              Number of Results <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="number of results"
              name="number of results"
              value={formData["number of results"]}
              onChange={handleChange}
              min="1"
              max="50"
              className={`input w-full ${errors["number of results"] ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors["number of results"] && (
              <p className="mt-1 text-sm text-red-400">{errors["number of results"]}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Min: 1, Max: 50</p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Leads</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default LeadGenForm;
