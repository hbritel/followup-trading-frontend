import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5',
      'text-xs font-medium text-blue-400 border border-blue-500/25',
      className,
    )}
  >
    <ShieldCheck className="w-3.5 h-3.5" />
    Verified
  </span>
);

export default VerifiedBadge;
