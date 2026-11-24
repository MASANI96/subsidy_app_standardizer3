import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileUp,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getRelativeDateYmd,
  SAMPLE_MINUTE_ADDITIONAL,
  SAMPLE_MINUTE_INITIAL,
} from '../../data/initialData';
import { extractTextFromSource } from '../../services/aiService';
import {
  MinuteInputType,
  TMinute,
  TProject,
  TQuestionAnswer,
} from '../../types';
import { SpecTagBadge } from '../SpecTagBadge';

interface MinutesAiTabProps {
  project: TProject;
  minutes: TMinute[];
  answers: TQuestionAnswer[];
  geminiModelStandard: string;
  onAddMinute: (input: {
    recorded_date: string;
    source_title: string;
    input_type: MinuteInputType;
    file_name?: string;
    gdoc_url?: string;
    content_text: string;
  }) => void;
  onDeleteMinute: (minuteId: string) => void;
  onRunExtractAll: (protectManualEdits: boolean) => Promise<{
    answeredCount: number;
    insufficientCount: number;
    skippedManualCount: number;
  }>;
  onRunReExtractInsufficient: () => Promise<{
    newlyAnsweredCount: number;
    stillInsufficientCount: number;
    keptInsufficientByNoInfo: boolean;
  }>;
  onGoToDraftTab: () => void;
  onGoToProgressTab: () => void;
  onNotify: (msg: string) => void;
}

