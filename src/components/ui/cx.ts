/** Junta classes ignorando valores falsos (substitui clsx/cn sem dependência). */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
