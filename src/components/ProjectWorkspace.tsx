import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MessageSquarePlus,
} from 'lucide-react';
import { calcElapsedDays } from '../data/initialData';
import {
  MinuteInputType,
  MProcessStatus,
  MReviewCriterion,
  RequestStatus,
  TClientRequest,
  TMinute,
  TProject,
  TQuestionAnswer,
  WorkspaceTabId,
} from '../types';
import { DraftPlanTab } from './workspace/DraftPlanTab';
import { MinutesAiTab } from './workspace/MinutesAiTab';
import { ProgressRequestsTab } from './workspace/ProgressRequestsTab';

interface ProjectWorkspaceProps {
  project: TProject;
  projects: TProject[];
  processStatuses: MProcessStatus[];
  minutes: TMinute[];
  questionAnswers: TQuestionAnswer[];
  clientRequests: TClientRequest[];
  reviewCriteria: MReviewCriterion[];
  activeTab: WorkspaceTabId;
  geminiModelStandard: string;
  onSelectProject: (projectId: string) => void;
  onChangeTab: (tab: WorkspaceTabId) => void;
  onBackToDashboard: () => void;
  onUpdateProjectProgress: (
    projectId: string,
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
  onBulkMarkRequested: (projectId: string, requestIds: string[]) => void;
  onAddManualDoc: (projectId: string, title: string, detailNote: string) => void;
  onDeleteRequest: (requestId: string) => void;
  onAddMinute: (
    projectId: string,
    input: {
      recorded_date: string;
      source_title: string;
      input_type: MinuteInputType;
      file_name?: string;
      gdoc_url?: string;
      content_text: string;
    }
  ) => void;
  onDeleteMinute: (minuteId: string) => void;
  onRunExtractAll: (
    projectId: string,
    protectManualEdits: boolean
  ) => Promise<{
    answeredCount: number;
    insufficientCount: number;
    skippedManualCount: number;
  }>;
  onRunReExtractInsufficient: (projectId: string) => Promise<{
    newlyAnsweredCount: number;
    stillInsufficientCount: number;
    keptInsufficientByNoInfo: boolean;
  }>;
  onSaveAnswerDraft: (answerId: string, draftText: string) => void;
  onEvaluateCriteria: (projectId: string) => Promise<unknown>;
  onNotify: (msg: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  projects,
  processStatuses,
  minutes,
  questionAnswers,
  clientRequests,
  reviewCriteria,
  activeTab,
  geminiModelStandard,
  onSelectProject,
  onChangeTab,
  onBackToDashboard,
  onUpdateProjectProgress,
  onUpdateRequestStatus,
  onBulkMarkRequested,
  onAddManualDoc,
  onDeleteRequest,
  onAddMinute,
  onDeleteMinute,
  onRunExtractAll,
  onRunReExtractInsufficient,
  onSaveAnswerDraft,
  onEvaluateCriteria,
  onNotify,
}) => {
  const projectMinutes = useMemo(
    () =>
      minutes
        .filter((m) => m.project_id === project.project_id)
        .sort((a, b) => b.recorded_date.localeCompare(a.recorded_date)),
    [minutes, project.project_id]
  );

  const projectAnswers = useMemo(
    () =>
      questionAnswers
        .filter((a) => a.project_id === project.project_id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [questionAnswers, project.project_id]
  );

  const projectRequests = useMemo(
    () => clientRequests.filter((r) => r.project_id === project.project_id),
    [clientRequests, project.project_id]
  );

  const projectCriteria = useMemo(
    () =>
      reviewCriteria
        .filter((c) => c.subsidy_id === project.subsidy_id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [reviewCriteria, project.subsidy_id]
  );

  const currentStatus = processStatuses.find(
    (s) => s.status_id === project.process_status_id
  );
  const stagnationDays = calcElapsedDays(project.last_activity_at);
  const pendingReqCount = projectRequests.filter(
    (r) => r.status !== 'received'
  ).length;
  const answeredCount = projectAnswers.filter(
    (a) => a.answer_status === 'answered'
  ).length;

  const tabs: {
    id: WorkspaceTabId;
    label: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'progress',
      label: '進行管理・不足/書類回収・依頼文',
      badge: `未完了 ${pendingReqCount}件`,
      icon: <ClipboardList className="w-3.5 h-3.5" />,
    },
    {
      id: 'minutes',
      label: '議事録蓄積＆AI抽出・生成',
      badge: `${projectMinutes.length}件`,
      icon: <MessageSquarePlus className="w-3.5 h-3.5" />,
    },
    {
      id: 'draft',
      label: '仮の事業計画書 確認・編集・審査判定',
      badge: `${answeredCount}/${projectAnswers.length}問回答`,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Project Summary Bar */}
      <div
        data-guide-id="guide-workspace-header"
        className="bg-white border border-slate-200 px-5 py-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>工程管理表へ戻る</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                {project.client_name}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200">
                {project.subsidy_label_cache}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="workspace-project-switcher" className="text-slate-500">
              案件切替:
            </label>
            <select
              id="workspace-project-switcher"
              value={project.project_id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-slate-50 border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.client_name}（{p.subsidy_label_cache}）
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white font-semibold">
            <CheckCircle2 className="w-3 h-3 text-blue-300" />
            現在工程: {currentStatus?.status_name || '未設定'}
          </span>

          {project.waiting_for === 'client' && (
            <span className="inline-flex items-center px-2.5 py-0.5 font-bold bg-amber-100 text-amber-950 border border-amber-400">
              何待ち: お客様待ち
            </span>
          )}
          {project.waiting_for === 'internal' && (
            <span className="inline-flex items-center px-2.5 py-0.5 font-bold bg-blue-50 text-blue-900 border border-blue-300">
              何待ち: 社内待ち
            </span>
          )}
          {project.waiting_for === 'none' && (
            <span className="inline-flex items-center px-2.5 py-0.5 font-medium bg-slate-100 text-slate-600 border border-slate-300">
              何待ち: なし
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            停滞日数:{' '}
            <strong
              className={`font-mono ${
                stagnationDays >= 5 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {stagnationDays}日
            </strong>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            申請締切日:{' '}
            <strong className="font-mono text-slate-900">
              {project.application_deadline || '未設定'}
            </strong>
          </span>

          <span className="text-slate-500">主担当: {project.pic_name}</span>
        </div>
      </div>

      {/* 3-Tab Sub-Navigation */}
      <div
        data-guide-id="guide-workspace-tabs"
        className="border-b border-slate-300 flex items-center gap-1 overflow-x-auto"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-t border-x transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white border-slate-300 text-blue-800 -mb-px pb-[11px]'
                  : 'bg-slate-100 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>
                タブ{idx + 1}：{tab.label}
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono border ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'progress' && (
        <ProgressRequestsTab
          project={project}
          processStatuses={processStatuses}
          requests={projectRequests}
          onUpdateProgress={(patch) =>
            onUpdateProjectProgress(project.project_id, patch)
          }
          onUpdateRequestStatus={onUpdateRequestStatus}
          onBulkMarkRequested={(ids) =>
            onBulkMarkRequested(project.project_id, ids)
          }
          onAddManualDoc={(title, note) =>
            onAddManualDoc(project.project_id, title, note)
          }
          onDeleteRequest={onDeleteRequest}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'minutes' && (
        <MinutesAiTab
          project={project}
          minutes={projectMinutes}
          answers={projectAnswers}
          geminiModelStandard={geminiModelStandard}
          onAddMinute={(input) => onAddMinute(project.project_id, input)}
          onDeleteMinute={onDeleteMinute}
          onRunExtractAll={(protectManualEdits) =>
            onRunExtractAll(project.project_id, protectManualEdits)
          }
          onRunReExtractInsufficient={() =>
            onRunReExtractInsufficient(project.project_id)
          }
          onGoToDraftTab={() => onChangeTab('draft')}
          onGoToProgressTab={() => onChangeTab('progress')}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'draft' && (
        <DraftPlanTab
          project={project}
          answers={projectAnswers}
          criteria={projectCriteria}
          onSaveAnswerDraft={onSaveAnswerDraft}
          onEvaluateCriteria={() => onEvaluateCriteria(project.project_id)}
          onGoToProgressTab={() => onChangeTab('progress')}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
