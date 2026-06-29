import React from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  theme: 'frost_light' | 'frost_dark';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  theme,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const cardClass =
    theme === 'frost_light'
      ? 'frostlight-app-content-card'
      : 'frostdark-app-content-card';
  const buttonDangerClass =
    theme === 'frost_light'
      ? 'frostlight-button-action-danger'
      : 'frostdark-button-action-danger';
  const buttonSecondaryClass =
    theme === 'frost_light'
      ? 'frostlight-button-secondary'
      : 'frostdark-button-secondary';

  return createPortal(
    <div
      className='modal-backdrop'
      onClick={onCancel}
      style={{ zIndex: 20000 }}
    >
      <div
        className={cardClass}
        style={{
          minWidth: '300px',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 20001
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className={buttonSecondaryClass}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={buttonDangerClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
