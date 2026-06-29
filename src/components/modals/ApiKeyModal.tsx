import React, { useState } from 'react';
import { useApiKey } from '../../context/ApiKeyContext';

export const ApiKeyModal = ({
  theme,
}: {
  theme: 'frost_light' | 'frost_dark';
}) => {
  const { isApiKeyModalOpen, setApiKey, setIsApiKeyModalOpen } = useApiKey();
  const [inputValue, setInputValue] = useState('');

  if (!isApiKeyModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
    }
  };

  const handleClose = () => {
    setIsApiKeyModalOpen(false);
  };

  const cardClass =
    theme === 'frost_light'
      ? 'frostlight-app-content-card'
      : 'frostdark-app-content-card';
  const inputContainerClass =
    theme === 'frost_light'
      ? 'frostlight-input-container'
      : 'frostdark-input-container';
  const inputClass =
    theme === 'frost_light'
      ? 'frostlight-input-field'
      : 'frostdark-input-field';
  const buttonClass =
    theme === 'frost_light'
      ? 'frostlight-button-action'
      : 'frostdark-button-action';
  const closeButtonClass =
    theme === 'frost_light'
      ? 'frost-btn-ghost frost-btn-icon frost-btn-sm'
      : 'frost-btn-ghost frost-btn-icon frost-btn-sm';

  return (
    <div className='modal-backdrop'>
      <div className={cardClass} style={{ minWidth: '300px', position: 'relative' }}>
        <button
          onClick={handleClose}
          className={closeButtonClass}
          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', border: 'none' }}
          aria-label="Close"
        >
          &times;
        </button>
        <h2>Enter Gemini API Key</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div className={inputContainerClass}>
            <input
              type='password'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder='Your Gemini API Key'
              className={inputClass}
            />
          </div>
          <button type='submit' className={buttonClass}>
            Save Key
          </button>
        </form>
      </div>
    </div>
  );
};