import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

export function Toast({ toasts, removeToast }) {
  // 🔧 useEffect para eliminar solo los que tienen autoClose === true
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.autoClose)
      .map((toast) => setTimeout(() => removeToast(toast.id), 3000));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts?.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            role="alert"
            className={`relative min-w-[260px] max-w-xs px-4 py-3 rounded shadow-lg text-white font-semibold flex items-start gap-2 ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {/* Icono + mensaje */}
            <div className="flex items-start gap-2 pr-6">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5 text-white mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-white mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="whitespace-pre-line">{toast.message}</span>
            </div>

            {/* Botón de cerrar */}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-white hover:text-white text-lg font-bold"
              aria-label="Cerrar"
            >
              ✖
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}