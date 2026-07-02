import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Pencil, Trash2, Copy, MoreHorizontal, RotateCcw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { BillForm } from './BillForm'
import type { Bill } from '../../types'
import { CATEGORY_LABELS } from '../../types'
import { formatCurrency } from '../../utils/format'
import { dueDayLabel } from '../../utils/date'
import { markBillPaid, markBillPending, deleteBill, addBill } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'

interface BillCardProps {
  bill: Bill
}

const statusVariant: Record<string, 'success' | 'danger' | 'default'> = {
  paid: 'success',
  overdue: 'danger',
  pending: 'default',
}

const statusLabel: Record<string, string> = {
  paid: 'Pago',
  overdue: 'Atrasado',
  pending: 'Pendente',
}

export function BillCard({ bill }: BillCardProps) {
  const { activeMonth, activeYear } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actioning, setActioning] = useState(false)

  async function handleTogglePaid() {
    setActioning(true)
    try {
      if (bill.status === 'paid') {
        await markBillPending(bill.id!, activeMonth, activeYear)
      } else {
        await markBillPaid(bill.id!, activeMonth, activeYear)
      }
    } finally {
      setActioning(false)
    }
  }

  async function handleDuplicate() {
    setMenuOpen(false)
    const now = new Date()
    const { id: _id, ...rest } = bill
    await addBill({
      ...rest,
      name: `${bill.name} (cópia)`,
      status: 'pending',
      paidAt: undefined,
      createdAt: now,
      updatedAt: now,
    })
  }

  async function handleDelete() {
    await deleteBill(bill.id!)
    setDeleteOpen(false)
  }

  const isPaid = bill.status === 'paid'

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle last:border-0 ${
          isPaid ? 'opacity-60' : ''
        }`}
      >
        {/* Check button */}
        <button
          onClick={handleTogglePaid}
          disabled={actioning}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
            isPaid
              ? 'border-status-success bg-status-success'
              : 'border-border-strong hover:border-accent-500'
          }`}
        >
          {isPaid && <Check size={13} className="text-white" strokeWidth={2.5} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${isPaid ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {bill.name}
            </p>
            {bill.isInstallment && (
              <Badge variant="info" className="text-[10px] flex-shrink-0">
                {bill.installmentPaid ?? 0}/{bill.installmentTotal ?? '?'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted">{CATEGORY_LABELS[bill.category]}</span>
            <span className="text-text-muted">·</span>
            <span className="text-xs text-text-muted">{dueDayLabel(bill.dueDay, activeMonth, activeYear)}</span>
          </div>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">{formatCurrency(bill.amount)}</p>
            <Badge variant={statusVariant[bill.status]} dot className="text-[10px]">
              {statusLabel[bill.status]}
            </Badge>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </motion.div>

      {/* Action menu */}
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title={bill.name} size="sm">
        <div className="space-y-1 -mx-1">
          <button
            onClick={() => { handleTogglePaid(); setMenuOpen(false) }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-surface-100 transition-colors"
          >
            {isPaid ? <RotateCcw size={16} className="text-text-muted" /> : <Check size={16} className="text-status-success" />}
            {isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
          </button>
          <button
            onClick={() => { setMenuOpen(false); setEditOpen(true) }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-surface-100 transition-colors"
          >
            <Pencil size={16} className="text-text-muted" />
            Editar conta
          </button>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-surface-100 transition-colors"
          >
            <Copy size={16} className="text-text-muted" />
            Duplicar
          </button>
          <button
            onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-status-danger hover:bg-status-danger/8 transition-colors"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar conta" size="md">
        <BillForm bill={bill} onClose={() => setEditOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir conta"
        description={`Tem certeza que deseja excluir "${bill.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </>
  )
}
