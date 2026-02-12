import { X } from 'lucide-react'
import { useToast, type ToastType } from '../state/toastContext'

const typeToTestId: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="toast-container"
      data-testid="toast-container"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          data-testid={typeToTestId[toast.type]}
          data-toast-type={toast.type}
          role="status"
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
          <span className="toast__message" data-testid="toast-message">
            {toast.message}
          </span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            data-testid="toast-dismiss"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}
