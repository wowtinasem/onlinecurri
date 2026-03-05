
import React, { useState } from 'react';

interface MaterialModalProps {
  isOpen: boolean;
  courseTitle: string;
  currentUrl?: string;
  onClose: () => void;
  onSave: (url: string) => void;
  onRemove: () => void;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen, courseTitle, currentUrl, onClose, onSave, onRemove
}) => {
  const [url, setUrl] = useState(currentUrl || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim()) return;
    onSave(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            <i className="fas fa-file-alt mr-2 text-blue-600"></i>교안 관리
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{courseTitle}</span>
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">교안 링크 (URL)</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="https://drive.google.com/..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSave} disabled={!url.trim()}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-200">
              {currentUrl ? '링크 변경' : '링크 저장'}
            </button>
            {currentUrl && (
              <button onClick={() => { onRemove(); onClose(); }}
                className="px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200">
                링크 삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
