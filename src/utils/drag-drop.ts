import React from 'react';
import { Layer } from '../types/layer-types';

interface DragState {
  isDragging: boolean;
  draggedLayer: Layer | null;
  dragOverIndex: number;
  startIndex: number;
  dragOffset: { x: number; y: number };
}

export class DragDropManager {
  private state: DragState = {
    isDragging: false,
    draggedLayer: null,
    dragOverIndex: -1,
    startIndex: -1,
    dragOffset: { x: 0, y: 0 },
  };

  private callbacks: {
    onDragStart?: (layer: Layer, index: number) => void;
    onDragOver?: (targetIndex: number) => void;
    onDragEnd?: (fromIndex: number, toIndex: number) => void;
    onDragCancel?: () => void;
  } = {};

  private dragGhost: HTMLElement | null = null;

  constructor(callbacks: DragDropManager['callbacks'] = {}) {
    this.callbacks = callbacks;
  }

  startDrag(layer: Layer, index: number, event: React.MouseEvent | MouseEvent) {
    this.state = {
      isDragging: true,
      draggedLayer: layer,
      dragOverIndex: -1,
      startIndex: index,
      dragOffset: { x: event.clientX, y: event.clientY },
    };

    this.createDragGhost(layer, event);
    this.attachEventListeners();

    if (this.callbacks.onDragStart) {
      this.callbacks.onDragStart(layer, index);
    }

    // Prevent default to avoid browser drag behavior
    event.preventDefault();
  }

  private createDragGhost(layer: Layer, event: React.MouseEvent | MouseEvent) {
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `
      <div style="
        padding: 8px 12px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        font-size: 14px;
        color: #1f2937;
        white-space: nowrap;
        pointer-events: none;
        transform: rotate(2deg);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      ">
        ${layer.name}
      </div>
    `;

    ghost.style.position = 'fixed';
    ghost.style.left = `${event.clientX + 10}px`;
    ghost.style.top = `${event.clientY - 10}px`;
    ghost.style.zIndex = '10000';
    ghost.style.pointerEvents = 'none';

    document.body.appendChild(ghost);
    this.dragGhost = ghost;
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.state.isDragging || !this.dragGhost) return;

    // Update ghost position with hardware acceleration
    this.dragGhost.style.transform = `translate(${event.clientX + 10}px, ${event.clientY - 10}px) rotate(2deg)`;
    this.dragGhost.style.left = '0';
    this.dragGhost.style.top = '0';

    // Find the target element under cursor
    const elementBelow = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    const layerItem = elementBelow?.closest('.layer-item');

    if (layerItem) {
      const index = parseInt(layerItem.getAttribute('data-index') || '-1');
      if (index !== -1 && index !== this.state.dragOverIndex) {
        this.state.dragOverIndex = index;
        if (this.callbacks.onDragOver) {
          this.callbacks.onDragOver(index);
        }
      }
    }
  };

  private handleMouseUp = (_event: MouseEvent) => {
    if (!this.state.isDragging) return;

    const { startIndex, dragOverIndex } = this.state;

    this.cleanupDrag();

    if (dragOverIndex !== -1 && dragOverIndex !== startIndex) {
      if (this.callbacks.onDragEnd) {
        this.callbacks.onDragEnd(startIndex, dragOverIndex);
      }
    }

    this.resetState();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.state.isDragging) {
      this.cancelDrag();
    }
  };

  private attachEventListeners() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private detachEventListeners() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private cleanupDrag() {
    if (this.dragGhost) {
      document.body.removeChild(this.dragGhost);
      this.dragGhost = null;
    }
    this.detachEventListeners();
  }

  private resetState() {
    this.state = {
      isDragging: false,
      draggedLayer: null,
      dragOverIndex: -1,
      startIndex: -1,
      dragOffset: { x: 0, y: 0 },
    };
  }

  cancelDrag() {
    this.cleanupDrag();
    if (this.callbacks.onDragCancel) {
      this.callbacks.onDragCancel();
    }
    this.resetState();
  }

  getDragState(): Readonly<DragState> {
    return { ...this.state };
  }

  destroy() {
    if (this.state.isDragging) {
      this.cancelDrag();
    }
    this.detachEventListeners();
  }
}

// React hook for drag and drop
export const useDragDrop = (
  _layers: Layer[],
  onReorder: (fromIndex: number, toIndex: number) => void
) => {
  const managerRef = React.useRef<DragDropManager | null>(null);
  const [dragState, setDragState] = React.useState<DragState>({
    isDragging: false,
    draggedLayer: null,
    dragOverIndex: -1,
    startIndex: -1,
    dragOffset: { x: 0, y: 0 },
  });

  React.useEffect(() => {
    const manager = new DragDropManager({
      onDragStart: (layer, index) => {
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          draggedLayer: layer,
          startIndex: index,
        }));
      },
      onDragOver: targetIndex => {
        setDragState(prev => ({ ...prev, dragOverIndex: targetIndex }));
      },
      onDragEnd: (fromIndex, toIndex) => {
        onReorder(fromIndex, toIndex);
        setDragState(prev => ({
          ...prev,
          isDragging: false,
          draggedLayer: null,
          dragOverIndex: -1,
          startIndex: -1,
        }));
      },
      onDragCancel: () => {
        setDragState(prev => ({
          ...prev,
          isDragging: false,
          draggedLayer: null,
          dragOverIndex: -1,
          startIndex: -1,
        }));
      },
    });

    managerRef.current = manager;

    return () => {
      manager.destroy();
    };
  }, [onReorder]);

  const handleDragStart = React.useCallback(
    (layer: Layer, index: number, event: React.MouseEvent) => {
      if (managerRef.current) {
        managerRef.current.startDrag(layer, index, event);
      }
    },
    []
  );

  return {
    dragState,
    handleDragStart,
  };
};

export type { DragState };
