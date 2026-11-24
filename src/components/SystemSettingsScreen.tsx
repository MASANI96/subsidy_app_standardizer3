import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Cpu,
  KeyRound,
  Plus,
  Save,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { MProcessStatus, SystemSettings, TProject } from '../types';
import { SpecTagBadge } from './SpecTagBadge';

interface SystemSettingsScreenProps {
  processStatuses: MProcessStatus[];
  projects: TProject[];
  systemSettings: SystemSettings;
  onSaveProcessStatuses: (statuses: MProcessStatus[]) => void;
  onUpdateSystemSettings: (patch: Partial<SystemSettings>) => void;
  onNotify: (msg: string) => void;
}

const STANDARD_MODEL_PRESETS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const HEAVY_MODEL_PRESETS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

export const SystemSettingsScreen: React.FC<SystemSettingsScreenProps> = ({
  processStatuses,
  projects,
  systemSettings,
  onSaveProcessStatuses,
  onUpdateSystemSettings,
  onNotify,
}) => {
  const [draftStatuses, setDraftStatuses] = useState<MProcessStatus[]>(() =>
    [...processStatuses].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [modelStandard, setModelStandard] = useState(
    systemSettings.geminiModelStandard
  );
  const [modelHeavy, setModelHeavy] = useState(systemSettings.geminiModelHeavy);
  const [isApiConfigured, setIsApiConfigured] = useState(
    systemSettings.isApiKeyConfigured
  );

  useEffect(() => {
    setDraftStatuses(
      [...processStatuses].sort((a, b) => a.sort_order - b.sort_order)
    );
  }, [processStatuses]);

  useEffect(() => {
    setModelStandard(systemSettings.geminiModelStandard);
    setModelHeavy(systemSettings.geminiModelHeavy);
    setIsApiConfigured(systemSettings.isApiKeyConfigured);
  }, [systemSettings]);

  const moveStatus = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= draftStatuses.length) return;
    const copy = [...draftStatuses];
    const [removed] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, removed);
    setDraftStatuses(copy.map((s, i) => ({ ...s, sort_order: i + 1 })));
  };

  const addStatusRow = () => {
    const nextOrder = draftStatuses.length + 1;
    setDraftStatuses((prev) => [
      ...prev,
      {
        status_id: `status-custom-${Date.now()}`,
        sort_order: nextOrder,
        status_name: '新規工程',
        is_completed_state: false,
        is_active: true,
      },
    ]);
  };

  const handleSaveStatuses = () => {
    if (draftStatuses.some((s) => !s.status_name.trim())) {
      onNotify('工程ステータス名が空の行があります。名称を入力してください。');
      return;
    }
    onSaveProcessStatuses(draftStatuses);
    onNotify('工程ステータスマスタを保存しました。');
  };

  const handleSaveGeminiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings({
      geminiModelStandard: modelStandard.trim() || 'gemini-2.5-flash',
      geminiModelHeavy: modelHeavy.trim() || 'gemini-2.5-pro',
      isApiKeyConfigured: isApiConfigured,
    });
    onNotify('Gemini AIモデル・API設定を保存しました。');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <h1 className="text-lg font-bold text-slate-900">システム管理設定</h1>
          <SpecTagBadge tag="画面6 / M_ProcessStatuses & AI設定" />
        </div>
        <p className="text-xs text-slate-600 mt-1">
          工程ステータスマスタの並び順・完了扱い設定、および本番GAS環境で呼び出すGeminiモデルの構成を管理します。
        </p>
      </div>

      {/* 1. 工程ステータスマスタ編集 */}
      <section
        data-guide-id="guide-settings-statuses"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              1. 工程ステータスマスタ編集（M_ProcessStatuses）
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              「完了扱い」をONにすると、工程管理表の「進行中のみ表示」フィルタで非表示になります。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addStatusRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>工程を追加</span>
            </button>
            <button
              type="button"
              onClick={handleSaveStatuses}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>マスタを保存</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2 px-3 w-20 text-center">並び順</th>
                <th className="py-2 px-3">ステータス名称</th>
                <th className="py-2 px-3 w-48 text-center">
                  完了扱い（進行中から除外）
                </th>
                <th className="py-2 px-3 w-32 text-center">有効 / 無効</th>
                <th className="py-2 px-3 w-44">既存案件での使用状況</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {draftStatuses.map((st, idx) => {
                const usedCount = projects.filter(
                  (p) => p.process_status_id === st.status_id
                ).length;

                return (
                  <tr
                    key={st.status_id}
                    className={!st.is_active ? 'bg-slate-50 text-slate-500' : 'bg-white'}
                  >
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-mono font-bold w-5">{idx + 1}</span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveStatus(idx, -1)}
                          className="p-0.5 bg-white border border-slate-300 disabled:opacity-30 cursor-pointer"
                          title="上へ"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === draftStatuses.length - 1}
                          onClick={() => moveStatus(idx, 1)}
                          className="p-0.5 bg-white border border-slate-300 disabled:opacity-30 cursor-pointer"
                          title="下へ"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={st.status_name}
                        onChange={(e) =>
                          setDraftStatuses((prev) =>
                            prev.map((item) =>
                              item.status_id === st.status_id
                                ? { ...item, status_name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full max-w-xs border border-slate-300 px-2.5 py-1 text-xs font-semibold bg-white"
                      />
                    </td>

                    <td className="py-2 px-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={st.is_completed_state}
                          onChange={(e) =>
                            setDraftStatuses((prev) =>
                              prev.map((item) =>
                                item.status_id === st.status_id
                                  ? {
                                      ...item,
                                      is_completed_state: e.target.checked,
                                    }
                                  : item
                              )
                            )
                          }
                          className="accent-blue-700 w-3.5 h-3.5"
                        />
                        <span>{st.is_completed_state ? '完了扱い' : '進行中'}</span>
                      </label>
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftStatuses((prev) =>
                            prev.map((item) =>
                              item.status_id === st.status_id
                                ? { ...item, is_active: !item.is_active }
                                : item
                            )
                          )
                        }
                        className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer ${
                          st.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {st.is_active ? '有効' : '無効'}
                      </button>
                    </td>

                    <td className="py-2 px-3 text-[11px]">
                      {usedCount > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono font-bold text-blue-800">
                            {usedCount}件で使用中
                          </span>
                          {!st.is_active && (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              既存表示は安全保持
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">未使用</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Gemini AI設定 */}
      <section
        data-guide-id="guide-settings-gemini"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Cpu className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">
            2. Gemini AI モデル・APIキー設定（本番GAS連携仕様）
          </h2>
        </div>

        <form onSubmit={handleSaveGeminiSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 標準モデル */}
            <div className="border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <div className="font-bold text-slate-900">
                標準処理用モデル（議事録抽出・仮計画書生成・再抽出）
              </div>
              <select
                value={
                  STANDARD_MODEL_PRESETS.includes(modelStandard)
                    ? modelStandard
                    : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setModelStandard(e.target.value);
                  }
                }}
                className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
              >
                {STANDARD_MODEL_PRESETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__custom__">自由入力</option>
              </select>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  モデルID（直接編集可）
                </label>
                <input
                  type="text"
                  value={modelStandard}
                  onChange={(e) => setModelStandard(e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* 高精度モデル */}
            <div className="border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <div className="font-bold text-slate-900">
                高精度解析用モデル（公募要領AI分解・審査項目3段階判定）
              </div>
              <select
                value={
                  HEAVY_MODEL_PRESETS.includes(modelHeavy)
                    ? modelHeavy
                    : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setModelHeavy(e.target.value);
                  }
                }}
                className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
              >
                {HEAVY_MODEL_PRESETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__custom__">自由入力</option>
              </select>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">
                  モデルID（直接編集可）
                </label>
                <input
                  type="text"
                  value={modelHeavy}
                  onChange={(e) => setModelHeavy(e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* GEMINI_API_KEY ステータス（モック） */}
          <div className="border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-slate-900">
                  GEMINI_API_KEY 設定ステータス
                </span>
                {isApiConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    設定済（{systemSettings.apiKeyMaskedPreview}）
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    未設定
                  </span>
                )}
              </div>

              <label className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApiConfigured}
                  onChange={(e) => setIsApiConfigured(e.target.checked)}
                  className="accent-blue-700"
                />
                <span className="text-[11px] font-semibold">
                  APIキー設定済状態として動作テスト
                </span>
              </label>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">
                本番GAS環境でのスクリプトプロパティ設定手順：
              </div>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>
                  Google Apps Script エディタの左メニュー「プロジェクトの設定（歯車アイコン）」を開く。
                </li>
                <li>
                  下部の「スクリプトプロパティ」で「スクリプトプロパティを追加」をクリック。
                </li>
                <li>
                  プロパティ名に <code className="font-mono bg-white px-1 border">GEMINI_API_KEY</code>、値に Google AI Studio で発行したAPIキーを登録（ブラウザ側には一切露出しません）。
                </li>
              </ol>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>AI設定を保存</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
