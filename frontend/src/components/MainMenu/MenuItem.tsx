import React from 'react';
import { motion } from 'framer-motion';

export interface MenuItemProps {
  id: string;
  label: string;
  subtext?: string;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  id,
  label,
  subtext,
  isSelected,
  onSelect,
  onHover,
}) => {
  return (
    <motion.button
      type="button"
      id={`menu-item-${id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full text-left py-2.5 px-3 flex items-center transition-all duration-150 rounded outline-none ${
        isSelected
          ? 'text-cyber-cyan'
          : 'text-cyber-textMuted hover:text-cyber-textDim'
      }`}
    >
      {/* Command Cursor & Prefix Indicator */}
      <div className="w-8 flex items-center font-mono font-bold text-lg select-none">
        {isSelected ? (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-cyber-cyan glow-cyan-sm flex items-center"
          >
            &gt;
            <span className="inline-block w-1.5 h-3.5 bg-cyber-cyan ml-0.5 animate-pulse" />
          </motion.span>
        ) : (
          <span className="text-transparent group-hover:text-cyber-cyan/30">&gt;</span>
        )}
      </div>

      {/* Main Command Label */}
      <div className="flex flex-col">
        <span
          className={`font-mono text-lg sm:text-xl font-bold tracking-widest uppercase transition-colors ${
            isSelected
              ? 'text-cyber-cyan glow-cyan-sm'
              : 'text-cyber-textMuted group-hover:text-cyber-textDim'
          }`}
        >
          {label}
        </span>
        {subtext && (
          <span
            className={`text-[11px] font-mono tracking-wider transition-opacity ${
              isSelected ? 'text-cyber-cyanDim opacity-90' : 'text-cyber-border opacity-60'
            }`}
          >
            {subtext}
          </span>
        )}
      </div>

      {/* Subtle selection background bar */}
      {isSelected && (
        <motion.div
          layoutId="active-menu-highlight"
          className="absolute inset-0 bg-cyber-cyan/5 border-l-2 border-cyber-cyan -z-10 rounded pointer-events-none"
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        />
      )}
    </motion.button>
  );
};

export default MenuItem;
