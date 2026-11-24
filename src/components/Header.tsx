import React, { useState } from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';
import { ScreenId } from '../types';

interface HeaderProps {
  activeScreen: ScreenId;
  guideOpen: boolean;
  onToggleGuide: () => void;
  onChangeScreen: (screen: ScreenId) => void;
  onResetAll: () => void;
}

const NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'dashboard', label: '01. 工程管理表' },
  { id: 'workspace', label: '02. 案件詳細ワークスペース' },
  { id: 'templates', label: '03. 補助金・公募回テンプレート管理' },
  { id: 'settings', label: '04. システム設定' },
];

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  guideOpen,
  onToggleGuide,
  onChangeScreen,
  onResetAll,
}) => {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onChangeScreen('dashboard')}
              className="text-sm font-bold tracking-tight text-white hover:text-blue-200 transition-colors whitespace-nowrap cursor-pointer text-left"
            >
              補助金申請支援システム（モック）
            </button>
          </div>

          {/* 4-Screen Global Navigation */}
          <nav
            aria-label="メインメニュー"
            className="flex items-center gap-4 text-xs font-medium overflow-x-auto"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeScreen(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-blue-400 text-white font-semibold'
                      : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleGuide}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                guideOpen
                  ? 'bg-blue-700 border-blue-500 text-white hover:bg-blue-800'
                  : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{guideOpen ? '説明ガイドを閉じる' : '説明ガイドを開く'}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              title="データを初期状態に戻す"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>リセット（初期状態に戻す）</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-300 p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              初期状態へのリセット確認
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              ブラウザの localStorage に保存された編集内容（追加案件・議事録・仮計画書・テンプレート設定等）を破棄し、初期プリセット状態へ戻します。よろしいですか？
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetAll();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 cursor-pointer"
              >
                リセット実行
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
