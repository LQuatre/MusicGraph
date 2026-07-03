import React from 'react';
import { motion } from 'framer-motion';
import * as Lucide from 'lucide-react';

export interface AnimatedIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
  className?: string;
  spinning?: boolean;
  animateOnHover?: boolean;
  animateOnTap?: boolean;
}

export interface AnimateIconProps {
  children: React.ReactNode;
  animateOnHover?: boolean;
  animateOnTap?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Merge helper to preserve parent layouts, margins, and vertical alignments
const mergeStyles = (style?: React.CSSProperties): React.CSSProperties => {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: style?.verticalAlign || 'middle',
    ...style
  };
};

// AnimateIcon Wrapper Component from animate-ui
export const AnimateIcon: React.FC<AnimateIconProps> = ({
  children,
  animateOnHover = true,
  animateOnTap = true,
  className,
  style,
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { scale: 1.1 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      {children}
    </motion.span>
  );
};

// Common helper to wrap icons in motion spans
const createAnimatedIcon = (
  LucideIcon: React.ComponentType<any>,
  hoverProps: any = { scale: 1.1 },
  tapProps: any = { scale: 0.95 },
  transitionProps: any = { type: 'spring', stiffness: 400, damping: 15 }
): React.FC<AnimatedIconProps> => {
  return ({ size, className, style, animateOnHover = true, animateOnTap = true, ...props }) => {
    return (
      <motion.span
        style={mergeStyles(style)}
        whileHover={animateOnHover ? hoverProps : undefined}
        whileTap={animateOnTap ? tapProps : undefined}
        transition={transitionProps}
        className={className}
      >
        <LucideIcon size={size} {...props} />
      </motion.span>
    );
  };
};

// Specialized animated icons
export const Search: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { scale: 1.15, rotate: 10 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      <Lucide.Search size={size} {...props} />
    </motion.span>
  );
};

export const ArrowRight: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { x: 4 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      <Lucide.ArrowRight size={size} {...props} />
    </motion.span>
  );
};

export const ArrowLeft: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { x: -4 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      <Lucide.ArrowLeft size={size} {...props} />
    </motion.span>
  );
};

export const RefreshCw: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  spinning,
  animateOnHover = true,
  ...props
}) => {
  const isSpinning = spinning || className?.includes('spinner');
  const cleanClassName = className ? className.replace(/\bspinner\b/g, '').trim() : '';
  return (
    <motion.span
      style={mergeStyles(style)}
      animate={isSpinning ? { rotate: 360 } : {}}
      transition={isSpinning ? { repeat: Infinity, duration: 1.2, ease: 'linear' } : {}}
      whileHover={(!isSpinning && animateOnHover) ? { rotate: 180 } : {}}
      className={cleanClassName}
    >
      <Lucide.RefreshCw size={size} {...props} />
    </motion.span>
  );
};

export const MapPin: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      className={className}
    >
      <Lucide.MapPin size={size} {...props} />
    </motion.span>
  );
};

export const Disc: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      whileHover={animateOnHover ? { scale: 1.15 } : undefined}
      className={className}
    >
      <Lucide.Disc size={size} {...props} />
    </motion.span>
  );
};

export const Music: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={
        animateOnHover
          ? {
              y: [0, -3, 3, -1, 0],
              rotate: [0, -5, 5, -2, 0],
            }
          : undefined
      }
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Lucide.Music size={size} {...props} />
    </motion.span>
  );
};

export const ShieldAlert: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={
        animateOnHover
          ? {
              x: [0, -3, 3, -3, 3, 0],
            }
          : undefined
      }
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Lucide.ShieldAlert size={size} {...props} />
    </motion.span>
  );
};

export const AlertCircle: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={
        animateOnHover
          ? {
              x: [0, -3, 3, -3, 3, 0],
            }
          : undefined
      }
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Lucide.AlertCircle size={size} {...props} />
    </motion.span>
  );
};

export const Tag: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { rotate: -15, scale: 1.1 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={className}
    >
      <Lucide.Tag size={size} {...props} />
    </motion.span>
  );
};

export const Download: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { y: 3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className={className}
    >
      <Lucide.Download size={size} {...props} />
    </motion.span>
  );
};

export const Check: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      whileHover={animateOnHover ? { scale: 1.15 } : undefined}
      className={className}
    >
      <Lucide.Check size={size} {...props} />
    </motion.span>
  );
};

export const BarChart3: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={
        animateOnHover
          ? { scaleY: [1, 1.25, 0.85, 1.15, 1], scaleX: [1, 0.9, 1.1, 1] }
          : undefined
      }
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Lucide.BarChart3 size={size} {...props} />
    </motion.span>
  );
};

export const TrendingUp: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { scale: 1.1, x: 2, y: -2 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      className={className}
    >
      <Lucide.TrendingUp size={size} {...props} />
    </motion.span>
  );
};

export const Home: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { y: -3, scale: 1.05 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      <Lucide.Home size={size} {...props} />
    </motion.span>
  );
};

export const Library: React.FC<AnimatedIconProps> = ({
  size,
  className,
  style,
  animateOnHover = true,
  animateOnTap = true,
  ...props
}) => {
  return (
    <motion.span
      style={mergeStyles(style)}
      whileHover={animateOnHover ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={animateOnTap ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={className}
    >
      <Lucide.Library size={size} {...props} />
    </motion.span>
  );
};

// Generic animations for standard icons
export const User = createAnimatedIcon(Lucide.User);
export const Users = createAnimatedIcon(Lucide.Users);
export const Calendar = createAnimatedIcon(Lucide.Calendar, { scale: 1.1, rotate: -5 });
export const HelpCircle = createAnimatedIcon(Lucide.HelpCircle, { scale: 1.1, rotate: 10 });
export const Eye = createAnimatedIcon(Lucide.Eye, { scale: 1.15 });
export const GitBranch = createAnimatedIcon(Lucide.GitBranch, { scale: 1.1, rotate: 15 });
export const Network = createAnimatedIcon(Lucide.Network, { scale: 1.1, rotate: 10 });
export const Layers = createAnimatedIcon(Lucide.Layers, { scale: 1.1, y: -2 });
