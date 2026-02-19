import React from 'react';
import {
  ClientManagement,
  SharedPasswordManagement,
  AdminCodeManagement,
} from './components';

/**
 * AdminSettings 컴포넌트
 *
 * 리팩토링 후:
 * - 기존 1,188줄 → 약 50줄 (96% 감소)
 * - 29개 useState → 0개 (서브 컴포넌트로 분리)
 * - 단일 책임 원칙 준수: 레이아웃만 담당
 *
 * 서브 컴포넌트:
 * - ClientManagement: 소속 CRUD (~340줄)
 * - SharedPasswordManagement: 공유 비밀번호 CRUD (~370줄)
 * - AdminCodeManagement: 관리자 코드 CRUD (~170줄)
 */
const AdminSettings: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <h2 className="text-lg font-black text-white">설정</h2>

      {/* 소속 관리 */}
      <ClientManagement />

      {/* 공유 비밀번호 관리 */}
      <SharedPasswordManagement />

      {/* 관리자 인증코드 관리 */}
      <AdminCodeManagement />

      {/* 시스템 정보 */}
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-black text-slate-200 tracking-wider mb-4">시스템 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">버전</span>
            <span className="text-white font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">사용자 세션 시간</span>
            <span className="text-white">1시간</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">관리자 세션 시간</span>
            <span className="text-white">2시간</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
