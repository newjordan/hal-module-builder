import React, { useCallback, useRef, useState } from 'react';
import { AnimationSequence } from '../../hooks/useAnimationOrchestrator';
import { AnimationTimeline } from '../../hooks/useTimelineManager';
import { Layer } from '../../types/layer-types';
import { TimelineSerializer } from '../../utils/timelineSerializer';

export interface TimelineManagerProps {
  timeline: AnimationTimeline;
  layers: Layer[];
  sequences?: AnimationSequence[];
  onTimelineImport: (
    timeline: AnimationTimeline,
    layers: Partial<Layer>[],
    sequences?: AnimationSequence[]
  ) => void;
  theme: 'light' | 'dark';
  className?: string;
}

interface ImportState {
  isImporting: boolean;
  error: string | null;
  success: string | null;
}

export const TimelineManager: React.FC<TimelineManagerProps> = ({
  timeline,
  layers,
  sequences,
  onTimelineImport,
  theme,
  className = '',
}) => {
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    error: null,
    success: null,
  });

  const [exportMetadata, setExportMetadata] = useState({
    author: '',
    description: '',
    tags: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Clear status messages
   */
  const clearStatus = useCallback(() => {
    setImportState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  /**
   * Handle timeline export to file
   */
  const handleExportToFile = useCallback(() => {
    try {
      const metadata: Record<string, string | string[]> = {};
      if (exportMetadata.author) metadata.author = exportMetadata.author;
      if (exportMetadata.description)
        metadata.description = exportMetadata.description;
      if (exportMetadata.tags) {
        metadata.tags = exportMetadata.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      TimelineSerializer.exportToFile(
        timeline,
        layers,
        sequences,
        metadata as any
      );

      setImportState({
        isImporting: false,
        error: null,
        success: 'Timeline exported successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      setImportState({
        isImporting: false,
        error: `Export failed: ${error}`,
        success: null,
      });
    }
  }, [timeline, layers, sequences, exportMetadata]);

  /**
   * Handle timeline export to clipboard
   */
  const handleExportToClipboard = useCallback(async () => {
    try {
      const metadata2: Record<string, string | string[]> = {};
      if (exportMetadata.author) metadata2.author = exportMetadata.author;
      if (exportMetadata.description)
        metadata2.description = exportMetadata.description;
      if (exportMetadata.tags) {
        metadata2.tags = exportMetadata.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      const json = TimelineSerializer.exportToJSON(
        timeline,
        layers,
        sequences,
        metadata2 as any
      );

      await navigator.clipboard.writeText(json);

      setImportState({
        isImporting: false,
        error: null,
        success: 'Timeline copied to clipboard!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      setImportState({
        isImporting: false,
        error: `Copy failed: ${error}`,
        success: null,
      });
    }
  }, [timeline, layers, sequences, exportMetadata]);

  /**
   * Handle file selection for import
   */
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportState({ isImporting: true, error: null, success: null });

      TimelineSerializer.importFromFile(file)
        .then(
          ({
            timeline: importedTimeline,
            layers: importedLayers,
            sequences: importedSequences,
          }) => {
            onTimelineImport(
              importedTimeline,
              importedLayers,
              importedSequences
            );

            setImportState({
              isImporting: false,
              error: null,
              success: `Timeline "${importedTimeline.name}" imported successfully!`,
            });

            // Clear file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }

            // Clear success message after 3 seconds
            setTimeout(() => {
              setImportState(prev => ({ ...prev, success: null }));
            }, 3000);
          }
        )
        .catch(error => {
          setImportState({
            isImporting: false,
            error: `Import failed: ${error}`,
            success: null,
          });

          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    },
    [onTimelineImport]
  );

  /**
   * Handle import from clipboard
   */
  const handleImportFromClipboard = useCallback(async () => {
    try {
      setImportState({ isImporting: true, error: null, success: null });

      const clipboardText = await navigator.clipboard.readText();
      const {
        timeline: importedTimeline,
        layers: importedLayers,
        sequences: importedSequences,
      } = TimelineSerializer.importFromJSON(clipboardText);

      onTimelineImport(importedTimeline, importedLayers, importedSequences);

      setImportState({
        isImporting: false,
        error: null,
        success: `Timeline "${importedTimeline.name}" imported from clipboard!`,
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      setImportState({
        isImporting: false,
        error: `Import from clipboard failed: ${error}`,
        success: null,
      });
    }
  }, [onTimelineImport]);

  /**
   * Create and download empty timeline template
   */
  const handleCreateTemplate = useCallback(() => {
    try {
      const template =
        TimelineSerializer.createEmptyTimeline('Template Timeline');
      const json = JSON.stringify(template, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'timeline_template.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportState({
        isImporting: false,
        error: null,
        success: 'Template downloaded successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      setImportState({
        isImporting: false,
        error: `Template creation failed: ${error}`,
        success: null,
      });
    }
  }, []);

  return (
    <div className={`${className} timeline-manager timeline-card`}>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h3 className={'text-lg font-semibold timeline-text-primary'}>
            Timeline Manager
          </h3>
          <p className={'text-sm timeline-text-muted mt-1'}>
            Export and import timeline configurations, sequences, and animation
            data.
          </p>
        </div>

        {/* Status Messages */}
        {(importState.error || importState.success) && (
          <div className='space-y-2'>
            {importState.error && (
              <div className='timeline-status timeline-status--error'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <span className='text-red-400'>⚠️</span>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm timeline-text-primary'>
                      {importState.error}
                    </p>
                  </div>
                  <div className='ml-auto pl-3'>
                    <button
                      onClick={clearStatus}
                      className='timeline-text-muted'
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            {importState.success && (
              <div className='timeline-status timeline-status--success'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <span className='text-green-400'>✅</span>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm timeline-text-primary'>
                      {importState.success}
                    </p>
                  </div>
                  <div className='ml-auto pl-3'>
                    <button
                      onClick={clearStatus}
                      className='timeline-text-muted'
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className={'timeline-card'}>
          <h4 className={'text-md font-medium timeline-text-primary mb-4'}>
            Export Timeline
          </h4>

          {/* Export Metadata */}
          <div className='space-y-3 mb-4'>
            <div>
              <label
                className={`block text-sm font-medium text-${theme === 'light' ? 'gray-700' : 'gray-300'} mb-1`}
              >
                Author
              </label>
              <input
                type='text'
                value={exportMetadata.author}
                onChange={e =>
                  setExportMetadata(prev => ({
                    ...prev,
                    author: e.target.value,
                  }))
                }
                placeholder='Your name'
                className={'timeline-input'}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium text-${theme === 'light' ? 'gray-700' : 'gray-300'} mb-1`}
              >
                Description
              </label>
              <textarea
                value={exportMetadata.description}
                onChange={e =>
                  setExportMetadata(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Describe this timeline...'
                rows={2}
                className={'timeline-input'}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium text-${theme === 'light' ? 'gray-700' : 'gray-300'} mb-1`}
              >
                Tags (comma-separated)
              </label>
              <input
                type='text'
                value={exportMetadata.tags}
                onChange={e =>
                  setExportMetadata(prev => ({ ...prev, tags: e.target.value }))
                }
                placeholder='animation, intro, logo'
                className={'timeline-input'}
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={handleExportToFile}
              className={'timeline-button timeline-button--primary'}
            >
              <span className='mr-2'>💾</span>
              Export to File
            </button>

            <button
              onClick={handleExportToClipboard}
              className={'timeline-button timeline-button--ghost'}
            >
              <span className='mr-2'>📋</span>
              Copy to Clipboard
            </button>
          </div>

          {/* Timeline Info */}
          <div className='mt-3 pt-3 timeline-divider'>
            <div className={'text-xs timeline-text-muted space-y-1'}>
              <p>
                Timeline: {timeline.name} (
                {(timeline.duration / 1000).toFixed(1)}s)
              </p>
              <p>
                Tracks: {timeline.tracks.length} | Layers: {layers.length}
              </p>
              {sequences && <p>Sequences: {sequences.length}</p>}
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className={'timeline-card'}>
          <h4 className={'text-md font-medium timeline-text-primary mb-4'}>
            Import Timeline
          </h4>

          <div className='flex flex-wrap gap-2 mb-4'>
            {/* File Import */}
            <div>
              <input
                ref={fileInputRef}
                type='file'
                accept='.json'
                onChange={handleFileSelect}
                className='hidden'
                disabled={importState.isImporting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importState.isImporting}
                className={`timeline-button timeline-button--primary ${importState.isImporting ? 'is-disabled' : ''}`}
              >
                <span className='mr-2'>📁</span>
                {importState.isImporting ? 'Importing...' : 'Import from File'}
              </button>
            </div>

            {/* Clipboard Import */}
            <button
              onClick={handleImportFromClipboard}
              disabled={importState.isImporting}
              className={`timeline-button timeline-button--ghost ${importState.isImporting ? 'is-disabled' : ''}`}
            >
              <span className='mr-2'>📋</span>
              Import from Clipboard
            </button>
          </div>

          {/* Template Download */}
          <div className='pt-3 timeline-divider'>
            <button
              onClick={handleCreateTemplate}
              className={'timeline-button timeline-button--link'}
            >
              <span className='mr-2'>📄</span>
              Download Empty Template
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className={'timeline-card'}>
          <h4 className={'text-md font-medium timeline-text-primary mb-2'}>
            Timeline Format
          </h4>
          <div className={'text-sm timeline-text-muted space-y-2'}>
            <p>
              Timeline files contain all animation data including keyframes,
              tracks, layer properties, and sequences.
            </p>
            <p>
              <strong>Supported formats:</strong> JSON (.json)
            </p>
            <p>
              <strong>Version:</strong> {TimelineSerializer['VERSION']}{' '}
              (compatible with v1.0.0+)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineManager;
