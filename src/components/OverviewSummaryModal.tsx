import React from 'react';
import {
  ArrowRight,
  Ban,
  Database,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

interface OverviewSummaryModalProps {
  mode: 'overview' | null;
  onClose: () => void;
  onOpenStep?: (stepNumber: number) => void;
}

export const OverviewSummaryModal: React.FC<OverviewSummaryModalProps> = ({
  mode,
  onClose,
  onOpenStep,
}) => {
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white border border-slate-300 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-blue-300 uppercase tracking-wider">
              Script 00 / GAS Webアプリ版 全体構成とスコープ
            </div>
            <h2 className="text-base font-bold mt-0.5">
              補助金申請支援システム：GAS + スプレッドシート + Gemini 構成概要
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-slate-800">
          {/* 1. 3大アウトプット */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              1. 本システムで実現する3大アウトプット
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-blue-200 bg-blue-50/40 p-3.5 space-y-1.5">
                <div className="font-bold text-blue-950">
                  ① 工程管理表＆停滞監視（画面1）
                </div>
                <p className="text-slate-700 leading-relaxed">
                  進行中案件の工程・次アクション期限・何待ち区分（お客様待ち／社内待ち）・停滞日数・未回収件数を一覧監視し、期限超過を自動警告します。
                </p>
              </div>
              <div className="border border-blue-200 bg-blue-50/40 p-3.5 space-y-1.5">
                <div className="font-bold text-blue-950">
                  ② 顧客依頼文の自動生成（画面2）
                </div>
                <p className="text-slate-700 leading-relaxed">
                  AI抽出で「不足」となった質問と未回収の必要書類を統合リスト化し、顧客送付用の依頼メール文面生成と一括「依頼済（お客様待ち）」化を行います。
                </p>
              </div>
              <div className="border border-blue-200 bg-blue-50/40 p-3.5 space-y-1.5">
                <div className="font-bold text-blue-950">
                  ③ 根拠付き仮事業計画書（画面3〜4）
                </div>
                <p className="text-slate-700 leading-relaxed">
                  推測禁止ルールにより記載のない事項は埋めず、引用元議事録を明示して生成。審査項目の3段階判定（十分／薄い／未記載）と不足のみ再抽出に対応します。
                </p>
              </div>
            </div>
          </div>

          {/* 2. 本番技術構成（9シート＋Gemini） */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              2. 本番想定アーキテクチャ（Google Workspace完結構成）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <div className="font-bold text-slate-900">
                  バックエンド / DB：GAS + Googleスプレッドシート（9シート）
                </div>
                <p className="text-slate-600 leading-relaxed">
                  マスタ5シート（M_Subsidies / M_Questions / M_ReviewCriteria / M_RequiredDocs / M_ProcessStatuses）とトランザクション4シート（T_Projects / T_Minutes / T_QuestionAnswers / T_ClientRequests）で構成。
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <div className="font-bold text-slate-900">
                  AIエンジン：Gemini API（スクリプトプロパティ管理）
                </div>
                <p className="text-slate-600 leading-relaxed">
                  標準処理（gemini-2.5-flash）と高精度解析（gemini-2.5-pro）を用途別に使い分け、APIキーはGASサーバー側のみで安全に保持します。
                </p>
              </div>
            </div>
          </div>

          {/* 3. スコープ対象外 */}
          <div className="border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Ban className="w-4 h-4 text-slate-600" />
              <span>3. 仕様書・見積書における対象外範囲（本モックからも撤去済）</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              決算書PDFの勘定科目取込・見比べビューア／BS・PL収支シミュレーション・逆算ソルバー・Excel出力／文章モジュール・Diff記録／ロール別権限・表示単位切替／顧客共有URL発行機能は今回開発スコープ対象外です。
            </p>
          </div>

          {/* ガイド章ジャンプ */}
          {onOpenStep && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: '01. 工程管理表', idx: 1 },
                { label: '02. テンプレートAI分解', idx: 2 },
                { label: '04. 推測禁止＆依頼文連動', idx: 4 },
                { label: '05. 不足のみ再抽出', idx: 5 },
                { label: '06. 仮計画書＆3段階判定', idx: 6 },
              ].map((btn) => (
                <button
                  key={btn.idx}
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStep(btn.idx);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 cursor-pointer"
                >
                  <span>{btn.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            左側の「説明ガイド」パネルから各画面の操作検証へ進めます
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
