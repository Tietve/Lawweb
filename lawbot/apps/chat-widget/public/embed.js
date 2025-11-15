/**
 * LawBot Chat Widget Embed Script
 *
 * Usage:
 * <script src="https://chat.lawbot.vn/embed.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    widgetUrl: 'https://chat.lawbot.vn',
    position: 'bottom-right', // bottom-right, bottom-left
    offset: { x: 20, y: 20 },
    size: { width: 380, height: 600 },
    zIndex: 9999,
  };

  // Create launcher button
  function createLauncher() {
    const launcher = document.createElement('button');
    launcher.id = 'lawbot-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.style.cssText = `
      position: fixed;
      ${config.position === 'bottom-right' ? 'right' : 'left'}: ${config.offset.x}px;
      bottom: ${config.offset.y}px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      cursor: pointer;
      z-index: ${config.zIndex};
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    launcher.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin: 14px;">
        <path d="M8 12h8M8 8h8M8 16h5M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    launcher.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
    });

    launcher.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
    });

    launcher.addEventListener('click', toggleWidget);

    document.body.appendChild(launcher);
    return launcher;
  }

  // Create widget container
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'lawbot-chat-widget';
    container.style.cssText = `
      position: fixed;
      ${config.position === 'bottom-right' ? 'right' : 'left'}: ${config.offset.x}px;
      bottom: ${config.offset.y + 70}px;
      width: ${config.size.width}px;
      height: ${config.size.height}px;
      max-height: calc(100vh - ${config.offset.y + 80}px);
      z-index: ${config.zIndex};
      border: none;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: none;
      transition: opacity 0.3s, transform 0.3s;
      opacity: 0;
      transform: translateY(20px);
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = config.widgetUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('title', 'LawBot Chat Widget');

    container.appendChild(iframe);
    document.body.appendChild(container);

    return { container, iframe };
  }

  // Toggle widget visibility
  let isOpen = false;
  function toggleWidget() {
    const widget = document.getElementById('lawbot-chat-widget');
    const launcher = document.getElementById('lawbot-launcher');

    if (!widget) return;

    isOpen = !isOpen;

    if (isOpen) {
      widget.style.display = 'block';
      setTimeout(() => {
        widget.style.opacity = '1';
        widget.style.transform = 'translateY(0)';
      }, 10);
      launcher.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin: 14px;">
          <path d="M6 18L18 6M6 6l12 12"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    } else {
      widget.style.opacity = '0';
      widget.style.transform = 'translateY(20px)';
      setTimeout(() => {
        widget.style.display = 'none';
      }, 300);
      launcher.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin: 14px;">
          <path d="M8 12h8M8 8h8M8 16h5M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
  }

  // Handle messages from iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== config.widgetUrl && !event.origin.includes('localhost')) {
      return;
    }

    const widget = document.getElementById('lawbot-chat-widget');
    if (!widget) return;

    switch(event.data.type) {
      case 'resize':
        if (event.data.height) {
          widget.style.height = Math.min(event.data.height, config.size.height) + 'px';
        }
        break;

      case 'close':
        toggleWidget();
        break;

      case 'ready':
        console.log('LawBot widget ready');
        break;
    }
  });

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    createLauncher();
    createWidget();
    console.log('LawBot chat widget initialized');
  }

  // Expose API
  window.LawBot = {
    open: function() {
      if (!isOpen) toggleWidget();
    },
    close: function() {
      if (isOpen) toggleWidget();
    },
    toggle: toggleWidget,
  };
})();
