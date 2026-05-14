import { toast } from 'react-toastify'
import type { ConfirmToastProps } from '../../types/types'


export default function ConfirmToast({
  message,
  toastId,
  onConfirm,
}: ConfirmToastProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-100">{message}</p>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-sky-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-sky-400"
          onClick={() => {
            toast.dismiss(toastId)
            onConfirm()
          }}
        >
          Confirm
        </button>

        <button
          type="button"
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800"
          onClick={() => toast.dismiss(toastId)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}