import { cn } from '@/lib/utils';

type Status = 'FIXED' | 'FAILED' | 'ANALYZING' | 'DETECTED' | 'FIXING' | 'success' | 'failed' | 'pending';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  FIXED: { label: 'Fixed', className: 'badge-fixed' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
  ANALYZING: { label: 'Analyzing', className: 'badge-analyzing' },
  DETECTED: { label: 'Detected', className: 'badge-detected' },
  FIXING: { label: 'Fixing', className: 'badge-fixing' },
  success: { label: 'Success', className: 'badge-fixed' },
  failed: { label: 'Failed', className: 'badge-failed' },
  pending: { label: 'Pending', className: 'badge-analyzing' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
