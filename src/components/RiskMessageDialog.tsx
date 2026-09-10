import { Check, Copy, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildRiskMessageText, type RiskMessageInput } from '../finance/riskMessage'
import { buildWhatsAppUrl } from '../finance/proposal'
import { Modal } from './Modal'

interface RiskMessageDialogProps extends RiskMessageInput {
  open: boolean
  onClose: () => void
}

export function RiskMessageDialog({ open, onClose, ...input }: RiskMessageDialogProps) {
  const [copied, setCopied] = useState(false)

  const text = useMemo(() => buildRiskMessageText(input), [input])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard indisponível — usuário pode selecionar o texto manualmente.
    }
  }

  return (
    <Modal open={open} title="Mensagem de risco (uso interno)" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-medium text-danger">
          Contém dados internos (custo, margem, risco). Nunca envie este texto para o paciente.
        </p>

        <pre className="scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-sans text-sm text-text">
          {text}
        </pre>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            {copied ? 'Copiado ✓' : 'Copiar texto'}
          </button>

          <a
            href={buildWhatsAppUrl(text)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-light"
          >
            <MessageCircle size={16} />
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  )
}
