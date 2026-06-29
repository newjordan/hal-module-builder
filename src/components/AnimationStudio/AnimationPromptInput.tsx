import React, { useState, useRef, useEffect } from 'react';
import { Layer } from '../../types/layer-types';
import {
  useAnimationPromptEngine,
  AnimationSequence,
} from '../../hooks/useAnimationPromptEngine';

export interface AnimationPromptInputProps {
  onAnimationGenerated: (layers: Layer[]) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
  disabled?: boolean;
}

export const AnimationPromptInput: React.FC<AnimationPromptInputProps> = ({
  onAnimationGenerated,
  theme,
  className = '',
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastResult, setLastResult] = useState<AnimationSequence | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { parsePrompt, isProcessing, getSuggestions } =
    useAnimationPromptEngine({ maxSuggestions: 6 });

  // Theme-aware classes using frost glass system
  const containerClass = `
    animation-prompt-input frost-space-y-4
    ${className}
  `;

  const inputGroupClass = `frost-space-y-2`;

  const labelClass = `
    frost-block frost-text-sm frost-font-medium
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const inputContainerClass =
    theme === 'frost_light'
      ? 'frostlight-conv-input-container'
      : 'frostdark-conv-input-container';

  const inputClass = `
    ${theme === 'frost_light' ? 'frostlight-conv-input' : 'frostdark-conv-input'}
    prompt-textarea frost-resize-y
    ${disabled ? 'frost-cursor-not-allowed frost-opacity-60' : ''}
  `;

  const buttonClass = `
    ${theme === 'frost_light' ? 'frostlight-button-action' : 'frostdark-button-action'}
    frost-px-6 frost-py-2 frost-ml-3 frost-transition-all frost-duration-200
    ${
      disabled || !prompt.trim() || isProcessing
        ? 'frost-opacity-50 frost-cursor-not-allowed'
        : 'hover:frost-scale-105'
    }
  `;

  const suggestionsPanelClass = `
    suggestions-panel frost-mt-2 frost-p-3 frost-rounded-lg frost-border
    frost-transition-all frost-duration-200
    ${
      theme === 'frost_light'
        ? 'frost-bg-white/70 frost-border-gray-200 frost-backdrop-blur-sm'
        : 'frost-bg-gray-900/70 frost-border-gray-700 frost-backdrop-blur-sm'
    }
  `;

  const suggestionItemClass = `
    frost-px-3 frost-py-2 frost-text-sm frost-rounded-lg frost-cursor-pointer
    frost-transition-all frost-duration-200 frost-flex frost-items-center frost-space-x-2
    ${
      theme === 'frost_light'
        ? 'frost-text-gray-700 hover:frost-bg-white/80 hover:frost-text-teal-600 hover:frost-scale-[1.02]'
        : 'frost-text-gray-300 hover:frost-bg-gray-800/80 hover:frost-text-teal-400 hover:frost-scale-[1.02]'
    }
  `;

  const examplesPanelClass = `
    examples-section frost-space-y-3
  `;

  const exampleHeaderClass = `
    frost-text-sm frost-font-medium frost-flex frost-items-center frost-space-x-2
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const exampleGridClass = `frost-grid frost-grid-cols-1 frost-gap-2 frost-max-h-64 frost-overflow-y-auto`;

  const exampleItemClass = `
    frost-text-left frost-p-3 frost-rounded-lg frost-text-sm
    frost-transition-all frost-duration-200 frost-cursor-pointer
    frost-border frost-group hover:frost-scale-[1.02]
    ${
      theme === 'frost_light'
        ? 'frost-bg-white/50 hover:frost-bg-white/70 frost-text-gray-700 frost-border-gray-200 hover:frost-border-teal-300'
        : 'frost-bg-gray-900/50 hover:frost-bg-gray-800/70 frost-text-gray-300 frost-border-gray-700 hover:frost-border-teal-500'
    }
  `;

  const helpPanelClass = `
    frost-text-xs frost-p-3 frost-rounded-lg frost-border
    ${
      theme === 'frost_light'
        ? 'frost-bg-blue-50/70 frost-text-blue-700 frost-border-blue-200'
        : 'frost-bg-blue-900/30 frost-text-blue-300 frost-border-blue-700/50'
    }
  `;

  const resultPanelClass = `
    result-panel frost-p-4 frost-rounded-lg frost-border frost-space-y-3
    frost-transition-all frost-duration-300
    ${
      theme === 'frost_light'
        ? 'frost-bg-green-50/70 frost-border-green-200 frost-backdrop-blur-sm'
        : 'frost-bg-green-900/30 frost-border-green-700/50 frost-backdrop-blur-sm'
    }
  `;

  // Handle prompt input changes
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    const value = e.target.value;
    setPrompt(value);

    // Clear previous result when user types
    if (lastResult) {
      setLastResult(null);
    }

    // Update suggestions
    if (value.length > 2) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Generate animation from prompt
  const handleGenerate = async () => {
    if (!prompt.trim() || isProcessing || disabled) return;

    try {
      const result = await parsePrompt(prompt);

      if (result.sequence.layers.length > 0) {
        setLastResult(result.sequence);
        onAnimationGenerated(result.sequence.layers);
        setShowSuggestions(false);

        // Optional: Clear prompt after successful generation
        // setPrompt('');
      }
    } catch (error) {
      console.error('Failed to generate animation:', error);
      // TODO: Add error notification system
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Select suggestion
  const selectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Quick examples organized by intent
  const quickExamples = {
    startup: [
      'intro animation where a glowing dot pops up and begins to glow',
      'startup animation with professional fade in',
    ],
    loading: [
      'loading spinner with smooth rotation',
      'loading animation with pulsing dots',
    ],
    feedback: [
      'success animation with green celebration',
      'error state with red pulsing indicator',
    ],
    connection: [
      'connection established with expanding circles',
      'network animation with flowing data',
    ],
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={containerClass}>
      {/* Main Input */}
      <div className={inputGroupClass}>
        <label className={labelClass}>Describe your animation</label>
        <div className={inputContainerClass}>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="Type what you want to animate... e.g., 'glowing dot pops up and begins to glow'"
            rows={3}
            className={inputClass}
            disabled={disabled || isProcessing}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isProcessing || disabled}
            className={buttonClass}
            title={
              isProcessing ? 'Generating...' : 'Generate animation (⌘+Enter)'
            }
          >
            {isProcessing ? (
              <span className='frost-flex frost-items-center frost-space-x-2'>
                <span className='frost-animate-spin'>⏳</span>
                <span>Generating...</span>
              </span>
            ) : (
              <span className='frost-flex frost-items-center frost-space-x-2'>
                <span>✨</span>
                <span>Generate</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className={suggestionsPanelClass}>
          <div className='frost-text-sm frost-font-medium frost-mb-2 frost-flex frost-items-center frost-space-x-2'>
            <span>💡</span>
            <span>Suggestions:</span>
          </div>
          <div className='frost-flex frost-flex-wrap frost-gap-2'>
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className={suggestionItemClass}
                type='button'
              >
                <span className='frost-text-xs frost-opacity-60'>↗</span>
                <span className='frost-truncate'>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Last Result Display */}
      {lastResult && (
        <div className={resultPanelClass}>
          <div className='frost-flex frost-items-center frost-space-x-2 frost-text-sm frost-font-medium'>
            <span className='frost-text-green-500'>✓</span>
            <span>Generated: {lastResult.name}</span>
          </div>
          <p className='frost-text-xs frost-opacity-75'>
            {lastResult.description}
          </p>
          <div className='frost-text-xs frost-opacity-60'>
            {lastResult.layers.length} layer
            {lastResult.layers.length !== 1 ? 's' : ''} • {lastResult.duration}
            ms duration
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <div className={examplesPanelClass}>
        <div className={exampleHeaderClass}>
          <span>🎯</span>
          <span>Try these examples:</span>
        </div>

        <div className='frost-space-y-3'>
          {Object.entries(quickExamples).map(([category, examples]) => (
            <div key={category} className='frost-space-y-2'>
              <div className='frost-text-xs frost-font-medium frost-uppercase frost-tracking-wide frost-opacity-60'>
                {category}
              </div>
              <div className={exampleGridClass}>
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className={exampleItemClass}
                    type='button'
                  >
                    <div className='frost-flex frost-items-start frost-space-x-2'>
                      <span className='frost-text-teal-500 frost-font-medium frost-group-hover:frost-scale-110 frost-transition-transform'>
                        💡
                      </span>
                      <span className='frost-flex-1'>{example}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className={helpPanelClass}>
        <div className='frost-font-medium frost-mb-1 frost-flex frost-items-center frost-space-x-1'>
          <span>💡</span>
          <span>Pro Tips:</span>
        </div>
        <ul className='frost-list-disc frost-list-inside frost-space-y-1 frost-text-xs'>
          <li>
            Be specific about timing (e.g., &quot;slowly fade in&quot;,
            &quot;quick pulse&quot;)
          </li>
          <li>
            Mention colors or effects (e.g., &quot;glowing blue circle&quot;,
            &quot;red error state&quot;)
          </li>
          <li>
            Describe the purpose (e.g., &quot;connection indicator&quot;,
            &quot;loading state&quot;)
          </li>
          <li>
            Use familiar terms like &quot;pop up&quot;, &quot;slide in&quot;,
            &quot;pulse&quot;, &quot;spin&quot;, &quot;glow&quot;
          </li>
          <li>
            Press{' '}
            <kbd className='frost-px-1 frost-py-0.5 frost-rounded frost-bg-gray-200 frost-text-xs'>
              ⌘+Enter
            </kbd>{' '}
            to generate quickly
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AnimationPromptInput;
