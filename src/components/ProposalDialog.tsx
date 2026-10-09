import { Check, Copy, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildProposalText, buildWhatsAppUrl } from '../finance/proposal'
import { Modal } from './Modal'
import { Button, ButtonLink } from './ui/Button'
import { useToast } from './ui/useToast'

interface ProposalDialogProps {
  open: boolean
  onClose: () => void
  patientName: string
  treatmentValue: number
  downPayment: number
  installmentsCount: number
  installmentValue: number
  totalReceived: number
  monthlyRatePct: number
}

export function ProposalDialog({
  open,
  onClose,
  patientName,
  treatmentValue,
  downPayment,
  installmentsCount,
  installmentValue,
  totalReceived,
  monthlyRatePct,
}: ProposalDialogProps) {
  const toast = useToast()
  const [hideInterest, setHideInterest] = useState(false)
  const [copied, setCopied] = useState(false)

  const text = useMemo(
    () =>
      buildProposalText({
        patientName,
        treatmentValue,
        downPayment,
        installmentsCount,
        installmentValue,
        totalReceived,
        monthlyRatePct,
        hideInterest,
      }),
    [patientName, treatmentValue, downPayment, installmentsCount, installmentValue, totalReceived, monthlyRatePct, hideInterest],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.push({ tone: 'success', title: 'Proposta copiada', description: 'Cole a mensagem na conversa com o paciente.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard indisponível — usuário pode selecionar o texto manualmente.
      toast.push({ tone: 'error', title: 'Não foi possível copiar', description: 'Selecione o texto e copie manualmente.' })
    }
  }

  return (
    <Modal
      open={open}
      title="Proposta comercial"
      description="Texto pronto para enviar ao paciente."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40">
          <input
            type="checkbox"
            checked={hideInterest}
            onChange={(e) => setHideInterest(e.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Ocultar juros
        </label>

        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/60 p-4 font-sans text-sm leading-relaxed">
          {text}
        </pre>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={handleCopy} className="flex-1 sm:flex-none">
            {copied ? <Check className="text-success" aria-hidden /> : <Copy aria-hidden />}
            {copied ? 'Copiado ✓' : 'Copiar texto'}
          </Button>

          <ButtonLink size="lg" href={buildWhatsAppUrl(text)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <MessageCircle aria-hidden />
            Abrir WhatsApp
          </ButtonLink>
        </div>
      </div>
    </Modal>
  )
}
