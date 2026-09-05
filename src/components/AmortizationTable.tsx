import type { AmortizationRow } from '../finance/types'
import { formatCurrency } from '../utils/currency'

interface AmortizationTableProps {
  schedule: AmortizationRow[]
}

export function AmortizationTable({ schedule }: AmortizationTableProps) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="sr-only">Tabela de amortização do financiamento pelo Sistema Price</caption>
        <thead>
          <tr className="bg-background text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">
              Parcela
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Prestação
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Juros
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Amortização
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Saldo restante
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.number} className="border-t border-border">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-text">
                {row.number}
              </th>
              <td className="px-4 py-2.5 text-text">{formatCurrency(row.payment)}</td>
              <td className="px-4 py-2.5 text-muted">{formatCurrency(row.interest)}</td>
              <td className="px-4 py-2.5 text-muted">{formatCurrency(row.amortization)}</td>
              <td className="px-4 py-2.5 text-text">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
