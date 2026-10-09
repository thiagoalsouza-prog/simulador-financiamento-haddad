import { Check, Copy, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildRiskMessageText, type RiskMessageInput } from '../finance/riskMessage'
import { buildWhatsAppUrl } from '../finance/proposal'
import { Modal } from './Modal'
import { Alert } from './ui/Alert'
import { Button, ButtonLink } from './ui/Button'
import { useToast } from './ui/useToast'

interface RiskMessageDialogProps extends RiskMessageInput {
  open: boolean
  onClose: () => void
}

export function RiskMessageDialog({ open, onClose, ...input }: RiskMessageDialogProps) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const text = useMemo(() => buildRiskMessageText(input), [input])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.push({ tone: 'success', title: 'Mensagem copiada', description: 'Uso interno: não envie ao paciente.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard indisponível — usuário pode selecionar o texto manualmente.
      toast.push({ tone: 'error', title: 'Não foi possível copiar', description: 'Selecione o texto e copie manualmente.' })
    }
  }

  return (
    <Modal
      open={open}
      title="Mensagem de risco (uso interno)"
      onClose={onClose}
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <Alert tone="danger">
          Contém dados internos (custo, margem, risco). Nunca envie este texto para o paciente.
        </Alert>

        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/60 p-4 font-sans text-sm leading-relaxed">
          {text}
        </pre>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={handleCopy}>
            {copied ? <Check className="text-success" aria-hidden /> : <Copy aria-hidden />}
            {copied ? 'Copiado ✓' : 'Copiar texto'}
          </Button>

          <ButtonLink size="lg" href={buildWhatsAppUrl(text)} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            Abrir WhatsApp
          </ButtonLink>
        </div>
      </div>
    </Modal>
  )
}
