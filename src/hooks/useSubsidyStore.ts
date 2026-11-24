import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createInitialAppState,
  getRelativeDateYmd,
} from '../data/initialData';
import {
  evaluateCriteriaCoverage,
  extractAllAnswersFromMinutes,
  reExtractInsufficientAnswers,
} from '../services/aiService';
import {
  MinuteInputType,
  MProcessStatus,
  MQuestion,
  MRequiredDoc,
  MReviewCriterion,
  MSubsidy,
  RequestStatus,
  ScreenId,
  SubsidyAppState,
  SystemSettings,
  TClientRequest,
  TMinute,
  TProject,
  TQuestionAnswer,
  WorkspaceTabId,
} from '../types';
import {
  loadFromLocalStorage,
  removeFromLocalStorage,
  saveToLocalStorage,
} from '../utils/storageService';

const STORAGE_KEY = 'subsidy_gas_mock_state_v1';

function getNowIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

function loadInitialState(): SubsidyAppState {
  const fallback = createInitialAppState();
  const loaded = loadFromLocalStorage<SubsidyAppState | null>(STORAGE_KEY, null);
  if (!loaded || !Array.isArray(loaded.projects) || loaded.projects.length === 0) {
    return fallback;
  }
  return {
    ...fallback,
    ...loaded,
    activeScreen: loaded.activeScreen || 'dashboard',
    workspaceTab: loaded.workspaceTab || 'progress',
    selectedProjectId:
      loaded.projects.some((p) => p.project_id === loaded.selectedProjectId)
        ? loaded.selectedProjectId
        : loaded.projects[0].project_id,
  };
}

