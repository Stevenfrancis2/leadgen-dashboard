import React from 'react';
import Toast from './Toast';
import { Toast as ToastType } from '../types';

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

/**
 * Container component for managing multiple toast notifications
 * Positions toasts in the top-right corner of the screen
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
