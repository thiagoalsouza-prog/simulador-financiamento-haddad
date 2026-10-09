import type { AmortizationRow } from '../finance/types'
import { formatCurrency } from '../utils/currency'
import { Badge } from './ui/Badge'

interface AmortizationTableProps {
  schedule: AmortizationRow[]
  /** parcela em que o custo direto é recuperado (marca a linha) */
  costRecoveryInstallment?: number | null
  /** parcela em que o valor principal é recuperado (marca a linha) */
  principalRecoveryInstallment?: number | null
}

export function AmortizationTable({
  schedule,
  costRecoveryInstallment,
  principalRecoveryInstallment,
}: AmortizationTableProps) {
  return (
    <div className="max-h-[26rem] overflow-auto rounded-xl border border-border">
      <table className="data-table w-full min-w-[480px] border-collapse text-sm">
        <caption className="sr-only">Tabela de amortização do financiamento pelo Sistema Price</caption>
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 font-semibold">
              Parcela
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Prestação
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Juros
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Amortização
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">
              Saldo restante
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr
              key={row.number}
              data-selected={row.number === costRecoveryInstallment || row.number === principalRecoveryInstallment}
              className="border-t border-border"
            >
              <th scope="row" className="px-3 py-2 text-left font-medium">
                <span className="num">{row.number}</span>
                {row.number === costRecoveryInstallment && (
                  <Badge tom="sucesso" className="ml-2">
                    Custo recuperado
                  </Badge>
                )}
                {row.number === principalRecoveryInstallment && (
                  <Badge tom="atencao" className="ml-2">
                    Principal recuperado
                  </Badge>
                )}
              </th>
              <td className="num px-3 py-2 text-right">{formatCurrency(row.payment)}</td>
              <td className="num px-3 py-2 text-right text-muted-foreground">{formatCurrency(row.interest)}</td>
              <td className="num px-3 py-2 text-right text-muted-foreground">{formatCurrency(row.amortization)}</td>
              <td className="num px-3 py-2 text-right">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
