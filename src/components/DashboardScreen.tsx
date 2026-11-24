import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Clock,
  FolderOpen,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { calcDaysUntilDue, calcElapsedDays } from '../data/initialData';
import {
  MProcessStatus,
  MSubsidy,
  TClientRequest,
  TProject,
  WaitingForType,
} from '../types';
import { SpecTagBadge } from './SpecTagBadge';

interface DashboardScreenProps {
  projects: TProject[];
  subsidies: MSubsidy[];
  processStatuses: MProcessStatus[];
  clientRequests: TClientRequest[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: (input: {
    clientName: string;
    subsidyId: string;
    picName: string;
    processStatusId: string;
    applicationDeadline: string;
  }) => void;
  onNotify: (msg: string) => void;
}

type SortKey =
  | 'stagnation_desc'
  | 'stagnation_asc'
  | 'next_due_asc'
  | 'next_due_desc'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'updated_desc';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  projects,
  subsidies,
  processStatuses,
  clientRequests,
  onOpenProject,
  onCreateProject,
  onNotify,
}) => {
  const [onlyActive, setOnlyActive] = useState(true);
  const [filterPic, setFilterPic] = useState<string>('all');
  const [filterSubsidy, setFilterSubsidy] = useState<string>('all');
  const [filterWaiting, setFilterWaiting] = useState<'all' | WaitingForType>('all');
  const [filterStatusId, setFilterStatusId] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('stagnation_desc');

  // 新規案件登録モーダル
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const activeSubsidies = useMemo(
    () => subsidies.filter((s) => s.status === 'active'),
    [subsidies]
  );
  const activeStatuses = useMemo(
    () =>
      [...processStatuses]
        .filter((s) => s.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [processStatuses]
  );

  const [newClientName, setNewClientName] = useState('');
  const [newSubsidyId, setNewSubsidyId] = useState(
    activeSubsidies[0]?.subsidy_id || ''
  );
  const [newPicName, setNewPicName] = useState('田中 健太');
  const [newStatusId, setNewStatusId] = useState(
    activeStatuses[0]?.status_id || 'status-1'
  );
  const [newDeadline, setNewDeadline] = useState(
    activeSubsidies[0]?.default_deadline || ''
  );

  const openAddModal = () => {
    const defaultSub = activeSubsidies[0] || subsidies[0];
    setNewClientName('');
    setNewSubsidyId(defaultSub?.subsidy_id || '');
    setNewPicName('田中 健太');
    setNewStatusId(activeStatuses[0]?.status_id || processStatuses[0]?.status_id || '');
    setNewDeadline(defaultSub?.default_deadline || '');
    setIsAddModalOpen(true);
  };

  const handleSubsidyChangeInModal = (subId: string) => {
    setNewSubsidyId(subId);
    const sub = subsidies.find((s) => s.subsidy_id === subId);
    if (sub) {
      setNewDeadline(sub.default_deadline);
    }
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      onNotify('お客様企業名を入力してください。');
      return;
    }
    if (!newSubsidyId) {
      onNotify('適用する補助金・公募回を選択してください。');
      return;
    }
    onCreateProject({
      clientName: newClientName.trim(),
      subsidyId: newSubsidyId,
      picName: newPicName.trim() || '未割当',
      processStatusId: newStatusId,
      applicationDeadline: newDeadline,
    });
    setIsAddModalOpen(false);
    onNotify(`新規案件「${newClientName.trim()}」を登録し、テンプレート設問・書類を初期化しました。`);
  };

  const statusMap = useMemo(() => {
    const map = new Map<string, MProcessStatus>();
    processStatuses.forEach((s) => map.set(s.status_id, s));
    return map;
  }, [processStatuses]);

  const picOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.pic_name) set.add(p.pic_name);
    });
    return Array.from(set);
  }, [projects]);

  // サマリー集計
  const summaryStats = useMemo(() => {
    let activeCount = 0;
    let clientWaitingCount = 0;
    let overdueOrUrgentCount = 0;
    let pendingRequestsCount = 0;

    projects.forEach((p) => {
      const st = statusMap.get(p.process_status_id);
      const isCompleted = Boolean(st?.is_completed_state);
      if (!isCompleted) {
        activeCount += 1;
        if (p.waiting_for === 'client') clientWaitingCount += 1;
        const nextDueDays = calcDaysUntilDue(p.next_action_due);
        const appDueDays = calcDaysUntilDue(p.application_deadline);
        if (nextDueDays <= 3 || appDueDays <= 3) overdueOrUrgentCount += 1;
      }
    });

    pendingRequestsCount = clientRequests.filter(
      (r) => r.status !== 'received'
    ).length;

    return {
      activeCount,
      clientWaitingCount,
      overdueOrUrgentCount,
      pendingRequestsCount,
    };
  }, [projects, statusMap, clientRequests]);

  // 絞り込み＆ソート
  const filteredAndSorted = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const filtered = projects.filter((p) => {
      const st = statusMap.get(p.process_status_id);
      if (onlyActive && st?.is_completed_state) return false;
      if (filterPic !== 'all' && p.pic_name !== filterPic) return false;
      if (filterSubsidy !== 'all' && p.subsidy_id !== filterSubsidy) return false;
      if (filterWaiting !== 'all' && p.waiting_for !== filterWaiting) return false;
      if (filterStatusId !== 'all' && p.process_status_id !== filterStatusId) return false;
      if (q) {
        const hit =
          p.client_name.toLowerCase().includes(q) ||
          p.next_action.toLowerCase().includes(q) ||
          p.subsidy_label_cache.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const stagA = calcElapsedDays(a.last_activity_at);
      const stagB = calcElapsedDays(b.last_activity_at);

      switch (sortKey) {
        case 'stagnation_desc':
          return stagB - stagA;
        case 'stagnation_asc':
          return stagA - stagB;
        case 'next_due_asc':
          return (a.next_action_due || '9999-12-31').localeCompare(
            b.next_action_due || '9999-12-31'
          );
        case 'next_due_desc':
          return (b.next_action_due || '').localeCompare(a.next_action_due || '');
        case 'deadline_asc':
          return (a.application_deadline || '9999-12-31').localeCompare(
            b.application_deadline || '9999-12-31'
          );
        case 'deadline_desc':
          return (b.application_deadline || '').localeCompare(
            a.application_deadline || ''
          );
        case 'updated_desc':
          return b.last_activity_at.localeCompare(a.last_activity_at);
        default:
          return 0;
      }
    });
  }, [
    projects,
    statusMap,
    onlyActive,
    filterPic,
    filterSubsidy,
    filterWaiting,
    filterStatusId,
    searchText,
    sortKey,
  ]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              工程管理表ダッシュボード
            </h1>
            <SpecTagBadge tag="画面1 / No.3〜4" />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            進行中の補助金申請案件について、現在工程・次アクション期限・何待ち区分・未回収数・停滞日数を一覧監視します。
          </p>
        </div>

        <button
          type="button"
          data-guide-id="guide-dashboard-add"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>新規案件を登録</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">進行中案件</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {summaryStats.activeCount}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">件</span>
            </div>
          </div>
          <Users className="w-5 h-5 text-blue-600" />
        </div>

        <div className="bg-white border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">お客様待ち案件</div>
            <div className="text-xl font-bold font-mono text-amber-800 mt-0.5">
              {summaryStats.clientWaitingCount}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">件</span>
            </div>
          </div>
          <UserCheck className="w-5 h-5 text-amber-600" />
        </div>

        <div className="bg-white border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              期限超過／3日以内
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">
              {summaryStats.overdueOrUrgentCount}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">件</span>
            </div>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        </div>

        <div className="bg-white border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              未回答質問・未回収書類
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {summaryStats.pendingRequestsCount}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">項目</span>
            </div>
          </div>
          <Clock className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div
        data-guide-id="guide-dashboard-filters"
        className="bg-white border border-slate-200 p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 左側: 進行中トグル + 検索 */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="accent-blue-700 w-3.5 h-3.5"
              />
              <span>進行中のみ表示（完了・不採択を除外）</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="企業名・次アクション検索..."
                className="pl-8 pr-3 py-1.5 w-60 text-xs bg-white border border-slate-300 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* 右側: ソート */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">並び順:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-slate-50 border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="stagnation_desc">停滞日数（長い順）</option>
              <option value="stagnation_asc">停滞日数（短い順）</option>
              <option value="next_due_asc">次アクション期限（近い順）</option>
              <option value="next_due_desc">次アクション期限（遠い順）</option>
              <option value="deadline_asc">申請締切日（近い順）</option>
              <option value="deadline_desc">申請締切日（遠い順）</option>
              <option value="updated_desc">最終更新日時（新しい順）</option>
            </select>
          </div>
        </div>

        {/* 2段目: 属性セレクトフィルタ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">担当者</label>
            <select
              value={filterPic}
              onChange={(e) => setFilterPic(e.target.value)}
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="all">すべての担当者</option>
              {picOptions.map((pic) => (
                <option key={pic} value={pic}>
                  {pic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              補助金・公募回
            </label>
            <select
              value={filterSubsidy}
              onChange={(e) => setFilterSubsidy(e.target.value)}
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="all">すべての補助金・公募回</option>
              {subsidies.map((s) => (
                <option key={s.subsidy_id} value={s.subsidy_id}>
                  {s.subsidy_name} {s.round_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">何待ち区分</label>
            <select
              value={filterWaiting}
              onChange={(e) =>
                setFilterWaiting(e.target.value as 'all' | WaitingForType)
              }
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="all">すべて</option>
              <option value="client">お客様待ち</option>
              <option value="internal">社内待ち</option>
              <option value="none">なし</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              工程ステータス
            </label>
            <select
              value={filterStatusId}
              onChange={(e) => setFilterStatusId(e.target.value)}
              className="w-full bg-white border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
            >
              <option value="all">すべての工程</option>
              {[...processStatuses]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((st) => (
                  <option key={st.status_id} value={st.status_id}>
                    {st.status_name}
                    {!st.is_active ? '（無効）' : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Dashboard Table */}
      <div
        data-guide-id="guide-dashboard-table"
        className="bg-white border border-slate-200 overflow-hidden"
      >
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            案件一覧（表示：{filteredAndSorted.length} 件 ／ 全 {projects.length} 件）
          </span>
          <span className="text-[11px] text-slate-500">
            赤背景＝期限超過 ／ 黄バッジ＝期限3日以内
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2.5 px-4 font-bold">お客様企業名 / 補助金・公募回</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">現在の工程</th>
                <th className="py-2.5 px-3 font-bold">次アクション / 期限 / 担当</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">何待ち区分</th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                  未回答・未回収
                </th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap text-right">
                  停滞日数
                </th>
                <th className="py-2.5 px-3 font-bold whitespace-nowrap">申請締切日</th>
                <th className="py-2.5 px-4 font-bold text-right whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    条件に一致する案件がありません。絞り込み条件を変更するか「新規案件を登録」してください。
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((project) => {
                  const st = statusMap.get(project.process_status_id);
                  const isCompleted = Boolean(st?.is_completed_state);
                  const nextDueDays = calcDaysUntilDue(project.next_action_due);
                  const appDueDays = calcDaysUntilDue(project.application_deadline);

                  const isOverdue =
                    !isCompleted && (nextDueDays < 0 || appDueDays < 0);
                  const isUrgent =
                    !isCompleted &&
                    !isOverdue &&
                    ((nextDueDays >= 0 && nextDueDays <= 3) ||
                      (appDueDays >= 0 && appDueDays <= 3));

                  const stagnationDays = calcElapsedDays(project.last_activity_at);

                  const projReqs = clientRequests.filter(
                    (r) => r.project_id === project.project_id
                  );
                  const pendingQuestions = projReqs.filter(
                    (r) => r.request_type === 'question' && r.status !== 'received'
                  ).length;
                  const pendingDocs = projReqs.filter(
                    (r) => r.request_type === 'document' && r.status !== 'received'
                  ).length;

                  return (
                    <tr
                      key={project.project_id}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-rose-50/70 hover:bg-rose-100/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. 企業名 / 補助金 */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            {project.client_name}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white">
                              期限超過
                            </span>
                          )}
                          {isUrgent && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              期限間近
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {project.subsidy_label_cache}
                          <span className="mx-1.5 text-slate-300">|</span>
                          主担当: {project.pic_name}
                        </div>
                      </td>

                      {/* 2. 現在の工程 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-slate-900 text-white border-slate-900'
                          }`}
                        >
                          {st ? st.status_name : '不明ステータス'}
                        </span>
                      </td>

                      {/* 3. 次アクション */}
                      <td className="py-3 px-3 min-w-[230px]">
                        <div className="font-medium text-slate-900 leading-snug">
                          {project.next_action || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono ${
                              !isCompleted && nextDueDays < 0
                                ? 'text-rose-700 font-bold'
                                : !isCompleted && nextDueDays <= 3
                                  ? 'text-amber-800 font-bold'
                                  : 'text-slate-600'
                            }`}
                          >
                            期限: {project.next_action_due || '未設定'}
                          </span>
                          <span>／ 担当: {project.next_action_owner || '未割当'}</span>
                        </div>
                      </td>

                      {/* 4. 何待ち区分 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {project.waiting_for === 'client' && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-400">
                            お客様待ち
                          </span>
                        )}
                        {project.waiting_for === 'internal' && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300">
                            社内待ち
                          </span>
                        )}
                        {project.waiting_for === 'none' && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                            なし
                          </span>
                        )}
                      </td>

                      {/* 5. 未回答・未回収 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono border w-fit ${
                              pendingQuestions > 0
                                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            未回答質問 {pendingQuestions}件
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono border w-fit ${
                              pendingDocs > 0
                                ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            未回収書類 {pendingDocs}件
                          </span>
                        </div>
                      </td>

                      {/* 6. 停滞日数 */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            stagnationDays >= 5
                              ? 'text-rose-700'
                              : stagnationDays >= 3
                                ? 'text-amber-700'
                                : 'text-slate-700'
                          }`}
                        >
                          {stagnationDays}日
                        </span>
                      </td>

                      {/* 7. 申請締切日 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">
                          {project.application_deadline || '未設定'}
                        </div>
                        {!isCompleted && appDueDays <= 3 && appDueDays >= 0 && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            あと{appDueDays}日
                          </span>
                        )}
                      </td>

                      {/* 8. 操作 */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.project_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>詳細を開く</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規案件登録モーダル */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-slate-300 shadow-2xl">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold">新規案件の登録</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  お客様企業名 <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="例：株式会社テック製作所"
                  className="w-full border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  適用補助金・公募回 <span className="text-rose-600">*</span>
                </label>
                <select
                  value={newSubsidyId}
                  onChange={(e) => handleSubsidyChangeInModal(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-700"
                >
                  {activeSubsidies.map((s) => (
                    <option key={s.subsidy_id} value={s.subsidy_id}>
                      {s.subsidy_name} {s.round_name}（標準締切: {s.default_deadline}）
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  選択した補助金テンプレートの設問リスト・必要書類リスト・審査項目が案件に自動コピーされます。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    社内担当者
                  </label>
                  <input
                    type="text"
                    value={newPicName}
                    onChange={(e) => setNewPicName(e.target.value)}
                    placeholder="例：田中 健太"
                    className="w-full border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    初期工程ステータス
                  </label>
                  <select
                    value={newStatusId}
                    onChange={(e) => setNewStatusId(e.target.value)}
                    className="w-full border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-700"
                  >
                    {activeStatuses.map((st) => (
                      <option key={st.status_id} value={st.status_id}>
                        {st.status_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  申請締切日
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 cursor-pointer"
                >
                  案件を登録して詳細を開く
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
