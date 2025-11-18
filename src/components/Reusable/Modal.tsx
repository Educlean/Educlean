import { motion, AnimatePresence } from "framer-motion";

export interface ModalData {
  text: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function Modal({
  text,
  title,
  isOpen,
  onClose,
  className = "",
}: ModalData) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Contenedor centrado */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-[90%] ${className}`}
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                {title}
              </h2>
              <p className="text-gray-600 mb-6">{text}</p>

              <button
                onClick={onClose}
                className="bg-[var(--primary)] text-white px-6 py-2 rounded-xl hover:scale-110 hover:cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
