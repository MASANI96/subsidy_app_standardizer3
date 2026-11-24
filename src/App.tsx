import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DashboardScreen } from './components/DashboardScreen';
import { GuidePanel } from './components/GuidePanel';
import { Header } from './components/Header';
import { OverviewSummaryModal } from './components/OverviewSummaryModal';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { SubsidyTemplateManager } from './components/SubsidyTemplateManager';
import { SystemSettingsScreen } from './components/SystemSettingsScreen';
import {
  GUIDE_CHAPTERS,
  GuideChapter,
  GuideStep,
  GuideTarget,
} from './data/guideSteps';
import { useSubsidyStore } from './hooks/useSubsidyStore';
import { ScreenId, WorkspaceTabId } from './types';

const UI_STORAGE_KEY = 'subsidy_gas_mock_ui_v1';

interface UiPersistState {
  guideOpen: boolean;
  currentChapterIndex: number;
  checkedStepIds: string[];
}

function loadUiPersistState(): UiPersistState {
  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawIdx =
        typeof parsed.currentChapterIndex === 'number'
          ? parsed.currentChapterIndex
          : 0;
      const clampedIdx = Math.max(0, Math.min(rawIdx, GUIDE_CHAPTERS.length - 1));
      return {
        guideOpen: typeof parsed.guideOpen === 'boolean' ? parsed.guideOpen : false,
        currentChapterIndex: clampedIdx,
        checkedStepIds: Array.isArray(parsed.checkedStepIds)
          ? parsed.checkedStepIds
          : [],
      };
    }
  } catch {
    // Ignore
  }
  return {
    guideOpen: false,
    currentChapterIndex: 0,
    checkedStepIds: [],
  };
}

