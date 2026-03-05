
import React, { useState } from 'react';
import { AddMethod, Course } from '../types';
import { geminiService } from '../services/geminiService';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (course: Course) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [method, setMethod] = useState<AddMethod>(AddMethod.MANUAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PLATFORM_OPTIONS = ['패스트캠퍼스', '인프런', '클래스유', '클래스101', '유데미', '직접입력'];
  const [title, setTitle] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [instructor, setInstructor] = useState('');
  const [smartInput, setSmartInput] = useState('');

  const platform = selectedPlatform === '직접입력' ? customPlatform : selectedPlatform;

  if (!isOpen) return null;

  const handleSmartScan = async () => {
    if (!smartInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await geminiService.parseCurriculum(smartInput);
      onAdd({
        id: crypto.randomUUID(),
        title: result.title || '가져온 강좌',
        platform: platform || result.platform || '웹/링크',
        instructor: result.instructor || '미상',
        curriculum: result.curriculum || []
      });
      resetAndClose();
    } catch (err: any) {
      setError(err?.message === 'API_KEY_MISSING'
        ? "Gemini API 키가 설정되지 않았습니다. 상단의 'API 키 필요' 버튼을 눌러 키를 입력해주세요."
        : "콘텐츠 분석에 실패했습니다. 올바른 URL이나 텍스트인지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!title.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title,
      platform,
      instructor,
      curriculum: []
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setTitle('');
    setSelectedPlatform('');
    setCustomPlatform('');
    setInstructor('');
    setSmartInput('');
    setError(null);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const resultStr = event.target?.result as string;
      const base64 = resultStr.split(',')[1];
      try {
        const result = await geminiService.parseCurriculum({
          data: base64,
          mimeType: file.type || 'application/octet-stream'
        });
        onAdd({
          id: crypto.randomUUID(),
          title: result.title || file.name.split('.')[0],
          platform: platform || result.platform || '업로드 파일',
          instructor: result.instructor || '미상',
          curriculum: result.curriculum || []
        });
        resetAndClose();
      } catch (err: any) {
        setError(err?.message === 'API_KEY_MISSING'
          ? "Gemini API 키가 설정되지 않았습니다. 상단의 'API 키 필요' 버튼을 눌러 키를 입력해주세요."
          : "해당 파일 형식에서 커리큘럼을 추출할 수 없습니다. 텍스트를 직접 복사해 넣어보세요.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">새 강좌 추가</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setMethod(AddMethod.MANUAL)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${method === AddMethod.MANUAL ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              직접 입력
            </button>
            <button 
              onClick={() => setMethod(AddMethod.SMART_SCAN)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${method === AddMethod.SMART_SCAN ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              스마트 AI 분석
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center border border-red-100">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {method === AddMethod.MANUAL ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">강의명</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="예: 파이썬 마스터 클래스"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">플랫폼</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedPlatform(opt)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                        selectedPlatform === opt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedPlatform === '직접입력' && (
                  <input
                    type="text"
                    value={customPlatform}
                    onChange={e => setCustomPlatform(e.target.value)}
                    placeholder="플랫폼명을 입력하세요"
                    className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">강사명</label>
                <input
                  type="text"
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                  placeholder="김코딩"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleManualAdd}
                disabled={!title}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors mt-4 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                보관함에 저장
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-2"><b>강의 URL(링크)</b>, 커리큘럼 텍스트를 붙여넣거나 <b>PDF, Word, Excel, PPT</b> 파일을 업로드하세요.</p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">플랫폼</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedPlatform(opt)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                        selectedPlatform === opt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedPlatform === '직접입력' && (
                  <input
                    type="text"
                    value={customPlatform}
                    onChange={e => setCustomPlatform(e.target.value)}
                    placeholder="플랫폼명을 입력하세요"
                    className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL 또는 텍스트 입력</label>
                <textarea 
                  value={smartInput}
                  onChange={e => setSmartInput(e.target.value)}
                  rows={4}
                  placeholder="https://... 또는 커리큘럼 내용을 여기에 붙여넣으세요"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold">또는 문서 파일 업로드</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex space-x-3 mb-2 text-slate-400">
                      <i className="fas fa-file-pdf"></i>
                      <i className="fas fa-file-word"></i>
                      <i className="fas fa-file-excel"></i>
                      <i className="fas fa-file-powerpoint"></i>
                    </div>
                    <p className="text-xs text-slate-500"><span className="font-semibold text-blue-700">파일 선택</span> (모든 오피스 문서 지원)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>

              <button 
                onClick={handleSmartScan}
                disabled={isLoading || !smartInput.trim()}
                className="w-full bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <><span className="inline-block animate-bounce mr-2">🧙</span> AI 분석 중... <span className="inline-block animate-[spin_1s_linear_infinite] ml-1">⭐</span></>
                ) : (
                  <><i className="fas fa-magic mr-2"></i> 분석 및 가져오기</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
