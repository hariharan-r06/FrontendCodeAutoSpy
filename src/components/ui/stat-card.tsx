import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  subtitle?: string;
}

const variantStyles = {
  primary: 'stat-card-primary',
  success: 'stat-card-success',
  danger: 'stat-card-danger',
  warning: 'stat-card-warning',
};

const iconStyles = {
  primary: 'text-primary',
  success: 'text-success',
  danger: 'text-destructive',
  warning: 'text-warning',
};

export function StatCard({ title, value, icon: Icon, variant = 'primary', subtitle }: StatCardProps) {
  return (
    <div className={cn("p-6 animate-fade-in", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-background-tertiary",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
