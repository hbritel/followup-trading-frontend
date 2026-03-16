import React from 'react';
import { cn } from '@/lib/utils';

interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerMs?: number;
  className?: string;
}

const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  staggerMs = 50,
  className,
}) => {
  const staggeredChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const delay = index * staggerMs;

    return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties; className?: string }>, {
      style: {
        ...(child.props as { style?: React.CSSProperties }).style,
        animation: `slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${delay}ms`,
        opacity: 0,
      },
    });
  });

  return (
    <div className={cn(className)}>
      {staggeredChildren}
    </div>
  );
};

export default StaggerChildren;
