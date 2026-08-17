import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInteractionState } from '../../stores/interactionStore';
import { SecurityDoorModal } from './SecurityDoorModal';
import { DebugTerminal } from '../DebugTerminal';
import { MemoryViewerModal } from './MemoryViewerModal';
import { ServerNodeModal } from './ServerNodeModal';
import { soundEngine } from '../../services/soundEngine';

export const InteractionModalContainer: React.FC = () => {
  const { activeModal, closeModal, updateObject } = useInteractionState();

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        soundEngine.playKeyTick();
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

  return (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#05070B]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 cursor-default"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundEngine.playKeyTick();
              closeModal();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full flex items-center justify-center"
          >
            {activeModal.type === 'DOOR' && (
              <SecurityDoorModal onClose={closeModal} />
            )}
            {activeModal.type === 'TERMINAL' && (
              <DebugTerminal onClose={closeModal} />
            )}
            {activeModal.type === 'MEMORY' && (
              <MemoryViewerModal
                data={activeModal}
                onClose={closeModal}
                onUpdateRecovery={(newVal) =>
                  updateObject(activeModal.id, { recoveryPercentage: newVal })
                }
              />
            )}
            {activeModal.type === 'SERVER' && (
              <ServerNodeModal data={activeModal} onClose={closeModal} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InteractionModalContainer;
