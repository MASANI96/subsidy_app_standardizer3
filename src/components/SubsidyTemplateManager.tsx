import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getRelativeDateYmd,
  getRelativeIsoDateTime,
  SAMPLE_GUIDELINE_BREAKDOWN,
} from '../data/initialData';
import { decomposeGuidelineAndForms } from '../services/aiService';
import {
  CriteriaType,
  MQuestion,
  MRequiredDoc,
  MReviewCriterion,
  MSubsidy,
  SubsidyStatus,
} from '../types';
import { SpecTagBadge } from './SpecTagBadge';

interface SubsidyTemplateManagerProps {
  subsidies: MSubsidy[];
  questions: MQuestion[];
  reviewCriteria: MReviewCriterion[];
  requiredDocs: MRequiredDoc[];
  geminiModelHeavy: string;
  onSaveTemplate: (payload: {
    subsidy: MSubsidy;
    criteria: MReviewCriterion[];
    questions: MQuestion[];
    requiredDocs: MRequiredDoc[];
  }) => void;
  onToggleStatus: (subsidyId: string) => void;
  onNotify: (msg: string) => void;
}

type EditorSubTab = 'questions' | 'criteria' | 'docs';

export const SubsidyTemplateManager: React.FC<SubsidyTemplateManagerProps> = ({
  subsidies,
  questions,
  reviewCriteria,
  requiredDocs,
  geminiModelHeavy,
  onSaveTemplate,
  onToggleStatus,
  onNotify,
}) => {
  // AIウィザード用ステート
  const [guidelineFileName, setGuidelineFileName] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  // 編集対象テンプレート用ローカルステート
  const initialSub = subsidies[0];
  const [editingSubsidyId, setEditingSubsidyId] = useState<string>(
    initialSub?.subsidy_id || `sub-${Date.now()}`
  );
  const [isNewMode, setIsNewMode] = useState<boolean>(!initialSub);
  const [subsidyName, setSubsidyName] = useState(initialSub?.subsidy_name || '');
  const [roundName, setRoundName] = useState(initialSub?.round_name || '');
  const [defaultDeadline, setDefaultDeadline] = useState(
    initialSub?.default_deadline || getRelativeDateYmd(40)
  );
  const [status, setStatus] = useState<SubsidyStatus>(
    initialSub?.status || 'active'
  );
  const [createdAt, setCreatedAt] = useState(
    initialSub?.created_at || getRelativeIsoDateTime(0)
  );

  const [draftCriteria, setDraftCriteria] = useState<MReviewCriterion[]>(() =>
    initialSub
      ? reviewCriteria
          .filter((c) => c.subsidy_id === initialSub.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order)
      : []
  );
  const [draftQuestions, setDraftQuestions] = useState<MQuestion[]>(() =>
    initialSub
      ? questions
          .filter((q) => q.subsidy_id === initialSub.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order)
      : []
  );
  const [draftDocs, setDraftDocs] = useState<MRequiredDoc[]>(() =>
    initialSub
      ? requiredDocs
          .filter((d) => d.subsidy_id === initialSub.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order)
      : []
  );

  const [editorSubTab, setEditorSubTab] = useState<EditorSubTab>('questions');

  const loadTemplateIntoEditor = (sub: MSubsidy) => {
    setIsNewMode(false);
    setEditingSubsidyId(sub.subsidy_id);
    setSubsidyName(sub.subsidy_name);
    setRoundName(sub.round_name);
    setDefaultDeadline(sub.default_deadline);
    setStatus(sub.status);
    setCreatedAt(sub.created_at);
    setDraftCriteria(
      reviewCriteria
        .filter((c) => c.subsidy_id === sub.subsidy_id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({ ...c }))
    );
    setDraftQuestions(
      questions
        .filter((q) => q.subsidy_id === sub.subsidy_id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((q) => ({ ...q, linked_criteria_ids: [...q.linked_criteria_ids] }))
    );
    setDraftDocs(
      requiredDocs
        .filter((d) => d.subsidy_id === sub.subsidy_id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((d) => ({ ...d }))
    );
    onNotify(`「${sub.subsidy_name} ${sub.round_name}」を編集エリアに読み込みました。`);
  };

  const startNewTemplate = () => {
    const newId = `sub-custom-${Date.now()}`;
    setIsNewMode(true);
    setEditingSubsidyId(newId);
    setSubsidyName('');
    setRoundName('');
    setDefaultDeadline(getRelativeDateYmd(40));
    setStatus('active');
    setCreatedAt(new Date().toISOString());
    setDraftCriteria([]);
    setDraftQuestions([]);
    setDraftDocs([]);
    onNotify('新規テンプレート作成モードに切り替えました。公募要領AI分解または手動入力を行ってください。');
  };

  const handleSetSampleFiles = () => {
    setGuidelineFileName(SAMPLE_GUIDELINE_BREAKDOWN.guidelineFileName);
    setFormFileName(SAMPLE_GUIDELINE_BREAKDOWN.formFileName);
    onNotify('サンプルの公募要領PDF・申請書様式ファイルをセットしました。');
  };

  const handleRunAiDecompose = async () => {
    if (!guidelineFileName && !formFileName) {
      onNotify('公募要領PDFまたは申請書フォーマットを選択するか「サンプルをセット」を押してください。');
      return;
    }

    setIsDecomposing(true);
    setProgressPct(15);
    const timer = window.setInterval(() => {
      setProgressPct((prev) => Math.min(90, prev + 18));
    }, 220);

    try {
      const result = await decomposeGuidelineAndForms({
        guidelineFileName: guidelineFileName || '公募要領.pdf',
        formFileName: formFileName || '申請書様式.xlsx',
        model: geminiModelHeavy,
      });

      const targetSubId = `sub-ai-${Date.now()}`;
      setIsNewMode(true);
      setEditingSubsidyId(targetSubId);
      setSubsidyName(result.subsidyName);
      setRoundName(result.roundName);
      setDefaultDeadline(getRelativeDateYmd(result.defaultDeadlineDays));
      setStatus('active');
      setCreatedAt(new Date().toISOString());

      const idMap = new Map<string, string>();
      const mappedCriteria: MReviewCriterion[] = result.criteria.map((c, idx) => {
        const uniqueCid = `CRT-${targetSubId.slice(-5)}-${idx + 1}`;
        idMap.set(c.criteria_id, uniqueCid);
        return {
          ...c,
          criteria_id: uniqueCid,
          subsidy_id: targetSubId,
        };
      });

      const mappedQuestions: MQuestion[] = result.questions.map((q, idx) => ({
        ...q,
        question_id: `Q-${targetSubId.slice(-5)}-${idx + 1}`,
        subsidy_id: targetSubId,
        linked_criteria_ids: q.linked_criteria_ids
          .map((oldId) => idMap.get(oldId) || oldId)
          .filter(Boolean),
      }));

      const mappedDocs: MRequiredDoc[] = result.requiredDocs.map((d, idx) => ({
        ...d,
        doc_template_id: `D-${targetSubId.slice(-5)}-${idx + 1}`,
        subsidy_id: targetSubId,
      }));

      setDraftCriteria(mappedCriteria);
      setDraftQuestions(mappedQuestions);
      setDraftDocs(mappedDocs);
      setProgressPct(100);
      setEditorSubTab('questions');
      onNotify(
        `AI自動分解完了（${geminiModelHeavy}）：審査項目 ${mappedCriteria.length}件・設問 ${mappedQuestions.length}問・必要書類 ${mappedDocs.length}件を下書き展開しました。内容を確認し「テンプレートを確定保存」を押してください。`
      );
    } finally {
      window.clearInterval(timer);
      setIsDecomposing(false);
    }
  };

  // 設問操作
  const moveQuestion = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= draftQuestions.length) return;
    const copy = [...draftQuestions];
    const [removed] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, removed);
    setDraftQuestions(copy.map((q, i) => ({ ...q, sort_order: i + 1 })));
  };

  const addQuestionRow = () => {
    const nextOrder = draftQuestions.length + 1;
    setDraftQuestions((prev) => [
      ...prev,
      {
        question_id: `Q-${Date.now()}-${nextOrder}`,
        subsidy_id: editingSubsidyId,
        sort_order: nextOrder,
        section_name: '新規章',
        question_title: `${nextOrder}. 新規設問タイトル`,
        question_guide: '',
        recommended_chars: 400,
        max_chars: 600,
        linked_criteria_ids: draftCriteria[0] ? [draftCriteria[0].criteria_id] : [],
      },
    ]);
  };

  const toggleLinkedCriterion = (qId: string, cId: string) => {
    setDraftQuestions((prev) =>
      prev.map((q) => {
        if (q.question_id !== qId) return q;
        const exists = q.linked_criteria_ids.includes(cId);
        return {
          ...q,
          linked_criteria_ids: exists
            ? q.linked_criteria_ids.filter((id) => id !== cId)
            : [...q.linked_criteria_ids, cId],
        };
      })
    );
  };

  // 審査項目操作
  const addCriterionRow = () => {
    const nextOrder = draftCriteria.length + 1;
    setDraftCriteria((prev) => [
      ...prev,
      {
        criteria_id: `CRT-${Date.now()}-${nextOrder}`,
        subsidy_id: editingSubsidyId,
        sort_order: nextOrder,
        criteria_type: 'review',
        criteria_name: '新規審査観点',
        description: '',
      },
    ]);
  };

  const removeCriterionRow = (cId: string) => {
    setDraftCriteria((prev) =>
      prev
        .filter((c) => c.criteria_id !== cId)
        .map((c, i) => ({ ...c, sort_order: i + 1 }))
    );
    setDraftQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        linked_criteria_ids: q.linked_criteria_ids.filter((id) => id !== cId),
      }))
    );
  };

  // 必要書類操作
  const addDocRow = () => {
    const nextOrder = draftDocs.length + 1;
    setDraftDocs((prev) => [
      ...prev,
      {
        doc_template_id: `DOC-${Date.now()}-${nextOrder}`,
        subsidy_id: editingSubsidyId,
        sort_order: nextOrder,
        doc_name: '新規必要書類',
        note: '',
      },
    ]);
  };

  // 確定保存
  const handleConfirmSave = () => {
    if (!subsidyName.trim() || !roundName.trim()) {
      onNotify('補助金名および公募回名は必須です。');
      return;
    }
    if (draftQuestions.length === 0) {
      onNotify('設問リストを1問以上登録してください。');
      return;
    }

    const validCriteriaIds = new Set(draftCriteria.map((c) => c.criteria_id));
    const cleanedQuestions = draftQuestions.map((q, idx) => ({
      ...q,
      subsidy_id: editingSubsidyId,
      sort_order: idx + 1,
      linked_criteria_ids: q.linked_criteria_ids.filter((cid) =>
        validCriteriaIds.has(cid)
      ),
    }));
    const cleanedCriteria = draftCriteria.map((c, idx) => ({
      ...c,
      subsidy_id: editingSubsidyId,
      sort_order: idx + 1,
    }));
    const cleanedDocs = draftDocs.map((d, idx) => ({
      ...d,
      subsidy_id: editingSubsidyId,
      sort_order: idx + 1,
    }));

    const subsidyPayload: MSubsidy = {
      subsidy_id: editingSubsidyId,
      subsidy_name: subsidyName.trim(),
      round_name: roundName.trim(),
      default_deadline: defaultDeadline || getRelativeDateYmd(30),
      status,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    };

    onSaveTemplate({
      subsidy: subsidyPayload,
      criteria: cleanedCriteria,
      questions: cleanedQuestions,
      requiredDocs: cleanedDocs,
    });
    setIsNewMode(false);
    onNotify(
      `テンプレート「${subsidyPayload.subsidy_name} ${subsidyPayload.round_name}」を確定保存しました。工程管理表の「新規案件を登録」からすぐ利用できます。`
    );
  };

  const countMap = useMemo(() => {
    const map = new Map<string, { q: number; c: number; d: number }>();
    subsidies.forEach((s) => {
      map.set(s.subsidy_id, {
        q: questions.filter((q) => q.subsidy_id === s.subsidy_id).length,
        c: reviewCriteria.filter((c) => c.subsidy_id === s.subsidy_id).length,
        d: requiredDocs.filter((d) => d.subsidy_id === s.subsidy_id).length,
      });
    });
    return map;
  }, [subsidies, questions, reviewCriteria, requiredDocs]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              補助金・公募回＆設問テンプレート管理
            </h1>
            <SpecTagBadge tag="画面5 / No.1〜2" />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            公募要領PDFと申請書様式からAIが設問・審査基準・必要書類を自動抽出し、確認・調整のうえテンプレートとして確定登録します。
          </p>
        </div>

        <button
          type="button"
          onClick={startNewTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>新規テンプレートを手動/AI作成</span>
        </button>
      </div>

      {/* 1. 補助金・公募回リスト */}
      <section
        data-guide-id="guide-templates-list"
        className="bg-white border border-slate-200 overflow-hidden"
      >
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
          1. 登録済み補助金・公募回一覧（{subsidies.length}件）
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2.5 px-4 font-bold">補助金名 / 公募回名</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">標準締切日</th>
                <th className="py-2.5 px-3 font-bold text-center">設問数</th>
                <th className="py-2.5 px-3 font-bold text-center">審査・加点</th>
                <th className="py-2.5 px-3 font-bold text-center">必要書類</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">ステータス</th>
                <th className="py-2.5 px-4 font-bold text-right whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subsidies.map((sub) => {
                const counts = countMap.get(sub.subsidy_id) || { q: 0, c: 0, d: 0 };
                const isEditingThis =
                  !isNewMode && editingSubsidyId === sub.subsidy_id;
                return (
                  <tr
                    key={sub.subsidy_id}
                    className={isEditingThis ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-900">
                        {sub.subsidy_name}
                      </span>
                      <span className="ml-2 px-2 py-0.5 text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {sub.round_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {sub.default_deadline}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">
                      {counts.q}問
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">
                      {counts.c}件
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">
                      {counts.d}件
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {sub.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          有効
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                          アーカイブ
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => loadTemplateIntoEditor(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white hover:bg-blue-700 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>編集する</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onToggleStatus(sub.subsidy_id);
                          onNotify(
                            `「${sub.subsidy_name} ${sub.round_name}」のステータスを切り替えました。`
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Archive className="w-3 h-3" />
                        <span>
                          {sub.status === 'active' ? 'アーカイブ化' : '有効に戻す'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. AI自動分解ウィザード */}
      <section
        data-guide-id="guide-templates-ai"
        className="bg-blue-50/50 border border-blue-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              2. 公募要領・申請様式 AI自動分解ウィザード
            </h2>
            <span className="text-[11px] font-mono bg-white border border-blue-200 px-2 py-0.5 text-blue-900">
              高精度モデル: {geminiModelHeavy}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSetSampleFiles}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-blue-300 text-blue-900 hover:bg-blue-100 cursor-pointer"
          >
            サンプル公募要領・様式をセット
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="bg-white border border-dashed border-slate-300 p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-900">公募要領 PDF</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {guidelineFileName || 'クリックしてPDFファイルを選択...'}
                </div>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setGuidelineFileName(f.name);
              }}
            />
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 font-semibold text-slate-700 shrink-0">
              選択
            </span>
          </label>

          <label className="bg-white border border-dashed border-slate-300 p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-900">
                  申請書フォーマット（Word / Excel / PDF）
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {formFileName || 'クリックして様式ファイルを選択...'}
                </div>
              </div>
            </div>
            <input
              type="file"
              accept=".docx,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFormFileName(f.name);
              }}
            />
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 font-semibold text-slate-700 shrink-0">
              選択
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={isDecomposing}
            onClick={handleRunAiDecompose}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
          >
            {isDecomposing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>AIで設問・審査項目・必要書類を自動分解する</span>
          </button>

          {isDecomposing && (
            <div className="flex-1 min-w-[200px] space-y-1">
              <div className="flex justify-between text-[11px] text-blue-900 font-semibold">
                <span>公募要領・様式を解析中...</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. 分解結果の確認・手動編集・確定エリア */}
      <section
        data-guide-id="guide-templates-editor"
        className="bg-white border border-slate-200 p-5 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              3. テンプレート確認・手動編集・確定保存
              {isNewMode && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  未保存ドラフト（新規）
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              AI分解結果または既存テンプレートの内容を調整し、「テンプレートを確定保存」で反映します。
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>テンプレートを確定保存</span>
          </button>
        </div>

        {/* 基本情報欄 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 p-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              補助金名 <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={subsidyName}
              onChange={(e) => setSubsidyName(e.target.value)}
              placeholder="例：ものづくり補助金"
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              公募回名 <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="例：第20次公募"
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              デフォルト締切日
            </label>
            <input
              type="date"
              value={defaultDeadline}
              onChange={(e) => setDefaultDeadline(e.target.value)}
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-blue-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ステータス
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubsidyStatus)}
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-700"
            >
              <option value="active">有効（新規案件で選択可）</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>
        </div>

        {/* 3サブタブ切替 */}
        <div className="border-b border-slate-300 flex items-center gap-1">
          {[
            {
              id: 'questions' as EditorSubTab,
              label: `設問リスト（${draftQuestions.length}問）`,
            },
            {
              id: 'criteria' as EditorSubTab,
              label: `審査項目・加点項目（${draftCriteria.length}件）`,
            },
            {
              id: 'docs' as EditorSubTab,
              label: `必要書類リスト（${draftDocs.length}件）`,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditorSubTab(t.id)}
              className={`px-4 py-2 text-xs font-bold border-t border-x cursor-pointer ${
                editorSubTab === t.id
                  ? 'bg-white border-slate-300 text-blue-800 -mb-px pb-[9px]'
                  : 'bg-slate-100 border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* サブタブ①：設問リスト */}
        {editorSubTab === 'questions' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">
                上限文字数を「0」にすると上限なしとして扱われます。
              </span>
              <button
                type="button"
                onClick={addQuestionRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white font-bold hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>設問を追加</span>
              </button>
            </div>

            <div className="space-y-3">
              {draftQuestions.map((q, idx) => (
                <div
                  key={q.question_id}
                  className="border border-slate-200 bg-slate-50/60 p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      設問 #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveQuestion(idx, -1)}
                        className="p-1 bg-white border border-slate-300 disabled:opacity-30 cursor-pointer"
                        title="上へ移動"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draftQuestions.length - 1}
                        onClick={() => moveQuestion(idx, 1)}
                        className="p-1 bg-white border border-slate-300 disabled:opacity-30 cursor-pointer"
                        title="下へ移動"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftQuestions((prev) =>
                            prev
                              .filter((item) => item.question_id !== q.question_id)
                              .map((item, i) => ({ ...item, sort_order: i + 1 }))
                          )
                        }
                        className="p-1 bg-white border border-slate-300 text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        章名
                      </label>
                      <input
                        type="text"
                        value={q.section_name}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item) =>
                              item.question_id === q.question_id
                                ? { ...item, section_name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full bg-white border border-slate-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        設問見出し
                      </label>
                      <input
                        type="text"
                        value={q.question_title}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item) =>
                              item.question_id === q.question_id
                                ? { ...item, question_title: e.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full bg-white border border-slate-300 px-2 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        推奨文字数
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={q.recommended_chars}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item) =>
                              item.question_id === q.question_id
                                ? {
                                    ...item,
                                    recommended_chars: Number(e.target.value) || 0,
                                  }
                                : item
                            )
                          )
                        }
                        className="w-full bg-white border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        上限文字数（0=なし）
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={q.max_chars}
                        onChange={(e) =>
                          setDraftQuestions((prev) =>
                            prev.map((item) =>
                              item.question_id === q.question_id
                                ? {
                                    ...item,
                                    max_chars: Number(e.target.value) || 0,
                                  }
                                : item
                            )
                          )
                        }
                        className="w-full bg-white border border-slate-300 px-2 py-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">
                      設問の補足説明・記載ガイド
                    </label>
                    <input
                      type="text"
                      value={q.question_guide}
                      onChange={(e) =>
                        setDraftQuestions((prev) =>
                          prev.map((item) =>
                            item.question_id === q.question_id
                              ? { ...item, question_guide: e.target.value }
                              : item
                          )
                        )
                      }
                      className="w-full bg-white border border-slate-300 px-2 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-700 mb-1">
                      紐付け審査項目・加点項目（複数選択可）
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draftCriteria.length === 0 ? (
                        <span className="text-[11px] text-slate-400">
                          ※ サブタブ「審査項目・加点項目」に項目を登録するとここで紐付けできます
                        </span>
                      ) : (
                        draftCriteria.map((c) => {
                          const checked = q.linked_criteria_ids.includes(
                            c.criteria_id
                          );
                          return (
                            <label
                              key={c.criteria_id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[11px] cursor-pointer ${
                                checked
                                  ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                                  : 'bg-white border-slate-300 text-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleLinkedCriterion(
                                    q.question_id,
                                    c.criteria_id
                                  )
                                }
                                className="accent-blue-700"
                              />
                              <span>
                                [{c.criteria_type === 'bonus' ? '加点' : '審査'}]{' '}
                                {c.criteria_name}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* サブタブ②：審査項目・加点項目 */}
        {editorSubTab === 'criteria' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addCriterionRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white font-bold hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>審査・加点項目を追加</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="py-2 px-3 w-32">区分</th>
                    <th className="py-2 px-3 w-64">項目名</th>
                    <th className="py-2 px-3">評価観点説明</th>
                    <th className="py-2 px-3 w-14 text-center">削除</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {draftCriteria.map((c) => (
                    <tr key={c.criteria_id}>
                      <td className="py-2 px-3">
                        <select
                          value={c.criteria_type}
                          onChange={(e) =>
                            setDraftCriteria((prev) =>
                              prev.map((item) =>
                                item.criteria_id === c.criteria_id
                                  ? {
                                      ...item,
                                      criteria_type: e.target.value as CriteriaType,
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full border border-slate-300 px-2 py-1 bg-white text-xs font-semibold"
                        >
                          <option value="review">通常審査</option>
                          <option value="bonus">加点</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.criteria_name}
                          onChange={(e) =>
                            setDraftCriteria((prev) =>
                              prev.map((item) =>
                                item.criteria_id === c.criteria_id
                                  ? { ...item, criteria_name: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full border border-slate-300 px-2 py-1 text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={c.description}
                          onChange={(e) =>
                            setDraftCriteria((prev) =>
                              prev.map((item) =>
                                item.criteria_id === c.criteria_id
                                  ? { ...item, description: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeCriterionRow(c.criteria_id)}
                          className="p-1 text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* サブタブ③：必要書類リスト */}
        {editorSubTab === 'docs' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addDocRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white font-bold hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>必要書類を追加</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="py-2 px-3 w-80">書類名</th>
                    <th className="py-2 px-3">備考・取得案内</th>
                    <th className="py-2 px-3 w-14 text-center">削除</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {draftDocs.map((d) => (
                    <tr key={d.doc_template_id}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={d.doc_name}
                          onChange={(e) =>
                            setDraftDocs((prev) =>
                              prev.map((item) =>
                                item.doc_template_id === d.doc_template_id
                                  ? { ...item, doc_name: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full border border-slate-300 px-2 py-1 text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={d.note}
                          onChange={(e) =>
                            setDraftDocs((prev) =>
                              prev.map((item) =>
                                item.doc_template_id === d.doc_template_id
                                  ? { ...item, note: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftDocs((prev) =>
                              prev
                                .filter(
                                  (item) =>
                                    item.doc_template_id !== d.doc_template_id
                                )
                                .map((item, i) => ({ ...item, sort_order: i + 1 }))
                            )
                          }
                          className="p-1 text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            保存後、新規案件作成時にこの設問・書類テンプレートが自動で展開されます。
          </span>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>テンプレートを確定保存</span>
          </button>
        </div>
      </section>
    </div>
  );
};
