import { useState, useRef } from 'preact/hooks';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const message = input.trim();
    if (message) {
      onSend(message);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setInput(target.value);

    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  return (
    <div class="border-t p-3 bg-white">
      <div class="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi của bạn..."
          disabled={disabled}
          class="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Gửi tin nhắn"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Quick Replies */}
      <div class="mt-2 flex flex-wrap gap-2">
        {[
          'Hợp đồng lao động',
          'Quyền lợi người tiêu dùng',
          'Đất đai',
        ].map(suggestion => (
          <button
            key={suggestion}
            onClick={() => {
              setInput(suggestion);
              onSend(suggestion);
            }}
            disabled={disabled}
            class="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
