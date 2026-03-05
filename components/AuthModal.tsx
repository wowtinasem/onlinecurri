
import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setSuccess('');
    onClose();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setError(''); setIsLoading(true);
    try {
      const user = await firebaseService.loginUser(email, password);
      if (!user.approved) {
        setError('관리자 승인 대기 중입니다. 승인 후 이용 가능합니다.');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin(user);
      resetAndClose();
    } catch (err: any) {
      setError(err.message === 'INVALID_CREDENTIALS' || err.message === 'USER_NOT_FOUND'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.' : '로그인 중 오류가 발생했습니다.');
    } finally { setIsLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError('모든 항목을 입력해주세요.'); return; }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setError(''); setIsLoading(true);
    try {
      await firebaseService.registerUser(name, email, password);
      setSuccess('회원가입이 완료되었습니다! 관리자 승인 후 로그인할 수 있습니다.');
      setTimeout(() => { setMode('login'); setSuccess(''); setName(''); setPassword(''); setConfirmPassword(''); }, 2500);
    } catch (err: any) {
      setError(err.message === 'EMAIL_EXISTS' ? '이미 등록된 이메일입니다.' : '회원가입 중 오류가 발생했습니다.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            <i className="fas fa-user-circle mr-2 text-blue-600"></i>
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <button onClick={resetAndClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              로그인
            </button>
            <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              회원가입
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center border border-red-100">
              <i className="fas fa-exclamation-circle mr-2"></i>{error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center border border-emerald-100">
              <i className="fas fa-check-circle mr-2"></i>{success}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이름</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : null)}
                placeholder="비밀번호"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">비밀번호 확인</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" />
              </div>
            )}
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors mt-2 disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center"><i className="fas fa-spinner fa-spin mr-2"></i>처리 중...</span>
              ) : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
