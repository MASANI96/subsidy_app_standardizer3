import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckSquare,
  Copy,
  FilePlus2,
  Mail,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { getRelativeDateYmd } from '../../data/initialData';
import {
  MProcessStatus,
  RequestStatus,
  TClientRequest,
  TProject,
  WaitingForType,
} from '../../types';
import { SpecTagBadge } from '../SpecTagBadge';

interface ProgressRequestsTabProps {
  project: TProject;
  processStatuses: MProcessStatus[];
  requests: TClientRequest[];
  onUpdateProgress: (
    patch: Partial<
      Pick<
        TProject,
        | 'process_status_id'
        | 'next_action'
        | 'next_action_due'
        | 'next_action_owner'
        | 'application_deadline'
        | 'waiting_for'
        | 'pic_name'
      >
    >
  ) => void;
  onUpdateRequestStatus: (requestId: string, status: RequestStatus) => void;
  onBulkMarkRequested: (requestIds: string[]) => void;
  onAddManualDoc: (title: string, detailNote: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onNotify: (msg: string) => void;
}

export const ProgressRequestsTab: React.FC<ProgressRequestsTabProps> = ({
  project,
  processStatuses,
  requests,
  onUpdateProgress,
  onUpdateRequestStatus,
  onBulkMarkRequested,
  onAddManualDoc,
  onDeleteRequest,
  onNotify,
}) => {
  // 案件ステータス編集フォーム用ローカルステート
  const [statusId, setStatusId] = useState(project.process_status_id);
  const [picName, setPicName] = useState(project.pic_name);
  const [nextAction, setNextAction] = useState(project.next_action);
  const [nextActionDue, setNextActionDue] = useState(project.next_action_due);
  const [nextActionOwner, setNextActionOwner] = useState(project.next_action_owner);
  const [appDeadline, setAppDeadline] = useState(project.application_deadline);
  const [waitingFor, setWaitingFor] = useState<WaitingForType>(project.waiting_for);

  useEffect(() => {
    setStatusId(project.process_status_id);
    setPicName(project.pic_name);
    setNextAction(project.next_action);
    setNextActionDue(project.next_action_due);
    setNextActionOwner(project.next_action_owner);
    setAppDeadline(project.application_deadline);
    setWaitingFor(project.waiting_for);
  }, [project]);

  // 必要書類手動追加フォーム
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocNote, setNewDocNote] = useState('');

  // 依頼文生成パネル
  const incompleteRequests = useMemo(
    () => requests.filter((r) => r.status !== 'received'),
    [requests]
  );

  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(() =>
    requests.filter((r) => r.status === 'unrequested').map((r) => r.request_id)
  );
  const [replyDueDate, setReplyDueDate] = useState(
    project.next_action_due || getRelativeDateYmd(5)
  );
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [copiedFlag, setCopiedFlag] = useState(false);

  // 案件切替や新規unrequested項目発生時にチェックリストを同期
  useEffect(() => {
    setSelectedReqIds(
      requests.filter((r) => r.status === 'unrequested').map((r) => r.request_id)
    );
    setReplyDueDate(project.next_action_due || getRelativeDateYmd(5));
    setGeneratedMessage('');
  }, [project.project_id]);

