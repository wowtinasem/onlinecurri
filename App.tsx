
import React, { useState, useMemo } from 'react';
import { Course } from './types';
import { CourseCard } from './components/CourseCard';
import { AddCourseModal } from './components/AddCourseModal';
import { Chatbot } from './components/Chatbot';

const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    title: "AI 에이전트 마스터 클래스",
    platform: "인프런",
    instructor: "김코딩",
    curriculum: [
      {
        id: 'major-1',
        title: "01. Intro: 왜 내 에이전트는 생각대로 움직이지 않을까?",
        middles: [
          {
            id: 'middle-1',
            title: "CH01. AI 에이전트와 Agentic AI 그리고 비즈니스 문제",
            minors: [
              { id: 'min-1', title: "01. 오리엔테이션: 이 강의에서 무엇을 얻어가는가" },
              { id: 'min-2', title: "02. AI 에이전트와 Agentic AI, 무엇이 다른가" },
              { id: 'min-3', title: "03. 비즈니스 문제를 에이전트 관점으로 분해하기" }
            ]
          },
          {
            id: 'middle-2',
            title: "CH02. 프롬프트 엔지니어링과 컨텍스트 엔지니어링",
            minors: [
              { id: 'min-4', title: "01. 단순 프롬프트 엔지니어링의 한계점" },
              { id: 'min-5', title: "02. 결과를 바꾸는 데이터, 컨텍스트 엔지니어링이란?" }
            ]
          }
        ]
      }
    ]
  }
];

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return courses.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.platform.toLowerCase().includes(q) || 
      c.instructor.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm("이 강좌를 보관함에서 삭제하시겠습니까?")) {
      setCourses(prev => prev.filter(course => course.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 text-slate-900">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
              <i className="fas fa-graduation-cap text-lg"></i>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">CourseVault<span className="text-blue-500">AI</span></h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50"
          >
            <i className="fas fa-plus"></i>
            <span>강좌 추가하기</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:hidden w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
              <input 
                type="text" 
                placeholder="강좌명, 강사 또는 플랫폼 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <i className="fas fa-layer-group mr-2 text-blue-600"></i>
              나의 학습 보관함 ({filteredCourses.length})
            </h2>
          </div>

          <div className="space-y-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onDelete={() => handleDeleteCourse(course.id)} 
                />
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <i className="fas fa-search text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">보관함이 비어 있습니다</h3>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">새 강좌를 추가하거나 AI 스마트 분석을 통해 웹/문서 정보를 가져와보세요.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="mb-4 flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-slate-800">학습 보조 AI</h2>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">준비 완료</span>
                </div>
              </div>
              <Chatbot courses={courses} />
            </div>
          </div>
        </div>
      </main>

      <AddCourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddCourse}
      />
    </div>
  );
};

export default App;
