import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'warning' | 'destructive';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-card',
    primary: 'bg-primary/5 border-primary/20',
    warning: 'bg-amber-500/5 border-amber-500/20',
    destructive: 'bg-destructive/5 border-destructive/20',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm font-medium',
                trend.positive ? 'text-emerald-600' : 'text-destructive'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}% ce mois
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
