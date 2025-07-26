import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
  fading?: boolean;
}

interface ToastContextProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextProps>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, fading: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== id));
      }, 400); // match fade-out duration
    }, 2600);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-up ${toast.fading ? 'animate-fade-out-down' : ''} ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ minWidth: 200 }}
          >
            {toast.message}
            <button
              className="absolute top-1 right-2 text-white text-lg font-bold opacity-60 hover:opacity-100 focus:outline-none"
              aria-label="Dismiss notification"
              onClick={() => {
                setToasts((prev) =>
                  prev.map((t) => t.id === toast.id ? { ...t, fading: true } : t)
                );
                setTimeout(() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }, 400);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fade-out-down {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(30px); }
        }
        .animate-fade-out-down {
          animation: fade-out-down 0.4s cubic-bezier(.4,0,.2,1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
