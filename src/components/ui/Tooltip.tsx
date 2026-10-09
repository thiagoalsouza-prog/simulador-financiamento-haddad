import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import { cx } from './cx'

interface TooltipProps {
  content: ReactNode
  /** Um único elemento focável (botão, link). Ele recebe `aria-describedby`. */
  children: ReactElement<{ 'aria-describedby'?: string }>
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  className?: string
}

const SIDE = { top: 'bottom-full mb-2', bottom: 'top-full mt-2' } as const
const ALIGN = { start: 'left-0', center: 'left-1/2 -translate-x-1/2', end: 'right-0' } as const

/** Dica explicativa: aparece ao passar o mouse ou ao focar (teclado/toque) e fica ligada ao elemento por aria-describedby. */
export function Tooltip({ content, children, side = 'top', align = 'center', className }: TooltipProps) {
  const id = useId()
  return (
    <span className="group/tip relative inline-flex">
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        role="tooltip"
        id={id}
        className={cx(
          'pointer-events-none absolute z-50 w-max max-w-[260px] rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-popover-foreground opacity-0 shadow-pop transition-opacity duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100',
          SIDE[side],
          ALIGN[align],
          className,
        )}
      >
        {content}
      </span>
    </span>
  )
}
