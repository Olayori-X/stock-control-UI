import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface Invoice {
  invoice_id: string
  request_id: string
  total_value: number
  outstanding_value: number
  status: 'open' | 'paid' | 'overdue'
  due_at: string
  created_at: string
  updated_at: string
}

export interface Receipt {
  receipt_id: string
  invoice_id: string
  amount_paid: number
  paid_at: string
}

export async function getOutstandingInvoices(session: Session): Promise<Invoice[]> {
  const res = await authFetch('/distributor/outstanding', session)
  const data = await unwrap<Invoice[]>(res)
  return data ?? []
}

export async function recordPayment(session: Session, invoiceId: string, amount: number): Promise<{ receipt: Receipt; invoice: Invoice }> {
  const res = await authFetch('/distributor/recordpayment', session, {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, amount }),
  })
  return unwrap<{ receipt: Receipt; invoice: Invoice }>(res)
}

export async function getReceipts(session: Session): Promise<Receipt[]> {
  const res = await authFetch('/distributor/receipts', session)
  const data = await unwrap<Receipt[]>(res)
  return data ?? []
}