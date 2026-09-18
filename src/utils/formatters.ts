// Formatting and UI helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0
  }).format(amount).replace('NPR', 'Rs.');
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getTrustLevel(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeText: string;
} {
  if (score >= 95) {
    return {
      label: 'Premier Verified',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      badgeText: 'AAA Grade'
    };
  }
  if (score >= 85) {
    return {
      label: 'Verified Merchant',
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/30',
      badgeText: 'Certified'
    };
  }
  if (score >= 70) {
    return {
      label: 'Standard Trader',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      badgeText: 'Active'
    };
  }
  return {
    label: 'Under Review',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    badgeText: 'Probation'
  };
}
