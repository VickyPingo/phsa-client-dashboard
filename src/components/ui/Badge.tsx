type Color = 'teal' | 'purple' | 'rose' | 'amber' | 'slate' | 'green' | 'blue';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
}

const colorMap: Record<Color, string> = {
  teal: 'bg-primary-100 text-primary-700',
  purple: 'bg-accent-100 text-accent-700',
  rose: 'bg-rose-100 text-rose-600',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
};

export default function Badge({ children, color = 'slate' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {children}
    </span>
  );
}

export function sexBadge(sex: string | null) {
  if (sex === 'F') return <Badge color="rose">Female</Badge>;
  if (sex === 'M') return <Badge color="blue">Male</Badge>;
  return <Badge color="slate">Unknown</Badge>;
}

export function decisionBadge(decision: string | null) {
  if (!decision) return <Badge color="slate">—</Badge>;
  const colorMap2: Record<string, Color> = {
    P: 'teal',
    'AB-P': 'amber',
    'AD-P': 'purple',
    MIS: 'slate',
    'AB-AB': 'rose',
  };
  return <Badge color={colorMap2[decision] ?? 'slate'}>{decision}</Badge>;
}

export function testimonyBadge(val: string | null) {
  return val === 'Yes'
    ? <Badge color="green">Yes</Badge>
    : <Badge color="slate">No</Badge>;
}