export default function App() {
  const {
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
  } = useSubsidyStore();

  const prefersReducedMotion = useReducedMotion();
  const [uiState, setUiState] = useState<UiPersistState>(loadUiPersistState);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [overviewModalMode, setOverviewModalMode] = useState<'overview' | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState));
    } catch {
      // Ignore
    }
  }, [uiState]);

  const showNotice = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const clearExistingHighlights = useCallback(() => {
    document.querySelectorAll('.guide-highlight-active').forEach((el) => {
      el.classList.remove('guide-highlight-active');
    });
  }, []);

  const triggerGuideHighlight = useCallback(
    (guideId?: string) => {
      clearExistingHighlights();
      if (!guideId) return;
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }

      const tryFocus = (attempt: number) => {
        const el = document.querySelector(`[data-guide-id="${guideId}"]`);
        if (el) {
          el.classList.add('guide-highlight-active');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          highlightTimerRef.current = window.setTimeout(() => {
            el.classList.remove('guide-highlight-active');
          }, 4500);
        } else if (attempt < 4) {
          window.setTimeout(() => tryFocus(attempt + 1), 160);
        }
      };

      window.setTimeout(() => tryFocus(0), 160);
    },
    [clearExistingHighlights]
  );

  const handleChangeScreen = useCallback(
    (screen: ScreenId) => {
      setActiveScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setActiveScreen]
  );

  const handleChangeWorkspaceTab = useCallback(
    (tab: WorkspaceTabId) => {
      setWorkspaceTab(tab);
      if (state.activeScreen !== 'workspace') {
        setActiveScreen('workspace');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setWorkspaceTab, setActiveScreen, state.activeScreen]
  );

  const applyGuideTarget = useCallback(
    (target?: GuideTarget, guideId?: string) => {
      if (!target) {
        triggerGuideHighlight(guideId);
        return;
      }

      if (target.openOverviewModal !== undefined) {
        setOverviewModalMode(target.openOverviewModal);
      } else {
        setOverviewModalMode(null);
      }

      if (target.projectId) {
        const exists = state.projects.some(
          (p) => p.project_id === target.projectId
        );
        selectProject(
          exists ? target.projectId : selectedProject.project_id,
          target.screen,
          target.workspaceTab
        );
      } else {
        if (target.screen) {
          setActiveScreen(target.screen);
        }
        if (target.workspaceTab) {
          setWorkspaceTab(target.workspaceTab);
          if (!target.screen) {
            setActiveScreen('workspace');
          }
        }
      }

      triggerGuideHighlight(guideId);
    },
    [
      state.projects,
      selectedProject.project_id,
      selectProject,
      setActiveScreen,
      setWorkspaceTab,
      triggerGuideHighlight,
    ]
  );

  const handleSelectChapter = useCallback(
    (chapterIndex: number, chapter: GuideChapter) => {
      const firstStep = chapter.steps[0];
      setUiState((prev) => ({
        ...prev,
        currentChapterIndex: chapterIndex,
      }));
      setActiveStepId(firstStep?.id ?? null);
      applyGuideTarget(
        firstStep?.target ?? chapter.defaultTarget,
        firstStep?.guideId
      );
    },
    [applyGuideTarget]
  );

  const handleSelectGuideStep = useCallback(
    (chapterIndex: number, step: GuideStep) => {
      setUiState((prev) => ({
        ...prev,
        currentChapterIndex: chapterIndex,
        checkedStepIds: prev.checkedStepIds.includes(step.id)
          ? prev.checkedStepIds
          : [...prev.checkedStepIds, step.id],
      }));
      setActiveStepId(step.id);
      applyGuideTarget(step.target, step.guideId);
    },
    [applyGuideTarget]
  );

  const handleReset = useCallback(() => {
    resetAllData();
    setUiState((prev) => ({
      ...prev,
      currentChapterIndex: 0,
      checkedStepIds: [],
    }));
    setActiveStepId(null);
    setOverviewModalMode(null);
    showNotice('すべてのデータおよび設定を初期プリセット状態へリセットしました。');
  }, [resetAllData, showNotice]);

  const viewKey =
    state.activeScreen === 'workspace'
      ? `workspace-${state.workspaceTab}`
      : state.activeScreen;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header
        activeScreen={state.activeScreen}
        guideOpen={uiState.guideOpen}
        onToggleGuide={() =>
          setUiState((prev) => ({ ...prev, guideOpen: !prev.guideOpen }))
        }
        onChangeScreen={handleChangeScreen}
        onResetAll={handleReset}
      />

      {/* Action Toast Feedback Banner */}
      {toastMessage && (
        <div className="bg-slate-900 text-white border-b border-slate-700 px-6 py-2 shadow-md">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 text-xs font-medium">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-mono px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Guide Sidebar + Active Screen */}
      <div className="flex-1 flex items-start">
        <GuidePanel
          isOpen={uiState.guideOpen}
          currentChapterIndex={uiState.currentChapterIndex}
          activeStepId={activeStepId}
          checkedStepIds={uiState.checkedStepIds}
          onClose={() =>
            setUiState((prev) => ({ ...prev, guideOpen: false }))
          }
          onSelectChapter={handleSelectChapter}
          onSelectStep={handleSelectGuideStep}
          onJumpToTarget={(target, guideId) => applyGuideTarget(target, guideId)}
          onHighlightGuideId={(guideId) => triggerGuideHighlight(guideId)}
          onResetAllData={handleReset}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={viewKey}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.12,
                  ease: 'easeOut',
                }}
              >
                {/* 画面1: 工程管理表ダッシュボード */}
                {state.activeScreen === 'dashboard' && (
                  <DashboardScreen
                    projects={state.projects}
                    subsidies={state.subsidies}
                    processStatuses={state.processStatuses}
                    clientRequests={state.clientRequests}
                    onOpenProject={(projectId) => {
                      selectProject(projectId, 'workspace', 'progress');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onCreateProject={createProject}
                    onNotify={showNotice}
                  />
                )}

                {/* 画面2〜4: 案件詳細ワークスペース */}
                {state.activeScreen === 'workspace' && selectedProject && (
                  <ProjectWorkspace
                    project={selectedProject}
                    projects={state.projects}
                    processStatuses={state.processStatuses}
                    minutes={state.minutes}
                    questionAnswers={state.questionAnswers}
                    clientRequests={state.clientRequests}
                    reviewCriteria={state.reviewCriteria}
                    activeTab={state.workspaceTab}
                    geminiModelStandard={state.systemSettings.geminiModelStandard}
                    onSelectProject={(projectId) => selectProject(projectId)}
                    onChangeTab={handleChangeWorkspaceTab}
                    onBackToDashboard={() => handleChangeScreen('dashboard')}
                    onUpdateProjectProgress={updateProjectProgress}
                    onUpdateRequestStatus={updateClientRequestStatus}
                    onBulkMarkRequested={bulkMarkRequestsAsRequested}
                    onAddManualDoc={addManualDocumentRequest}
                    onDeleteRequest={deleteClientRequest}
                    onAddMinute={addMinute}
                    onDeleteMinute={deleteMinute}
                    onRunExtractAll={runExtractAllAnswers}
                    onRunReExtractInsufficient={runReExtractInsufficient}
                    onSaveAnswerDraft={saveQuestionAnswerDraft}
                    onEvaluateCriteria={runEvaluateCriteriaCoverage}
                    onNotify={showNotice}
                  />
                )}

                {/* 画面5: 補助金・公募回テンプレート管理 */}
                {state.activeScreen === 'templates' && (
                  <SubsidyTemplateManager
                    subsidies={state.subsidies}
                    questions={state.questions}
                    reviewCriteria={state.reviewCriteria}
                    requiredDocs={state.requiredDocs}
                    geminiModelHeavy={state.systemSettings.geminiModelHeavy}
                    onSaveTemplate={saveSubsidyTemplate}
                    onToggleStatus={toggleSubsidyStatus}
                    onNotify={showNotice}
                  />
                )}

                {/* 画面6: システム設定 */}
                {state.activeScreen === 'settings' && (
                  <SystemSettingsScreen
                    processStatuses={state.processStatuses}
                    projects={state.projects}
                    systemSettings={state.systemSettings}
                    onSaveProcessStatuses={saveProcessStatuses}
                    onUpdateSystemSettings={updateSystemSettings}
                    onNotify={showNotice}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-8">
            <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <span>補助金申請支援システム（GAS Webアプリ版 動作検証モック）</span>
              <span>
                ブラウザ完結型モック（データは localStorage に保存されます）
              </span>
            </div>
          </footer>
        </div>
      </div>

      <OverviewSummaryModal
        mode={overviewModalMode}
        onClose={() => setOverviewModalMode(null)}
        onOpenStep={(stepNumber) => {
          setOverviewModalMode(null);
          const idx = Math.max(0, Math.min(stepNumber, GUIDE_CHAPTERS.length - 1));
          handleSelectChapter(idx, GUIDE_CHAPTERS[idx]);
        }}
      />
    </div>
  );
}
