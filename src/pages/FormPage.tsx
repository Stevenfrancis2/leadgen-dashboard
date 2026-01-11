import { useState } from 'react';
import LeadGenForm from '../components/LeadGenForm';
import ToastContainer from '../components/ToastContainer';
import { Toast, ToastType } from '../types';

const FormPage = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const newToast: Toast = {
      id: Date.now().toString(),
      message,
      type,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleSuccess = (message: string) => {
    addToast(message, 'success');
  };

  const handleError = (message: string) => {
    addToast(message, 'error');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <LeadGenForm onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
};

export default FormPage;