export function useSubsidyStore() {
  const [state, setState] = useState<SubsidyAppState>(loadInitialState);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, state);
  }, [state]);

  const selectedProject = useMemo(() => {
    return (
      state.projects.find((p) => p.project_id === state.selectedProjectId) ??
      state.projects[0]
    );
  }, [state.projects, state.selectedProjectId]);

  const setActiveScreen = useCallback((activeScreen: ScreenId) => {
    setState((prev) => ({ ...prev, activeScreen }));
  }, []);

  const setWorkspaceTab = useCallback((workspaceTab: WorkspaceTabId) => {
    setState((prev) => ({ ...prev, workspaceTab }));
  }, []);

  const selectProject = useCallback(
    (projectId: string, screen?: ScreenId, tab?: WorkspaceTabId) => {
      setState((prev) => ({
        ...prev,
        selectedProjectId: projectId,
        activeScreen: screen ?? prev.activeScreen,
        workspaceTab: tab ?? prev.workspaceTab,
      }));
    },
    []
  );

  /** 新規案件登録（設問・必要書類・審査カバレッジ初期値も自動生成） */
  const createProject = useCallback(
    (input: {
      clientName: string;
      subsidyId: string;
      picName: string;
      processStatusId: string;
      applicationDeadline: string;
    }): TProject | null => {
      let createdProject: TProject | null = null;
      setState((prev) => {
        const subsidy = prev.subsidies.find((s) => s.subsidy_id === input.subsidyId);
        if (!subsidy) return prev;

        const nowIso = getNowIso();
        const seq = prev.projects.length + 1;
        const newProjectId = `PRJ-2026-${String(seq).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;

        const templateCriteria = prev.reviewCriteria
          .filter((c) => c.subsidy_id === subsidy.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order);

        const templateQuestions = prev.questions
          .filter((q) => q.subsidy_id === subsidy.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order);

        const templateDocs = prev.requiredDocs
          .filter((d) => d.subsidy_id === subsidy.subsidy_id)
          .sort((a, b) => a.sort_order - b.sort_order);

        const newProject: TProject = {
          project_id: newProjectId,
          client_name: input.clientName.trim(),
          subsidy_id: subsidy.subsidy_id,
          subsidy_label_cache: `${subsidy.subsidy_name} ${subsidy.round_name}`.trim(),
          pic_name: input.picName.trim() || '未割当',
          process_status_id: input.processStatusId,
          next_action: '初回ヒアリング実施・議事録登録',
          next_action_due: getRelativeDateYmd(5),
          next_action_owner: input.picName.trim() || '未割当',
          application_deadline: input.applicationDeadline || subsidy.default_deadline,
          waiting_for: 'internal',
          criteria_coverage: templateCriteria.map((c) => ({
            criteria_id: c.criteria_id,
            criteria_name: c.criteria_name,
            criteria_type: c.criteria_type,
            level: 'missing',
            reason: 'まだ議事録からのAI抽出が実行されていません。',
            hint: 'タブ②「議事録・AI実行」で議事録を登録し、仮計画書を生成してください。',
            evaluated_at: nowIso,
          })),
          last_activity_at: nowIso,
          created_at: nowIso,
        };

        const newAnswers: TQuestionAnswer[] = templateQuestions.map((q) => ({
          answer_id: `ANS-${newProjectId}-${q.sort_order}`,
          project_id: newProjectId,
          template_question_id: q.question_id,
          sort_order: q.sort_order,
          section_name: q.section_name,
          question_title: q.question_title,
          recommended_chars: q.recommended_chars,
          max_chars: q.max_chars,
          linked_criteria_ids: q.linked_criteria_ids,
          answer_status: 'insufficient',
          draft_text: '',
          is_manual_edited: false,
          evidences: [],
          missing_reason: 'まだ議事録からのAI抽出が実行されていません。',
          updated_at: nowIso,
        }));

        const newRequests: TClientRequest[] = templateDocs.map((d, idx) => ({
          request_id: `REQ-${newProjectId}-D${idx + 1}`,
          project_id: newProjectId,
          request_type: 'document',
          title: d.doc_name,
          detail_note: d.note,
          status: 'unrequested',
        }));

        createdProject = newProject;
        return {
          ...prev,
          projects: [newProject, ...prev.projects],
          questionAnswers: [...prev.questionAnswers, ...newAnswers],
          clientRequests: [...prev.clientRequests, ...newRequests],
          selectedProjectId: newProjectId,
          activeScreen: 'workspace',
          workspaceTab: 'progress',
        };
      });

      return createdProject;
    },
    []
  );

  /** 案件ステータス・進行情報の更新 */
  const updateProjectProgress = useCallback(
    (
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
    ) => {
      const nowIso = getNowIso();
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.project_id === projectId
            ? { ...p, ...patch, last_activity_at: nowIso }
            : p
        ),
      }));
    },
    []
  );

  /** 回収リストの個別ステータス更新 */
  const updateClientRequestStatus = useCallback(
    (requestId: string, status: RequestStatus) => {
      const todayYmd = getRelativeDateYmd(0);
      const nowIso = getNowIso();
      setState((prev) => {
        const target = prev.clientRequests.find((r) => r.request_id === requestId);
        if (!target) return prev;
        return {
          ...prev,
          clientRequests: prev.clientRequests.map((r) =>
            r.request_id === requestId
              ? {
                  ...r,
                  status,
                  requested_at:
                    status === 'requested'
                      ? r.requested_at || todayYmd
                      : r.requested_at,
                  received_at: status === 'received' ? todayYmd : undefined,
                }
              : r
          ),
          projects: prev.projects.map((p) =>
            p.project_id === target.project_id
              ? { ...p, last_activity_at: nowIso }
              : p
          ),
        };
      });
    },
    []
  );

  /** チェック項目を一括で「依頼済（お客様待ち）」に変更＋親案件をclientへ */
  const bulkMarkRequestsAsRequested = useCallback(
    (projectId: string, requestIds: string[]) => {
      if (requestIds.length === 0) return;
      const todayYmd = getRelativeDateYmd(0);
      const nowIso = getNowIso();
      const idSet = new Set(requestIds);
      setState((prev) => ({
        ...prev,
        clientRequests: prev.clientRequests.map((r) =>
          r.project_id === projectId && idSet.has(r.request_id)
            ? {
                ...r,
                status: 'requested',
                requested_at: r.requested_at || todayYmd,
                received_at: undefined,
              }
            : r
        ),
        projects: prev.projects.map((p) =>
          p.project_id === projectId
            ? {
                ...p,
                waiting_for: 'client',
                last_activity_at: nowIso,
              }
            : p
        ),
      }));
    },
    []
  );

  /** 必要書類の手動追加 */
  const addManualDocumentRequest = useCallback(
    (projectId: string, title: string, detailNote: string) => {
      const nowIso = getNowIso();
      const newReq: TClientRequest = {
        request_id: `REQ-${projectId}-DM-${Date.now()}`,
        project_id: projectId,
        request_type: 'document',
        title: title.trim(),
        detail_note: detailNote.trim(),
        status: 'unrequested',
      };
      setState((prev) => ({
        ...prev,
        clientRequests: [...prev.clientRequests, newReq],
        projects: prev.projects.map((p) =>
          p.project_id === projectId
            ? { ...p, last_activity_at: nowIso }
            : p
        ),
      }));
    },
    []
  );

  /** 回収リスト行の削除 */
  const deleteClientRequest = useCallback((requestId: string) => {
    const nowIso = getNowIso();
    setState((prev) => {
      const target = prev.clientRequests.find((r) => r.request_id === requestId);
      if (!target) return prev;
      return {
        ...prev,
        clientRequests: prev.clientRequests.filter((r) => r.request_id !== requestId),
        projects: prev.projects.map((p) =>
          p.project_id === target.project_id
            ? { ...p, last_activity_at: nowIso }
            : p
        ),
      };
    });
  }, []);

  /** 議事録の追加 */
  const addMinute = useCallback(
    (
      projectId: string,
      input: {
        recorded_date: string;
        source_title: string;
        input_type: MinuteInputType;
        file_name?: string;
        gdoc_url?: string;
        content_text: string;
      }
    ) => {
      const nowIso = getNowIso();
      const newMinute: TMinute = {
        minute_id: `MIN-${Date.now()}`,
        project_id: projectId,
        recorded_date: input.recorded_date,
        source_title: input.source_title.trim() || 'ヒアリング議事録',
        input_type: input.input_type,
        file_name: input.file_name,
        gdoc_url: input.gdoc_url,
        content_text: input.content_text.trim(),
        created_at: nowIso,
      };
      setState((prev) => ({
        ...prev,
        minutes: [...prev.minutes, newMinute],
        projects: prev.projects.map((p) =>
          p.project_id === projectId
            ? { ...p, last_activity_at: nowIso }
            : p
        ),
      }));
    },
    []
  );

  /** 議事録の削除 */
  const deleteMinute = useCallback((minuteId: string) => {
    const nowIso = getNowIso();
    setState((prev) => {
      const target = prev.minutes.find((m) => m.minute_id === minuteId);
      if (!target) return prev;
      return {
        ...prev,
        minutes: prev.minutes.filter((m) => m.minute_id !== minuteId),
        projects: prev.projects.map((p) =>
          p.project_id === target.project_id
            ? { ...p, last_activity_at: nowIso }
            : p
        ),
      };
    });
  }, []);

  /** 全議事録からの回答抽出＆不足質問の顧客回収リスト自動同期 */
  const runExtractAllAnswers = useCallback(
    async (projectId: string, protectManualEdits: boolean) => {
      const project = state.projects.find((p) => p.project_id === projectId);
      if (!project) {
        return { answeredCount: 0, insufficientCount: 0, skippedManualCount: 0 };
      }

      const projectQuestions = state.questions.filter(
        (q) => q.subsidy_id === project.subsidy_id
      );
      const projectMinutes = state.minutes.filter(
        (m) => m.project_id === projectId
      );
      const existingAnswers = state.questionAnswers.filter(
        (a) => a.project_id === projectId
      );
      const projectCriteria = state.reviewCriteria.filter(
        (c) => c.subsidy_id === project.subsidy_id
      );

      const res = await extractAllAnswersFromMinutes({
        project,
        questions: projectQuestions,
        minutes: projectMinutes,
        existingAnswers,
        protectManualEdits,
      });

      const coverage = await evaluateCriteriaCoverage({
        criteria: projectCriteria,
        answers: res.answers,
      });

      const todayYmd = getRelativeDateYmd(0);
      const nowIso = getNowIso();

      setState((prev) => {
        const otherAnswers = prev.questionAnswers.filter(
          (a) => a.project_id !== projectId
        );

        // 既存書類リスト等は保持しつつ、question行のみ同期
        const currentProjectRequests = prev.clientRequests.filter(
          (r) => r.project_id === projectId
        );
        const otherProjectRequests = prev.clientRequests.filter(
          (r) => r.project_id !== projectId
        );

        const docAndUnlinkedRequests = currentProjectRequests.filter(
          (r) => r.request_type !== 'question' || !r.linked_answer_id
        );
        const existingQuestionReqs = currentProjectRequests.filter(
          (r) => r.request_type === 'question' && r.linked_answer_id
        );

        const syncedQuestionReqs: TClientRequest[] = [];
        res.answers.forEach((ans) => {
          const existingReq = existingQuestionReqs.find(
            (r) => r.linked_answer_id === ans.answer_id
          );
          if (ans.answer_status === 'insufficient') {
            if (existingReq) {
              syncedQuestionReqs.push({
                ...existingReq,
                title: `【Q${ans.sort_order}確認】${ans.question_title.replace(/^\d+\.\s*/, '')}`,
                detail_note: ans.missing_reason || '追加情報をご確認願います。',
                status: existingReq.status === 'received' ? 'unrequested' : existingReq.status,
                received_at: existingReq.status === 'received' ? undefined : existingReq.received_at,
              });
            } else {
              syncedQuestionReqs.push({
                request_id: `REQ-${projectId}-Q${ans.sort_order}-${Date.now().toString().slice(-4)}`,
                project_id: projectId,
                request_type: 'question',
                linked_answer_id: ans.answer_id,
                title: `【Q${ans.sort_order}確認】${ans.question_title.replace(/^\d+\.\s*/, '')}`,
                detail_note: ans.missing_reason || '追加情報をご確認願います。',
                status: 'unrequested',
              });
            }
          } else if (existingReq) {
            syncedQuestionReqs.push({
              ...existingReq,
              status: 'received',
              received_at: existingReq.received_at || todayYmd,
            });
          }
        });

        return {
          ...prev,
          questionAnswers: [...otherAnswers, ...res.answers],
          clientRequests: [
            ...otherProjectRequests,
            ...syncedQuestionReqs,
            ...docAndUnlinkedRequests,
          ],
          projects: prev.projects.map((p) =>
            p.project_id === projectId
              ? {
                  ...p,
                  criteria_coverage: coverage,
                  last_activity_at: nowIso,
                }
              : p
          ),
        };
      });

      return {
        answeredCount: res.answeredCount,
        insufficientCount: res.insufficientCount,
        skippedManualCount: res.skippedManualCount,
      };
    },
    [state.projects, state.questions, state.minutes, state.questionAnswers, state.reviewCriteria]
  );

  /** 不足だった設問のみを再抽出・追記生成 */
  const runReExtractInsufficient = useCallback(
    async (projectId: string) => {
      const project = state.projects.find((p) => p.project_id === projectId);
      if (!project) {
        return {
          newlyAnsweredCount: 0,
          stillInsufficientCount: 0,
          keptInsufficientByNoInfo: true,
        };
      }

      const projectQuestions = state.questions.filter(
        (q) => q.subsidy_id === project.subsidy_id
      );
      const projectMinutes = state.minutes.filter(
        (m) => m.project_id === projectId
      );
      const existingAnswers = state.questionAnswers.filter(
        (a) => a.project_id === projectId
      );
      const projectCriteria = state.reviewCriteria.filter(
        (c) => c.subsidy_id === project.subsidy_id
      );

      const res = await reExtractInsufficientAnswers({
        project,
        questions: projectQuestions,
        minutes: projectMinutes,
        existingAnswers,
      });

      const coverage = await evaluateCriteriaCoverage({
        criteria: projectCriteria,
        answers: res.answers,
      });

      const todayYmd = getRelativeDateYmd(0);
      const nowIso = getNowIso();
      const newlyAnsweredSet = new Set(res.newlyAnsweredIds);

      setState((prev) => {
        const otherAnswers = prev.questionAnswers.filter(
          (a) => a.project_id !== projectId
        );
        return {
          ...prev,
          questionAnswers: [...otherAnswers, ...res.answers],
          clientRequests: prev.clientRequests.map((r) =>
            r.project_id === projectId &&
            r.linked_answer_id &&
            newlyAnsweredSet.has(r.linked_answer_id)
              ? {
                  ...r,
                  status: 'received',
                  received_at: r.received_at || todayYmd,
                }
              : r
          ),
          projects: prev.projects.map((p) =>
            p.project_id === projectId
              ? {
                  ...p,
                  criteria_coverage: coverage,
                  last_activity_at: nowIso,
                }
              : p
          ),
        };
      });

      return {
        newlyAnsweredCount: res.newlyAnsweredIds.length,
        stillInsufficientCount: res.stillInsufficientCount,
        keptInsufficientByNoInfo: res.keptInsufficientByNoInfo,
      };
    },
    [state.projects, state.questions, state.minutes, state.questionAnswers, state.reviewCriteria]
  );

  /** 仮事業計画書の設問を直接編集して保存 */
  const saveQuestionAnswerDraft = useCallback(
    (answerId: string, draftText: string) => {
      const nowIso = getNowIso();
      const todayYmd = getRelativeDateYmd(0);
      const trimmed = draftText.trim();

      setState((prev) => {
        const target = prev.questionAnswers.find((a) => a.answer_id === answerId);
        if (!target) return prev;
        const nextStatus = trimmed.length > 0 ? 'answered' : 'insufficient';

        return {
          ...prev,
          questionAnswers: prev.questionAnswers.map((a) =>
            a.answer_id === answerId
              ? {
                  ...a,
                  draft_text: draftText,
                  is_manual_edited: true,
                  answer_status: nextStatus,
                  missing_reason:
                    nextStatus === 'answered'
                      ? ''
                      : a.missing_reason || '未入力のため不足となっています。',
                  updated_at: nowIso,
                }
              : a
          ),
          clientRequests:
            nextStatus === 'answered'
              ? prev.clientRequests.map((r) =>
                  r.linked_answer_id === answerId
                    ? {
                        ...r,
                        status: 'received',
                        received_at: r.received_at || todayYmd,
                      }
                    : r
                )
              : prev.clientRequests,
          projects: prev.projects.map((p) =>
            p.project_id === target.project_id
              ? { ...p, last_activity_at: nowIso }
              : p
          ),
        };
      });
    },
    []
  );

  /** 審査項目・加点項目の3段階カバー状況を再判定 */
  const runEvaluateCriteriaCoverage = useCallback(
    async (projectId: string) => {
      const project = state.projects.find((p) => p.project_id === projectId);
      if (!project) return [];

      const projectCriteria = state.reviewCriteria.filter(
        (c) => c.subsidy_id === project.subsidy_id
      );
      const projectAnswers = state.questionAnswers.filter(
        (a) => a.project_id === projectId
      );

      const coverage = await evaluateCriteriaCoverage({
        criteria: projectCriteria,
        answers: projectAnswers,
      });

      const nowIso = getNowIso();
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.project_id === projectId
            ? { ...p, criteria_coverage: coverage, last_activity_at: nowIso }
            : p
        ),
      }));

      return coverage;
    },
    [state.projects, state.reviewCriteria, state.questionAnswers]
  );

  /** 画面5：補助金・公募回テンプレートの確定保存 */
  const saveSubsidyTemplate = useCallback(
    (payload: {
      subsidy: MSubsidy;
      criteria: MReviewCriterion[];
      questions: MQuestion[];
      requiredDocs: MRequiredDoc[];
    }) => {
      const nowIso = getNowIso();
      const targetId = payload.subsidy.subsidy_id;
      const savedSubsidy: MSubsidy = {
        ...payload.subsidy,
        updated_at: nowIso,
      };
      const labelCache = `${savedSubsidy.subsidy_name} ${savedSubsidy.round_name}`.trim();

      setState((prev) => {
        const exists = prev.subsidies.some((s) => s.subsidy_id === targetId);
        const nextSubsidies = exists
          ? prev.subsidies.map((s) => (s.subsidy_id === targetId ? savedSubsidy : s))
          : [savedSubsidy, ...prev.subsidies];

        return {
          ...prev,
          subsidies: nextSubsidies,
          reviewCriteria: [
            ...prev.reviewCriteria.filter((c) => c.subsidy_id !== targetId),
            ...payload.criteria,
          ],
          questions: [
            ...prev.questions.filter((q) => q.subsidy_id !== targetId),
            ...payload.questions,
          ],
          requiredDocs: [
            ...prev.requiredDocs.filter((d) => d.subsidy_id !== targetId),
            ...payload.requiredDocs,
          ],
          projects: prev.projects.map((p) =>
            p.subsidy_id === targetId
              ? { ...p, subsidy_label_cache: labelCache }
              : p
          ),
        };
      });
    },
    []
  );

  /** 画面5：補助金テンプレートの有効/アーカイブ切替 */
  const toggleSubsidyStatus = useCallback((subsidyId: string) => {
    const nowIso = getNowIso();
    setState((prev) => ({
      ...prev,
      subsidies: prev.subsidies.map((s) =>
        s.subsidy_id === subsidyId
          ? {
              ...s,
              status: s.status === 'active' ? 'archived' : 'active',
              updated_at: nowIso,
            }
          : s
      ),
    }));
  }, []);

  /** 画面6：工程ステータスマスタ保存 */
  const saveProcessStatuses = useCallback((statuses: MProcessStatus[]) => {
    const normalized = statuses.map((s, idx) => ({
      ...s,
      sort_order: idx + 1,
    }));
    setState((prev) => ({
      ...prev,
      processStatuses: normalized,
    }));
  }, []);

  /** 画面6：システム設定（Geminiモデル・APIキーモック）保存 */
  const updateSystemSettings = useCallback((patch: Partial<SystemSettings>) => {
    setState((prev) => ({
      ...prev,
      systemSettings: {
        ...prev.systemSettings,
        ...patch,
      },
    }));
  }, []);

  /** 初期データリセット */
  const resetAllData = useCallback(() => {
    removeFromLocalStorage(STORAGE_KEY);
    setState(createInitialAppState());
  }, []);

  return {
    state,
    selectedProject,
    setActiveScreen,
    setWorkspaceTab,
    selectProject,
    createProject,
    updateProjectProgress,
    updateClientRequestStatus,
    bulkMarkRequestsAsRequested,
    addManualDocumentRequest,
    deleteClientRequest,
    addMinute,
    deleteMinute,
    runExtractAllAnswers,
    runReExtractInsufficient,
    saveQuestionAnswerDraft,
    runEvaluateCriteriaCoverage,
    saveSubsidyTemplate,
    toggleSubsidyStatus,
    saveProcessStatuses,
    updateSystemSettings,
    resetAllData,
  };
}