export const MinutesAiTab: React.FC<MinutesAiTabProps> = ({
  project,
  minutes,
  answers,
  geminiModelStandard,
  onAddMinute,
  onDeleteMinute,
  onRunExtractAll,
  onRunReExtractInsufficient,
  onGoToDraftTab,
  onGoToProgressTab,
  onNotify,
}) => {
  const [inputType, setInputType] = useState<MinuteInputType>('text');
  const [recordedDate, setRecordedDate] = useState(getRelativeDateYmd(0));
  const [sourceTitle, setSourceTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [gdocUrl, setGdocUrl] = useState('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExtractingSource, setIsExtractingSource] = useState(false);

  const [expandedMinuteIds, setExpandedMinuteIds] = useState<string[]>(() =>
    minutes[0] ? [minutes[0].minute_id] : []
  );

  const [isAiRunning, setIsAiRunning] = useState(false);
  const [lastAiBanner, setLastAiBanner] = useState<string | null>(null);
  const [manualEditConfirmOpen, setManualEditConfirmOpen] = useState(false);

  const manualEditedCount = answers.filter((a) => a.is_manual_edited).length;
  const insufficientCount = answers.filter(
    (a) => a.answer_status === 'insufficient'
  ).length;
  const answeredCount = answers.filter(
    (a) => a.answer_status === 'answered'
  ).length;

  const handleInsertSampleInitial = () => {
    setInputType('text');
    setRecordedDate(getRelativeDateYmd(0));
    setSourceTitle('第1回 初回ヒアリング議事録（一部不足あり）');
    setContentText(SAMPLE_MINUTE_INITIAL);
    setExtractError(null);
    onNotify('サンプル1（初回議事録・一部不足あり）をフォームにセットしました。');
  };

  const handleInsertSampleAdditional = () => {
    setInputType('text');
    setRecordedDate(getRelativeDateYmd(0));
    setSourceTitle('第2回 追加ヒアリング回答メール（不足解消用）');
    setContentText(SAMPLE_MINUTE_ADDITIONAL);
    setExtractError(null);
    onNotify('サンプル2（追加ヒアリング回答）をフォームにセットしました。「議事録を登録」を押してください。');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractError(null);
    setIsExtractingSource(true);
    setFileName(file.name);
    try {
      const res = await extractTextFromSource({ file });
      if (!res.ok) {
        setExtractError(res.errorMessage || 'ファイル読取に失敗しました。');
      } else {
        setContentText(res.extractedText);
        if (!sourceTitle.trim()) setSourceTitle(res.suggestedTitle);
        onNotify(`ファイル「${file.name}」からテキストを抽出しました。`);
      }
    } finally {
      setIsExtractingSource(false);
    }
  };

  const handleFetchGdocUrl = async () => {
    setExtractError(null);
    setIsExtractingSource(true);
    try {
      const res = await extractTextFromSource({ gdocUrl });
      if (!res.ok) {
        setExtractError(
          res.errorMessage || 'ドキュメントの取得に失敗しました。'
        );
      } else {
        setContentText(res.extractedText);
        if (!sourceTitle.trim()) setSourceTitle(res.suggestedTitle);
        onNotify('GoogleドキュメントURLから本文テキストを抽出しました。');
      }
    } finally {
      setIsExtractingSource(false);
    }
  };

  const handleRegisterMinute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentText.trim()) {
      onNotify('議事録の本文テキストを入力または抽出してください。');
      return;
    }
    onAddMinute({
      recorded_date: recordedDate || getRelativeDateYmd(0),
      source_title: sourceTitle.trim() || 'ヒアリング記録',
      input_type: inputType,
      file_name: inputType === 'file' ? fileName : undefined,
      gdoc_url: inputType === 'gdoc_url' ? gdocUrl : undefined,
      content_text: contentText,
    });
    setSourceTitle('');
    setContentText('');
    setFileName('');
    setGdocUrl('');
    setExtractError(null);
    onNotify('議事録を登録しました。続けて下のAI生成ボタンを実行できます。');
  };

  const executeExtractAll = async (protectManualEdits: boolean) => {
    setManualEditConfirmOpen(false);
    setIsAiRunning(true);
    try {
      const res = await onRunExtractAll(protectManualEdits);
      const msg = `AI抽出完了（${geminiModelStandard}）：回答あり ${res.answeredCount}問 ／ 不足 ${res.insufficientCount}問${
        res.skippedManualCount > 0
          ? `（手修正保護 ${res.skippedManualCount}問）`
          : ''
      }。不足設問はタブ①の顧客依頼リストへ自動同期しました。`;
      setLastAiBanner(msg);
      onNotify(msg);
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleClickExtractAll = () => {
    if (minutes.length === 0) {
      onNotify('議事録が0件のため抽出できません。先に議事録を登録してください。');
      return;
    }
    if (manualEditedCount > 0) {
      setManualEditConfirmOpen(true);
      return;
    }
    void executeExtractAll(true);
  };

  const handleClickReExtractInsufficient = async () => {
    if (insufficientCount === 0) {
      onNotify('現在「不足」ステータスの設問はありません。');
      return;
    }
    setIsAiRunning(true);
    try {
      const res = await onRunReExtractInsufficient();
      if (res.keptInsufficientByNoInfo) {
        const msg =
          '追加情報が見当たらないため、推測で埋めず『不足』を維持しました（推測禁止ルール適用）。';
        setLastAiBanner(msg);
        onNotify(msg);
      } else {
        const msg = `不足設問のみ再抽出完了：${res.newlyAnsweredCount}問を「回答あり」へ更新し、タブ①の対応依頼も「回収・回答済」へ連動更新しました。`;
        setLastAiBanner(msg);
        onNotify(msg);
      }
    } finally {
      setIsAiRunning(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMinuteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. 議事録・ヒアリング追加フォーム */}
      <section
        data-guide-id="guide-minutes-form"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              1. 議事録・ヒアリング回答の登録
            </h2>
            <SpecTagBadge tag="画面3 / No.7" />
          </div>

          {/* サンプルワンクリック投入ボタン */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSampleInitial}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              サンプル1: 初回議事録（一部不足あり）を挿入
            </button>
            <button
              type="button"
              onClick={handleInsertSampleAdditional}
              className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 cursor-pointer"
            >
              サンプル2: 追加ヒアリング回答（不足解消用）を挿入
            </button>
          </div>
        </div>

        {/* 入力方式タブ */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(
            [
              { id: 'text', label: '① テキスト直接貼付' },
              { id: 'file', label: '② ファイルアップロード (.pdf / .docx / .xlsx / .txt)' },
              { id: 'gdoc_url', label: '③ Googleドキュメント・ドライブURL' },
            ] as { id: MinuteInputType; label: string }[]
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setInputType(mode.id);
                setExtractError(null);
              }}
              className={`px-3 py-1.5 font-semibold border transition-colors cursor-pointer ${
                inputType === mode.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegisterMinute} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                発言日 / 受領日
              </label>
              <input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 font-mono text-xs focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-9">
              <label className="block font-bold text-slate-700 mb-1">
                資料名・ラベル
              </label>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="例：第2回ヒアリング回答メール / 追加確認メモ"
                className="w-full border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* ファイルアップロード入力 */}
          {inputType === 'file' && (
            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700">
                <FileUp className="w-4 h-4 text-blue-700" />
                <span>
                  {fileName
                    ? `選択中ファイル: ${fileName}`
                    : 'ファイルを選択すると本文テキストを自動抽出します（.pdf / .docx / .xlsx / .txt）'}
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span>ファイルを選択</span>
              </label>
            </div>
          )}

          {/* GoogleドキュメントURL入力 */}
          {inputType === 'gdoc_url' && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-700 shrink-0" />
                <input
                  type="url"
                  value={gdocUrl}
                  onChange={(e) => setGdocUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/... （テスト用エラー確認：URLに error を含めると権限エラー表示）"
                  className="flex-1 min-w-[260px] bg-white border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-700"
                />
                <button
                  type="button"
                  disabled={isExtractingSource}
                  onClick={handleFetchGdocUrl}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isExtractingSource ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>URLから本文を抽出</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {extractError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 text-rose-800 px-3 py-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              議事録・ヒアリング本文テキスト
            </label>
            <textarea
              rows={7}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="ヒアリング内容やお客様からの回答メール本文を貼り付けてください..."
              className="w-full border border-slate-300 p-3 text-xs leading-relaxed focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>議事録を登録</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. AI仮計画書生成コントロール */}
      <section
        data-guide-id="guide-minutes-ai"
        className="bg-blue-50/50 border border-blue-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              2. AI仮計画書生成・不足設問のみ再抽出（推測禁止ルール適用）
            </h2>
            <SpecTagBadge tag="画面3 / No.8〜10" />
          </div>
          <span className="text-[11px] font-mono bg-white border border-blue-200 px-2 py-0.5 text-blue-900">
            使用モデル: {geminiModelStandard}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white border border-slate-200 p-3">
            <div className="text-slate-500 text-[11px]">蓄積済み議事録</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {minutes.length} 件
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-3">
            <div className="text-slate-500 text-[11px]">設問回答状況</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              回答あり {answeredCount}問 ／{' '}
              <span className={insufficientCount > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                不足 {insufficientCount}問
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-3">
            <div className="text-slate-500 text-[11px]">手修正済み保護対象</div>
            <div className="text-base font-bold font-mono text-blue-800 mt-0.5">
              {manualEditedCount} 問
            </div>
          </div>
        </div>

        <div className="bg-white border border-blue-200 p-3 text-[11px] text-slate-700 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            <strong>推測禁止ルール：</strong>
            議事録に記載のない数値・スケジュール・加点有無等はAIが勝手に創作せず、必ず「不足」としてタブ①の顧客依頼リストへ自動登録します。追加ヒアリング登録後は「不足だった設問のみを再抽出」することで、既存回答や手修正を壊さずに不足部分のみ追記できます。
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isAiRunning}
            onClick={handleClickExtractAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isAiRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>全議事録から回答を抽出・仮計画書を生成</span>
          </button>

          <button
            type="button"
            disabled={isAiRunning || insufficientCount === 0}
            onClick={handleClickReExtractInsufficient}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-blue-700 ${isAiRunning ? 'animate-spin' : ''}`} />
            <span>
              不足だった設問のみを再抽出・追記生成（対象: {insufficientCount}問）
            </span>
          </button>
        </div>

        {lastAiBanner && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
            <span className="font-semibold">{lastAiBanner}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToDraftTab}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer"
              >
                <span>タブ3（仮事業計画書）を確認</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onGoToProgressTab}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-400 text-emerald-900 font-semibold hover:bg-emerald-100 cursor-pointer"
              >
                <span>タブ1（回収リスト）を確認</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. 蓄積済み議事録一覧 */}
      <section
        data-guide-id="guide-minutes-list"
        className="bg-white border border-slate-200 p-5 space-y-3"
      >
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
          3. 蓄積済み議事録・ヒアリング履歴（{minutes.length}件）
        </h2>

        {minutes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            まだ議事録が登録されていません。上のフォームから登録してください。
          </div>
        ) : (
          <div className="space-y-2.5">
            {minutes.map((m) => {
              const isExpanded = expandedMinuteIds.includes(m.minute_id);
              return (
                <div
                  key={m.minute_id}
                  className="border border-slate-200 bg-slate-50/50"
                >
                  <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(m.minute_id)}
                      className="flex items-center gap-2 text-left text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="font-mono text-slate-500">
                        {m.recorded_date}
                      </span>
                      <span>{m.source_title}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-300 text-slate-600">
                        {m.input_type === 'text'
                          ? 'テキスト貼付'
                          : m.input_type === 'file'
                            ? `ファイル (${m.file_name || ''})`
                            : 'GoogleドキュメントURL'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMinute(m.minute_id);
                        onNotify(`議事録「${m.source_title}」を削除しました。`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>削除</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-200 bg-white">
                      {m.gdoc_url && (
                        <div className="text-[11px] text-blue-700 font-mono mb-1.5 break-all">
                          参照URL: {m.gdoc_url}
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                        {m.content_text}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 手修正済み保護確認ダイアログ */}
      {manualEditConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-slate-300 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              手修正済み設問の保護確認
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              仮事業計画書の中に、担当者が直接修正・保存した設問が{' '}
              <strong>{manualEditedCount} 問</strong> あります。手修正を保護してスキップするか、すべてAI生成結果で上書きするか選択してください。
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void executeExtractAll(true)}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 cursor-pointer"
              >
                手修正済みを保護してスキップ（未編集のみ再抽出）
              </button>
              <button
                type="button"
                onClick={() => void executeExtractAll(false)}
                className="w-full px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300 hover:bg-rose-100 cursor-pointer"
              >
                手修正を含めてすべて上書き再生成する
              </button>
              <button
                type="button"
                onClick={() => setManualEditConfirmOpen(false)}
                className="w-full px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
