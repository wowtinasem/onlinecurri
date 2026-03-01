
import React, { useState } from 'react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onDelete?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 transition-all duration-300 hover:shadow-md hover:border-blue-200 relative group">
      {/* 카드 상단 헤더 (클릭 시 펼쳐짐) */}
      <div 
        className="p-5 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
            <i className="fas fa-layer-group text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg group-hover:text-blue-700 transition-colors line-clamp-1">{course.title}</h3>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-600">{course.instructor}</span> • {course.platform}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-3">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="강좌 삭제"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
          <div className={`w-10 h-10 flex items-center justify-center text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`}>
            <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      {/* 펼쳐지는 커리큘럼 영역 */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-6 border-t border-slate-100 bg-slate-50/30">
          <div className="mt-6 space-y-8">
            {course.curriculum.length > 0 ? (
              course.curriculum.map((major) => (
                <div key={major.id} className="space-y-4">
                  {/* 대목차 */}
                  <div className="flex items-baseline space-x-3 border-l-4 border-blue-600 pl-4">
                    <span className="text-2xl md:text-3xl font-black text-blue-100 select-none">Major</span>
                    <h4 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{major.title}</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 ml-4">
                    {major.middles.map((middle) => (
                      <div key={middle.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* 중목차 */}
                        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                          <h5 className="font-bold text-white text-sm">
                            <i className="fas fa-folder-open mr-2 text-blue-400"></i>
                            {middle.title}
                          </h5>
                          <span className="text-[10px] bg-blue-600/30 text-blue-100 px-2 py-0.5 rounded-full font-bold uppercase">Middle</span>
                        </div>
                        
                        {/* 소목차 */}
                        <ul className="divide-y divide-slate-100">
                          {middle.minors.map((minor) => (
                            <li key={minor.id} className="px-5 py-3.5 text-sm text-slate-600 flex items-center hover:bg-blue-50/30 transition-colors group/item">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover/item:bg-blue-100 transition-colors">
                                <i className="fas fa-play text-[8px] text-slate-400 group-hover/item:text-blue-600"></i>
                              </div>
                              <span className="font-medium">{minor.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                상세 커리큘럼이 없습니다. AI 분석을 통해 정보를 가져와보세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
