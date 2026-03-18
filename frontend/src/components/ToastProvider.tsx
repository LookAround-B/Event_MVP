import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: {
          style: {
            background: '#065f46',
            color: '#d1fae5',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#065f46',
          },
        },
        error: {
          style: {
            background: '#7f1d1d',
            color: '#fee2e2',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#7f1d1d',
          },
        },
        loading: {
          style: {
            background: '#1e3a8a',
            color: '#dbeafe',
          },
        },
      }}
    />
  );
}
