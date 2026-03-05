
import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { User } from '../types';

export const AdminUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToUsers(setUsers);
    return () => unsubscribe();
  }, []);

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);
  const displayUsers = activeTab === 'pending' ? pendingUsers : approvedUsers;

  const handleApprove = async (userId: string) => {
    await firebaseService.approveUser(userId);
  };

  const handleReject = async (userId: string) => {
    if (window.confirm('이 사용자를 삭제하시겠습니까?')) {
      await firebaseService.rejectUser(userId);
    }
  };

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 mt-3">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center">
        <i className="fas fa-users mr-2 text-blue-400"></i>
        사용자 관리
        {pendingUsers.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {pendingUsers.length}
          </span>
        )}
      </h3>
      <div className="flex bg-slate-600 p-0.5 rounded-lg mb-3">
        <button onClick={() => setActiveTab('pending')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'pending' ? 'bg-slate-500 text-white' : 'text-slate-400'}`}>
          대기 중 ({pendingUsers.length})
        </button>
        <button onClick={() => setActiveTab('approved')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'approved' ? 'bg-slate-500 text-white' : 'text-slate-400'}`}>
          승인됨 ({approvedUsers.length})
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {displayUsers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {activeTab === 'pending' ? '대기 중인 사용자가 없습니다.' : '승인된 사용자가 없습니다.'}
          </p>
        ) : (
          displayUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-slate-600/50 rounded-lg px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <div className="flex space-x-1 ml-2 flex-shrink-0">
                {!user.approved && (
                  <button onClick={() => handleApprove(user.id)}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-md font-semibold hover:bg-emerald-700 transition-colors">
                    승인
                  </button>
                )}
                <button onClick={() => handleReject(user.id)}
                  className="px-2 py-1 bg-red-600/50 text-red-300 text-xs rounded-md font-semibold hover:bg-red-600 transition-colors">
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
