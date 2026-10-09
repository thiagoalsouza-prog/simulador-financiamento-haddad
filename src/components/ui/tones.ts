/** Tons dos indicadores (cartões, mini gráficos). Mesmos nomes e significados do design-system-haddad. */
export type Tom = 'neutro' | 'primario' | 'ciano' | 'sucesso' | 'atencao' | 'critico'

/** Cor CSS de cada tom (variáveis do tema: mudam sozinhas entre escuro e claro). */
export const COR: Record<Tom, string> = {
  neutro: 'var(--muted-foreground)',
  primario: 'var(--primary)',
  ciano: 'var(--cyan)',
  sucesso: 'var(--success)',
  atencao: 'var(--warning)',
  critico: 'var(--danger)',
}
