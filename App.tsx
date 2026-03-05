
import React, { useState, useMemo, useEffect } from 'react';
import { Course } from './types';
import { CourseCard } from './components/CourseCard';
import { AddCourseModal } from './components/AddCourseModal';
import { Chatbot } from './components/Chatbot';
import { geminiService } from './services/geminiService';
import { firebaseService } from './services/firebaseService';

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(geminiService.getApiKey());
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const isAdmin = isAuthenticated && !!apiKey;

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToCourses((firebaseCourses) => {
      setCourses(firebaseCourses);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return;
    setAuthError('');
    try {
      const ok = await firebaseService.verifyAdminPassword(adminPassword);
      if (ok) {
        setIsAuthenticated(true);
        setAdminPassword('');
      } else {
        setAuthError('비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setAuthError('인증 중 오류가 발생했습니다.');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setShowAdminPanel(false);
    setShowChangePassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg('');
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      geminiService.setApiKey(tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      setTempApiKey('');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) { setPasswordMsg('새 비밀번호를 입력하세요.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('비밀번호가 일치하지 않습니다.'); return; }
    try {
      await firebaseService.changeAdminPassword(newPassword);
      setPasswordMsg('비밀번호가 변경되었습니다!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordMsg(''); setShowChangePassword(false); }, 1500);
    } catch {
      setPasswordMsg('비밀번호 변경에 실패했습니다.');
    }
  };

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.platform.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const handleAddCourse = async (newCourse: Course) => {
    try {
      await firebaseService.saveCourse(newCourse);
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('강좌 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("이 강좌를 보관함에서 삭제하시겠습니까?")) {
      try {
        await firebaseService.deleteCourse(id);
      } catch (error) {
        console.error('Failed to delete course:', error);
        alert('강좌 삭제에 실패했습니다. 다시 시도해주세요.');
      }
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
            <h1 className="text-xl font-bold text-white tracking-tight">Online<span className="text-blue-500">curri</span></h1>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    apiKey
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                      : 'bg-amber-600/20 text-amber-400 border-amber-500/30 hover:bg-amber-600/30 animate-pulse'
                  }`}
                >
                  <i className={`fas ${apiKey ? 'fa-shield-alt' : 'fa-key'}`}></i>
                  <span className="hidden md:inline">{apiKey ? '관리자 모드' : 'API 키 필요'}</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all border bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="hidden md:inline">로그아웃</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border bg-slate-600/20 text-slate-400 border-slate-500/30 hover:bg-slate-600/30"
              >
                <i className="fas fa-lock"></i>
                <span className="hidden md:inline">관리자 로그인</span>
              </button>
            )}
            {isAdmin && (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {showAdminPanel && (
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {!isAuthenticated ? (
              <div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={e => { setAdminPassword(e.target.value); setAuthError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                      placeholder="관리자 비밀번호를 입력하세요"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAdminLogin}
                    disabled={!adminPassword.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => { setShowAdminPanel(false); setAuthError(''); setAdminPassword(''); }}
                    className="px-3 py-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-red-400 mt-2">
                    <i className="fas fa-exclamation-circle mr-1"></i>{authError}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  관리자 비밀번호를 입력하면 강좌를 추가/삭제할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={e => setTempApiKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
                      placeholder="Gemini API 키를 입력하세요 (Google AI Studio에서 발급)"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!tempApiKey.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setShowAdminPanel(false)}
                    className="px-3 py-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    <i className="fas fa-lock mr-1"></i>
                    API 키는 브라우저에만 저장됩니다.
                  </p>
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    <i className="fas fa-cog mr-1"></i>비밀번호 변경
                  </button>
                </div>
                {showChangePassword && (
                  <div className="bg-slate-700/50 rounded-xl p-3 space-y-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setPasswordMsg(''); }}
                      placeholder="새 비밀번호"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setPasswordMsg(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                      placeholder="새 비밀번호 확인"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <div className="flex items-center justify-between">
                      {passwordMsg && (
                        <p className={`text-xs ${passwordMsg.includes('변경되었습니다') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {passwordMsg}
                        </p>
                      )}
                      <button
                        onClick={handleChangePassword}
                        disabled={!newPassword.trim() || !confirmPassword.trim()}
                        className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                      >
                        변경
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-5xl mb-4 animate-bounce">🧑‍🎓</div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <span className="inline-block animate-[walk_1s_steps(2)_infinite] text-2xl">🚶</span>
                  <span>강좌를 불러오는 중...</span>
                  <span className="inline-block animate-[walk_1s_steps(2)_infinite_reverse] text-2xl scale-x-[-1]">🚶</span>
                </div>
              </div>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDelete={isAdmin ? () => handleDeleteCourse(course.id) : undefined}
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

      {isAdmin && (
        <AddCourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddCourse}
        />
      )}
    </div>
  );
};

export default App;
