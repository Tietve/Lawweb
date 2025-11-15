import { useState } from 'preact/hooks';
import { Citation } from '../types';

interface CitationsProps {
  citations: Citation[];
}

export function Citations({ citations }: CitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {citations.length} nguồn tham khảo
        <svg
          className={`w-4 h-4 transform transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {citations.map((citation, idx) => (
            <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
              <div className="font-semibold text-gray-800">
                {citation.law} - Điều {citation.article}
              </div>
              <div className="text-gray-600 mt-1">
                Độ tin cậy: {(citation.confidence * 100).toFixed(0)}%
              </div>
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline mt-1 inline-block"
                >
                  Xem chi tiết →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
