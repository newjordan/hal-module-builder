// Resizable panel functionality with proper cleanup
interface ResizePanelInstance {
  cleanup: () => void;
  isActive: () => boolean;
}

let resizePanelInstance: ResizePanelInstance | null = null;

export function initResizablePanel(): ResizePanelInstance | null {
  // Cleanup existing instance to prevent multiple listeners
  if (resizePanelInstance) {
    resizePanelInstance.cleanup();
  }

  const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
  const panel = document.querySelector('.sidebar') as HTMLElement;

  if (!resizeHandle || !panel) {
    return null;
  }

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  // Create handler functions with stable references for cleanup
  const handleMouseDown = (e: MouseEvent) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(
      document.defaultView?.getComputedStyle(panel).width || '0',
      10
    );

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const width = startWidth - (e.clientX - startX);
    const minWidth = 350;
    const maxWidth = window.innerWidth * 0.6;

    const newWidth = Math.min(Math.max(width, minWidth), maxWidth);
    panel.style.width = newWidth + 'px';
  };

  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    isResizing = true;
    startX = e.touches[0]?.clientX || 0;
    startWidth = parseInt(
      document.defaultView?.getComputedStyle(panel).width || '0',
      10
    );
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isResizing) return;

    const touchX = e.touches[0]?.clientX || 0;
    const width = startWidth - (touchX - startX);
    const minWidth = 350;
    const maxWidth = window.innerWidth * 0.6;

    const newWidth = Math.min(Math.max(width, minWidth), maxWidth);
    panel.style.width = newWidth + 'px';
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (isResizing) {
      isResizing = false;
    }
  };

  // Add event listeners
  resizeHandle.addEventListener('mousedown', handleMouseDown, {
    passive: false,
  });
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseup', handleMouseUp, { passive: true });
  resizeHandle.addEventListener('touchstart', handleTouchStart, {
    passive: false,
  });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Create instance with cleanup method
  resizePanelInstance = {
    cleanup: () => {
      if (resizeHandle && panel) {
        resizeHandle.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        resizeHandle.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        // Reset any styling
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        isResizing = false;
      }
      resizePanelInstance = null;
    },
    isActive: () => resizePanelInstance !== null,
  };

  return resizePanelInstance;
}

// Cleanup function for proper disposal
export function cleanupResizablePanel(): void {
  if (resizePanelInstance) {
    resizePanelInstance.cleanup();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResizablePanel);
} else {
  initResizablePanel();
}