  // 依頼済（回答待ち）項目があるのに waiting_for !== 'client' の推奨アラート
  const hasRequestedWaitingItem = requests.some((r) => r.status === 'requested');
  const showClientWaitingHint =
    hasRequestedWaitingItem && project.waiting_for !== 'client';

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProgress({
      process_status_id: statusId,
      pic_name: picName.trim() || '未割当',
      next_action: nextAction.trim(),
      next_action_due: nextActionDue,
      next_action_owner: nextActionOwner.trim() || '未割当',
      application_deadline: appDeadline,
      waiting_for: waitingFor,
    });
    onNotify('案件ステータス・進行情報を保存しました（最終更新日時を更新）。');
  };

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      onNotify('追加する必要書類名を入力してください。');
      return;
    }
    onAddManualDoc(newDocTitle.trim(), newDocNote.trim());
    setNewDocTitle('');
    setNewDocNote('');
    onNotify(`必要書類「${newDocTitle.trim()}」を追加しました。`);
  };

  const toggleCheck = (id: string) => {
    setSelectedReqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectUnrequested = () => {
    setSelectedReqIds(
      requests.filter((r) => r.status === 'unrequested').map((r) => r.request_id)
    );
  };

  const handleSelectAllIncomplete = () => {
    setSelectedReqIds(incompleteRequests.map((r) => r.request_id));
  };

  const handleGenerateRequestMessage = () => {
    const targets = requests.filter((r) => selectedReqIds.includes(r.request_id));
    if (targets.length === 0) {
      onNotify('依頼文に含める項目を1件以上チェックしてください。');
      return;
    }

    const questions = targets.filter((r) => r.request_type === 'question');
    const docs = targets.filter((r) => r.request_type === 'document');

    const lines: string[] = [
      `${project.client_name} 御中`,
      '',
      `いつも大変お世話になっております。${project.pic_name}でございます。`,
      `${project.subsidy_label_cache}の事業計画書作成・申請準備にあたり、下記についてご確認およびご提出をお願い申し上げます。`,
      '',
    ];

    if (questions.length > 0) {
      lines.push('【1. 追加ご確認事項（事業計画書 記載内容）】');
      questions.forEach((q, idx) => {
        lines.push(`(${idx + 1}) ${q.title}`);
        if (q.detail_note) {
          lines.push(`    詳細：${q.detail_note}`);
        }
      });
      lines.push('');
    }

    if (docs.length > 0) {
      lines.push(`【${questions.length > 0 ? '2' : '1'}. ご提出をお願いしたい必要書類】`);
      docs.forEach((d, idx) => {
        lines.push(`(${idx + 1}) ${d.title}`);
        if (d.detail_note) {
          lines.push(`    備考：${d.detail_note}`);
        }
      });
      lines.push('');
    }

    if (replyDueDate) {
      lines.push(`■ ご回答・ご提出期限：${replyDueDate} まで`);
      lines.push('');
    }

    lines.push(
      'お忙しいところ恐れ入りますが、メール返信または共有フォルダへのアップロードにてご対応いただけますと幸いです。',
      'ご不明点がございましたらお気軽にご連絡ください。引き続きよろしくお願いいたします。'
    );

    setGeneratedMessage(lines.join('\n'));
    onNotify(`選択した${targets.length}項目をもとに顧客送付用の依頼文面を生成しました。`);
  };

  const handleCopyMessage = async () => {
    if (!generatedMessage) return;
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2000);
      onNotify('依頼文面をクリップボードにコピーしました。');
    } catch {
      onNotify('コピーに失敗しました。テキストエリアから手動でコピーしてください。');
    }
  };

  const handleBulkMarkAsRequested = () => {
    if (selectedReqIds.length === 0) {
      onNotify('「依頼済」へ変更する項目にチェックを入れてください。');
      return;
    }
    onBulkMarkRequested(selectedReqIds);
    setWaitingFor('client');
    onNotify(
      `${selectedReqIds.length}件を「依頼済（お客様待ち）」へ更新し、案件の何待ち区分を「お客様待ち」に変更しました。`
    );
  };

  const sortedStatuses = useMemo(
    () => [...processStatuses].sort((a, b) => a.sort_order - b.sort_order),
    [processStatuses]
  );

  // 未依頼・依頼済を上に、回収済を下に並べる
  const sortedRequests = useMemo(() => {
    const orderRank: Record<RequestStatus, number> = {
      unrequested: 0,
      requested: 1,
      received: 2,
    };
    return [...requests].sort((a, b) => {
      const rankDiff = orderRank[a.status] - orderRank[b.status];
      if (rankDiff !== 0) return rankDiff;
      if (a.request_type !== b.request_type) {
        return a.request_type === 'question' ? -1 : 1;
      }
      return 0;
    });
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* 1. 案件ステータス管理フォーム */}
      <section
        data-guide-id="guide-progress-form"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              1. 案件ステータス・次アクション管理
            </h2>
            <SpecTagBadge tag="画面2 / No.5〜6" />
          </div>
          <span className="text-[11px] text-slate-500">
            保存すると最終更新日時が更新され、工程管理表の停滞日数が0日にリセットされます
          </span>
        </div>

        {showClientWaitingHint && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                下のリストに<strong>「依頼済（回答待ち）」</strong>
                の項目が存在するため、何待ち区分を<strong>「お客様待ち」</strong>
                に設定することを推奨します。
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setWaitingFor('client');
                onUpdateProgress({ waiting_for: 'client' });
                onNotify('何待ち区分を「お客様待ち」に更新しました。');
              }}
              className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] cursor-pointer shrink-0"
            >
              「お客様待ち」に設定する
            </button>
          </div>
        )}

        <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                現在の工程
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 bg-white text-xs font-semibold focus:outline-none focus:border-blue-700"
              >
                {sortedStatuses.map((st) => {
                  const isCurrent = st.status_id === project.process_status_id;
                  if (!st.is_active && !isCurrent) return null;
                  return (
                    <option key={st.status_id} value={st.status_id}>
                      {st.status_name}
                      {!st.is_active ? '（無効・現在値）' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                何待ち区分
              </label>
              <select
                value={waitingFor}
                onChange={(e) => setWaitingFor(e.target.value as WaitingForType)}
                className="w-full border border-slate-300 px-2.5 py-2 bg-white text-xs font-semibold focus:outline-none focus:border-blue-700"
              >
                <option value="client">お客様待ち</option>
                <option value="internal">社内待ち</option>
                <option value="none">なし</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                主担当
              </label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                申請締切日
              </label>
              <input
                type="date"
                value={appDeadline}
                onChange={(e) => setAppDeadline(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <label className="block font-bold text-slate-700 mb-1">
                次アクション
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="次に取るべき具体的アクションを入力..."
                className="w-full border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                次アクション期限
              </label>
              <input
                type="date"
                value={nextActionDue}
                onChange={(e) => setNextActionDue(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                次アクション担当者
              </label>
              <input
                type="text"
                value={nextActionOwner}
                onChange={(e) => setNextActionOwner(e.target.value)}
                className="w-full border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ステータスを保存</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. 不足質問＆書類回収 統合テーブル */}
      <section
        data-guide-id="guide-progress-requests"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              2. 不足質問＆必要書類 回収リスト（全 {requests.length}件 / 未完了{' '}
              {incompleteRequests.length}件）
            </h2>
            <SpecTagBadge tag="画面2 / No.12〜13" />
          </div>
          <span className="text-[11px] text-slate-500">
            タブ②でAI抽出した「不足」設問が自動で [不足質問] 行として同期されます
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2 px-3 w-10 text-center">選択</th>
                <th className="py-2 px-3 w-24 whitespace-nowrap">種別</th>
                <th className="py-2 px-3">項目名 / 補足メモ</th>
                <th className="py-2 px-3 w-48 whitespace-nowrap">回収ステータス</th>
                <th className="py-2 px-3 w-28 whitespace-nowrap">履歴日付</th>
                <th className="py-2 px-3 w-14 text-center">削除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    依頼・回収項目がありません。必要書類を追加するかタブ②でAI抽出を実行してください。
                  </td>
                </tr>
              ) : (
                sortedRequests.map((req) => {
                  const isReceived = req.status === 'received';
                  const isChecked = selectedReqIds.includes(req.request_id);

                  return (
                    <tr
                      key={req.request_id}
                      className={isReceived ? 'bg-slate-50/60 text-slate-500' : 'bg-white'}
                    >
                      <td className="py-2.5 px-3 text-center">
                        {!isReceived && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(req.request_id)}
                            aria-label={`${req.title} を依頼文対象に選択`}
                            className="accent-blue-700 w-3.5 h-3.5 cursor-pointer"
                          />
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {req.request_type === 'question' ? (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                            不足質問
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                            必要書類
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div
                          className={`font-bold ${
                            isReceived
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {req.title}
                        </div>
                        {req.detail_note && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {req.detail_note}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={req.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as RequestStatus;
                            onUpdateRequestStatus(req.request_id, nextStatus);
                            onNotify(`「${req.title}」のステータスを更新しました。`);
                          }}
                          className={`w-full border px-2 py-1 text-xs font-semibold focus:outline-none ${
                            req.status === 'received'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : req.status === 'requested'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-white text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="unrequested">未依頼</option>
                          <option value="requested">依頼済（お客様待ち）</option>
                          <option value="received">回収・回答済</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap text-slate-500">
                        {req.received_at
                          ? `済: ${req.received_at}`
                          : req.requested_at
                            ? `依: ${req.requested_at}`
                            : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteRequest(req.request_id);
                            onNotify(`「${req.title}」を削除しました。`);
                          }}
                          title="行を削除"
                          className="p-1 text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 必要書類を手動追加 */}
        <form
          onSubmit={handleAddDoc}
          className="bg-slate-50 border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end text-xs"
        >
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              必要書類を追加（書類名）
            </label>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="例：登記簿謄本（履歴事項全部証明書）"
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              補足メモ（任意）
            </label>
            <input
              type="text"
              value={newDocNote}
              onChange={(e) => setNewDocNote(e.target.value)}
              placeholder="例：発行から3か月以内のPDFをご準備ください"
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-700"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-700" />
              <span>書類を追加</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3. お客様送付用 依頼文面自動生成パネル */}
      <section
        data-guide-id="guide-progress-generator"
        className="bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              3. お客様送付用 依頼文面の自動生成・一括ステータス更新
            </h2>
            <SpecTagBadge tag="画面2 / No.14" />
          </div>
          <span className="text-xs font-mono text-slate-600">
            チェック選択中: <strong>{selectedReqIds.length}</strong> 件
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSelectUnrequested}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
              <span>「未依頼」のみ選択</span>
            </button>
            <button
              type="button"
              onClick={handleSelectAllIncomplete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
            >
              <span>未完了すべて選択（催促含む）</span>
            </button>

            <div className="flex items-center gap-1.5">
              <label htmlFor="reply-due-date" className="font-bold text-slate-700">
                回答希望期限:
              </label>
              <input
                id="reply-due-date"
                type="date"
                value={replyDueDate}
                onChange={(e) => setReplyDueDate(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateRequestMessage}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 cursor-pointer transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>依頼文面を生成</span>
            </button>
            <button
              type="button"
              onClick={handleBulkMarkAsRequested}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-400 hover:bg-amber-200 cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-amber-800" />
              <span>チェックした項目を一括で『依頼済（お客様待ち）』に変更</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              生成された送付文面（編集可能）
            </span>
            <button
              type="button"
              disabled={!generatedMessage}
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              {copiedFlag ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-700">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>文面をコピー</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={11}
            value={generatedMessage}
            onChange={(e) => setGeneratedMessage(e.target.value)}
            placeholder="上の表で対象項目にチェックを入れ、「依頼文面を生成」ボタンを押すとここに顧客送付用の文章が作成されます。"
            className="w-full border border-slate-300 p-3 text-xs font-sans leading-relaxed bg-white focus:outline-none focus:border-blue-700"
          />
        </div>
      </section>
    </div>
  );
};
