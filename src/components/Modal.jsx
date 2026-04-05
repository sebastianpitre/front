/**
 * Simple modal: backdrop click closes; inner panel stops propagation.
 */
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {title ? (
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
          ) : null}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
