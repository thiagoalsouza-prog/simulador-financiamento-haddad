// Esqueleto de carregamento.
// Portado do design-system-haddad/react/Skeleton.tsx (mesma API).
import { cx } from './cx'

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cx('skeleton', className)} />
)
