import type React from "react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import "./modal.css"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  fullscreen?: boolean
  size?: 'auto' | 'fullscreen' | 'viewport-90'
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, fullscreen, size = 'auto' }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      event.stopPropagation()
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Close modal when pressing Escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
      document.addEventListener("keydown", handleEscKey)
      // Prevent scrolling of background content
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscKey)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const close = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation()
    onClose()
  }

  // Don't render anything if the modal is closed
  if (!isOpen) return null

  // Use createPortal to render the modal at the end of the document body
  const containerClass = (() => {
    if (size === 'fullscreen' || fullscreen) return 'ccf-modal-container ccf-fullscreen'
    if (size === 'viewport-90') return 'ccf-modal-container ccf-viewport-90'
    return 'ccf-modal-container'
  })()

  return createPortal(
    <div className="ccf-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => {e.stopPropagation()}}>
      <div className={containerClass} ref={modalRef}>
        <div className="ccf-modal-header">
          {title && <h2 className="ccf-modal-title">{title}</h2>}
          <button className="ccf-modal-close-button" onClick={close} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ccf-modal-content">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
