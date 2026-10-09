import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghost-danger' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const BASE =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:shadow-glow-primary hover:brightness-110',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
  outline: 'border-input bg-surface-2/60 text-foreground hover:border-primary/50 hover:bg-accent',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  'ghost-danger': 'text-muted-foreground hover:bg-danger-soft hover:text-danger',
  danger: 'bg-danger-soft text-danger hover:bg-danger/20',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:px-4',
  lg: 'h-11 px-5',
  icon: 'size-9 [@media(pointer:coarse)]:size-11',
  'icon-sm': 'size-8',
}

/** Classes de botão — use em `<a>`/`<Link>` quando o destino não for uma ação. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cx(BASE, VARIANTS[variant], SIZES[size], className)
}
