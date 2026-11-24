export type ScreenId = 'dashboard' | 'workspace' | 'templates' | 'settings';
export type WorkspaceTabId = 'progress' | 'minutes' | 'draft';

export type SubsidyStatus = 'active' | 'archived';
export type CriteriaType = 'review' | 'bonus';
export type WaitingForType = 'client' | 'internal' | 'none';
export type MinuteInputType = 'text' | 'file' | 'gdoc_url';
export type AnswerStatus = 'insufficient' | 'answered';
export type RequestType = 'question' | 'document';
export type RequestStatus = 'unrequested' | 'requested' | 'received';
export type CriteriaCoverageLevel = 'sufficient' | 'weak' | 'missing';

/** シート1: M_Subsidies（補助金・公募回マスタ） */
export interface MSubsidy {
  subsidy_id: string;
  subsidy_name: string;
  round_name: string;
  default_deadline: string; // YYYY-MM-DD
  status: SubsidyStatus;
  created_at: string;
  updated_at: string;
}

/** シート2: M_Questions（設問テンプレートマスタ） */
export interface MQuestion {
  question_id: string;
  subsidy_id: string;
  sort_order: number;
  section_name: string;
  question_title: string;
  question_guide: string;
  recommended_chars: number;
  max_chars: number; // 0は上限なし
  linked_criteria_ids: string[];
}

/** シート3: M_ReviewCriteria（審査項目・加点項目マスタ） */
export interface MReviewCriterion {
  criteria_id: string;
  subsidy_id: string;
  sort_order: number;
  criteria_type: CriteriaType;
  criteria_name: string;
  description: string;
}

/** シート4: M_RequiredDocs（必要書類テンプレートマスタ） */
export interface MRequiredDoc {
  doc_template_id: string;
  subsidy_id: string;
  sort_order: number;
  doc_name: string;
  note: string;
}

/** シート5: M_ProcessStatuses（工程ステータスマスタ） */
export interface MProcessStatus {
  status_id: string;
  sort_order: number;
  status_name: string;
  is_completed_state: boolean; // TRUEの場合「進行中のみ表示」で非表示
  is_active: boolean;
}

/** 審査項目3段階意味判定結果 */
export interface CriteriaCoverageItem {
  criteria_id: string;
  criteria_name: string;
  criteria_type: CriteriaType;
  level: CriteriaCoverageLevel;
  reason: string;
  hint: string;
  evaluated_at: string;
}

/** シート6: T_Projects（案件管理台帳） */
export interface TProject {
  project_id: string;
  client_name: string;
  subsidy_id: string;
  subsidy_label_cache: string;
  pic_name: string;
  process_status_id: string;
  next_action: string;
  next_action_due: string; // YYYY-MM-DD
  next_action_owner: string;
  application_deadline: string; // YYYY-MM-DD
  waiting_for: WaitingForType;
  criteria_coverage: CriteriaCoverageItem[];
  last_activity_at: string; // YYYY-MM-DDTHH:mm:ss
  created_at: string;
}

/** シート7: T_Minutes（議事録・ヒアリング履歴） */
export interface TMinute {
  minute_id: string;
  project_id: string;
  recorded_date: string; // YYYY-MM-DD
  source_title: string;
  input_type: MinuteInputType;
  file_name?: string;
  gdoc_url?: string;
  content_text: string;
  created_at: string;
}

/** 回答根拠オブジェクト */
export interface AnswerEvidence {
  minute_id: string;
  source_label: string;
  recorded_date: string;
  quote: string;
}

/** シート8: T_QuestionAnswers（案件別 設問回答・根拠・文字数） */
export interface TQuestionAnswer {
  answer_id: string;
  project_id: string;
  template_question_id: string;
  sort_order: number;
  section_name: string;
  question_title: string;
  recommended_chars: number;
  max_chars: number;
  linked_criteria_ids: string[];
  answer_status: AnswerStatus;
  draft_text: string;
  is_manual_edited: boolean;
  evidences: AnswerEvidence[];
  missing_reason: string;
  updated_at: string;
}

/** シート9: T_ClientRequests（不足設問連動・書類回収リスト） */
export interface TClientRequest {
  request_id: string;
  project_id: string;
  request_type: RequestType;
  linked_answer_id?: string;
  title: string;
  detail_note: string;
  status: RequestStatus;
  requested_at?: string;
  received_at?: string;
}

/** システム設定（Geminiモデル・APIキー表示モック） */
export interface SystemSettings {
  geminiModelStandard: string; // 例: 'gemini-2.5-flash'
  geminiModelHeavy: string;    // 例: 'gemini-2.5-pro'
  isApiKeyConfigured: boolean;
  apiKeyMaskedPreview: string; // 例: 'AIzaSy••••••••••••••••••••MOCK'
}

export interface SubsidyAppState {
  activeScreen: ScreenId;
  workspaceTab: WorkspaceTabId;
  selectedProjectId: string;
  subsidies: MSubsidy[];
  questions: MQuestion[];
  reviewCriteria: MReviewCriterion[];
  requiredDocs: MRequiredDoc[];
  processStatuses: MProcessStatus[];
  projects: TProject[];
  minutes: TMinute[];
  questionAnswers: TQuestionAnswer[];
  clientRequests: TClientRequest[];
  systemSettings: SystemSettings;
}
