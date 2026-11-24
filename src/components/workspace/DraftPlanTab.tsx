import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  FileSearch,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  CriteriaCoverageLevel,
  MReviewCriterion,
  TProject,
  TQuestionAnswer,
} from '../../types';
import { SpecTagBadge } from '../SpecTagBadge';

interface DraftPlanTabProps {
  project: TProject;
  answers: TQuestionAnswer[];
  criteria: MReviewCriterion[];
  onSaveAnswerDraft: (answerId: string, draftText: string) => void;
  onEvaluateCriteria: () => Promise<unknown>;
  onGoToProgressTab: () => void;
  onNotify: (msg: string) => void;
}

const LEVEL_META: Record<
  CriteriaCoverageLevel,
  { label: string; badgeClass: string; borderClass: string }
> = {
  sufficient: {
    label: '十分記述されている',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    borderClass: 'border-emerald-200 bg-emerald-50/30',
  },
  weak: {
    label: '記述が薄い',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-amber-200 bg-amber-50/40',
  },
  missing: {
    label: '未記載',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    borderClass: 'border-rose-200 bg-rose-50/40',
  },
};

export const DraftPlanTab: React.FC<DraftPlanTabProps> = ({
  project,
  answers,
  criteria,
  onSaveAnswerDraft,
  onEvaluateCriteria,
  onGoToProgressTab,
  onNotify,
}) => {
  // 設問ごとの編集テキストマップ
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [openEvidenceIds, setOpenEvidenceIds] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    answers.forEach((a) => {
      next[a.answer_id] = a.draft_text;
    });
    setDraftEdits(next);
  }, [answers]);

  const answeredCount = answers.filter(
    (a) => a.answer_status === 'answered'
  ).length;
  const insufficientCount = answers.filter(
    (a) => a.answer_status === 'insufficient'
  ).length;

  const coverageList = project.criteria_coverage || [];
  const sufficientCriteriaCount = coverageList.filter(
    (c) => c.level === 'sufficient'
  ).length;
  const weakCriteriaCount = coverageList.filter(
    (c) => c.level === 'weak'
  ).length;
  const missingCriteriaCount = coverageList.filter(
    (c) => c.level === 'missing'
  ).length;

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      await onEvaluateCriteria();
      onNotify('全設問の最新記述内容に基づき、審査項目・加点項目のカバー状況を再判定しました。');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyAll = async () => {
    const text = answers
      .map((a) => {
        const body = draftEdits[a.answer_id] ?? a.draft_text;
        return `■ ${a.section_name} / ${a.question_title}\n${
          body.trim() ? body : '（※情報不足のため未記述）'
        }`;
      })
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId('ALL');
      setTimeout(() => setCopiedId(null), 2000);
      onNotify('全設問の仮事業計画書テキストを一括コピーしました。');
    } catch {
      onNotify('クリップボードへのコピーに失敗しました。');
    }
  };

  const handleCopySingle = async (ans: TQuestionAnswer) => {
    const body = draftEdits[ans.answer_id] ?? ans.draft_text;
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(ans.answer_id);
      setTimeout(() => setCopiedId(null), 2000);
      onNotify(`「${ans.question_title}」をコピーしました。`);
    } catch {
      onNotify('コピーに失敗しました。');
    }
  };

  const toggleEvidence = (id: string) => {
    setOpenEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. 上部サマリーバー */}
      <section
        data-guide-id="guide-draft-summary"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                仮の事業計画書 確認・直接編集・審査項目カバー判定
              </h2>
              <SpecTagBadge tag="画面4 / No.11, 15〜16" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
              <span className="text-slate-700">
                設問充足状況：全 <strong>{answers.length}</strong> 問中、
                <strong className="text-emerald-800 ml-1">
                  回答あり {answeredCount} 問
                </strong>{' '}
                ／{' '}
                <strong
                  className={
                    insufficientCount > 0 ? 'text-rose-700' : 'text-slate-600'
                  }
                >
                  不足 {insufficientCount} 問
                </strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700">
                審査項目カバー：
                <strong className="text-emerald-800 ml-1">
                  十分 {sufficientCriteriaCount}件
                </strong>{' '}
                ／{' '}
                <strong className="text-amber-800">
                  記述が薄い {weakCriteriaCount}件
                </strong>{' '}
                ／{' '}
                <strong className="text-rose-700">
                  未記載 {missingCriteriaCount}件
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isEvaluating}
              onClick={handleEvaluate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isEvaluating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>審査項目のカバー状況を判定（再判定）</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {copiedId === 'ALL' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-700">一括コピー済</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>全設問を一括コピー</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 2. 審査項目・加点項目カバー状況パネル */}
      <section
        data-guide-id="guide-draft-criteria"
        className="bg-white border border-slate-200 p-5 space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <h3 className="text-sm font-bold text-slate-900">
            審査項目・加点項目 カバー状況（3段階意味判定）
          </h3>
          <span className="text-[11px] text-slate-500">
            文章を追記保存した後に上の「再判定」を押すと判定が更新されます
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coverageList.map((cov) => {
            const meta = LEVEL_META[cov.level];
            return (
              <div
                key={cov.criteria_id}
                className={`border p-3.5 space-y-2 text-xs ${meta.borderClass}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                        cov.criteria_type === 'bonus'
                          ? 'bg-purple-50 text-purple-900 border-purple-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {cov.criteria_type === 'bonus' ? '加点' : '通常審査'}
                    </span>
                    <span className="font-bold text-slate-900">
                      {cov.criteria_name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold border ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  <strong>判定理由：</strong>
                  {cov.reason}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 border border-slate-200 px-2.5 py-1.5">
                  <strong>補強ヒント：</strong>
                  {cov.hint}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 設問別 仮計画書カードリスト */}
      <section data-guide-id="guide-draft-cards" className="space-y-4">
        {answers.map((ans) => {
          const currentText = draftEdits[ans.answer_id] ?? ans.draft_text;
          const charLen = currentText.length;
          const isOverMax = ans.max_chars > 0 && charLen > ans.max_chars;
          const isBelowRecommended =
            charLen > 0 && charLen < ans.recommended_chars * 0.6;
          const isDirty = currentText !== ans.draft_text;
          const isEvidenceOpen = openEvidenceIds.includes(ans.answer_id);
          const linkedCriteria = criteria.filter((c) =>
            ans.linked_criteria_ids.includes(c.criteria_id)
          );

          return (
            <div
              key={ans.answer_id}
              className={`bg-white border p-5 space-y-3.5 ${
                ans.answer_status === 'insufficient'
                  ? 'border-rose-300'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-white">
                      Q{ans.sort_order}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {ans.section_name}
                    </span>
                    {linkedCriteria.map((c) => (
                      <span
                        key={c.criteria_id}
                        className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200"
                      >
                        審査: {c.criteria_name}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {ans.question_title}
                  </h4>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {ans.answer_status === 'answered' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      回答あり
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                      <AlertCircle className="w-3 h-3" />
                      不足（顧客確認待ち）
                    </span>
                  )}

                  {ans.is_manual_edited && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      <Edit3 className="w-3 h-3" />
                      手修正済
                    </span>
                  )}
                </div>
              </div>

              {/* 不足理由ガイド */}
              {ans.answer_status === 'insufficient' && (
                <div className="bg-rose-50 border border-rose-300 px-3.5 py-2.5 text-xs text-rose-950 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        AIが推測生成を行わなかった不足理由：
                      </span>
                      <span>{ans.missing_reason}</span>
                    </div>
                  </div>
                  <div className="pl-6 flex items-center justify-between flex-wrap gap-2 text-[11px] text-rose-800">
                    <span>
                      ※ この不足設問はタブ①「不足質問＆書類回収リスト」へ自動連動しています。直接ここに回答を記入して保存すると「回答あり」へ昇格します。
                    </span>
                    <button
                      type="button"
                      onClick={onGoToProgressTab}
                      className="inline-flex items-center gap-1 font-bold underline cursor-pointer"
                    >
                      <span>タブ1で依頼文を作る</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Textarea */}
              <div>
                <textarea
                  rows={5}
                  value={currentText}
                  onChange={(e) =>
                    setDraftEdits((prev) => ({
                      ...prev,
                      [ans.answer_id]: e.target.value,
                    }))
                  }
                  placeholder="ここに事業計画書の文章を入力または修正できます..."
                  className={`w-full border p-3 text-xs leading-relaxed focus:outline-none ${
                    isOverMax
                      ? 'border-rose-500 bg-rose-50/30 focus:border-rose-700'
                      : 'border-slate-300 bg-white focus:border-blue-700'
                  }`}
                />

                {/* Character Counter & Save/Copy Bar */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`font-bold ${
                        isOverMax
                          ? 'text-rose-700'
                          : isBelowRecommended
                            ? 'text-amber-700'
                            : 'text-slate-700'
                      }`}
                    >
                      現在 {charLen}文字
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600">
                      推奨 {ans.recommended_chars}文字
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600">
                      {ans.max_chars > 0 ? `上限 ${ans.max_chars}文字` : '上限なし'}
                    </span>

                    {isOverMax && (
                      <span className="font-sans font-bold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5">
                        上限超過（-{charLen - ans.max_chars}文字削減推奨）
                      </span>
                    )}
                    {!isOverMax && isBelowRecommended && (
                      <span className="font-sans text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                        推奨文字数より短めです
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(ans)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      {copiedId === ans.answer_id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-700">コピー済</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>この設問をコピー</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSaveAnswerDraft(ans.answer_id, currentText);
                        onNotify(
                          `「${ans.question_title}」を保存しました（手修正済として保護されます）。`
                        );
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        isDirty
                          ? 'bg-blue-700 hover:bg-blue-800 text-white'
                          : 'bg-slate-900 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>この設問を保存</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 根拠照合アコーディオン */}
              <div className="border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => toggleEvidence(ans.answer_id)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-700 cursor-pointer"
                >
                  {isEvidenceOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <FileSearch className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    回答根拠・議事録引用を表示（{ans.evidences.length}件）
                  </span>
                </button>

                {isEvidenceOpen && (
                  <div className="mt-2 space-y-1.5">
                    {ans.evidences.length === 0 ? (
                      <div className="text-[11px] text-slate-500 pl-5">
                        紐づく議事録根拠はありません。
                      </div>
                    ) : (
                      ans.evidences.map((ev, eIdx) => (
                        <div
                          key={`${ev.minute_id}-${eIdx}`}
                          className="bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-700"
                        >
                          <div className="font-bold text-slate-900">
                            【{ev.recorded_date} {ev.source_label}】
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            「{ev.quote}」
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
