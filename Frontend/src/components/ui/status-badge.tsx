import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusVariant = 'paid' | 'unpaid' | 'overdue' | 'pending' | 'invoiced' | 'toInvoice';

interface StatusBadgeProps {
  variant: StatusVariant;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  paid: {
    label: 'Payée',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  unpaid: {
    label: 'Impayée',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
  },
  overdue: {
    label: 'En retard',
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
  pending: {
    label: 'En attente',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
  invoiced: {
    label: 'Facturé',
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  },
  toInvoice: {
    label: 'À facturer',
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, className }) => {
  const config = statusConfig[variant];
  
  return (
    <Badge variant="outline" className={cn('font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
};
