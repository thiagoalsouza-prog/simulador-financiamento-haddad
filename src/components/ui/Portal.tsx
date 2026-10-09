import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Desenha o conteúdo direto no <body>. Janelas, gavetas e menus usam `position: fixed`, e um contêiner com
 * transformação ou animação (como as entradas suaves das telas) viraria o "chão" deles em vez da janela do
 * navegador — o rodapé do painel sumiria abaixo da dobra. Fora da árvore da tela isso não acontece.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
