import {
  MProcessStatus,
  MQuestion,
  MRequiredDoc,
  MReviewCriterion,
  MSubsidy,
  SubsidyAppState,
  SystemSettings,
  TClientRequest,
  TMinute,
  TProject,
  TQuestionAnswer,
} from '../types';

/**
 * 現在日時からの相対日付（YYYY-MM-DD）を算出
 */
export function getRelativeDateYmd(daysOffset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 現在日時からの相対ISO日時（YYYY-MM-DDTHH:mm:ss）を算出
 */
export function getRelativeIsoDateTime(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

/**
 * 経過日数の算出（停滞日数等）
 */
export function calcElapsedDays(isoDateTimeOrYmd: string): number {
  const target = new Date(isoDateTimeOrYmd);
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = startOfNow.getTime() - startOfTarget.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 期限までの残日数（マイナスなら期限超過）
 */
export function calcDaysUntilDue(ymd: string): number {
  if (!ymd) return 999;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return 999;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const INITIAL_PROCESS_STATUSES: MProcessStatus[] = [
  { status_id: 'status-1', sort_order: 1, status_name: '受付', is_completed_state: false, is_active: true },
  { status_id: 'status-2', sort_order: 2, status_name: 'ヒアリング', is_completed_state: false, is_active: true },
  { status_id: 'status-3', sort_order: 3, status_name: '書類回収', is_completed_state: false, is_active: true },
  { status_id: 'status-4', sort_order: 4, status_name: '計画書作成', is_completed_state: false, is_active: true },
  { status_id: 'status-5', sort_order: 5, status_name: 'お客様確認', is_completed_state: false, is_active: true },
  { status_id: 'status-6', sort_order: 6, status_name: '申請', is_completed_state: false, is_active: true },
  { status_id: 'status-7', sort_order: 7, status_name: '完了', is_completed_state: true, is_active: true },
  { status_id: 'status-8', sort_order: 8, status_name: '不採択', is_completed_state: true, is_active: true },
];

export function createInitialSubsidies(): MSubsidy[] {
  const nowIso = getRelativeIsoDateTime(-14);
  return [
    {
      subsidy_id: 'sub-monozukuri-19',
      subsidy_name: 'ものづくり補助金',
      round_name: '第19次公募',
      default_deadline: getRelativeDateYmd(30),
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      subsidy_id: 'sub-shinjigyo-1',
      subsidy_name: '新事業進出補助金',
      round_name: '第1回公募',
      default_deadline: getRelativeDateYmd(45),
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];
}

export const INITIAL_REVIEW_CRITERIA: MReviewCriterion[] = [
  // ものづくり補助金 第19次公募
  {
    criteria_id: 'CRT-M1',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 1,
    criteria_type: 'review',
    criteria_name: '技術面の革新性・課題解決力',
    description: '導入設備や技術の先進性、既存工程のボトルネック解消の具体性・技術的根拠が示されているか。',
  },
  {
    criteria_id: 'CRT-M2',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 2,
    criteria_type: 'review',
    criteria_name: '事業化面・市場性',
    description: 'ターゲット市場の需要根拠、具体的な販売単価・数量計画、実施体制・収益見通しの妥当性があるか。',
  },
  {
    criteria_id: 'CRT-M3',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 3,
    criteria_type: 'review',
    criteria_name: '政策面・賃上げ目標',
    description: '付加価値額の年率向上および持続的な賃上げ・従業員給与増加の数値目標と達成根拠があるか。',
  },
  {
    criteria_id: 'CRT-M4',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 4,
    criteria_type: 'bonus',
    criteria_name: '賃上げ・事業継続力強化計画加点',
    description: '大幅な賃上げ特例、パートナーシップ構築宣言、BCP（事業継続力強化計画）認定等の加点要件。',
  },
  // 新事業進出補助金 第1回公募
  {
    criteria_id: 'CRT-S1',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 1,
    criteria_type: 'review',
    criteria_name: '新市場性・既存事業とのシナジー',
    description: '既存事業で培った強みを活かし、新市場・新顧客層へ進出する合理性と優位性があるか。',
  },
  {
    criteria_id: 'CRT-S2',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 2,
    criteria_type: 'review',
    criteria_name: '事業化体制・投資計画の妥当性',
    description: '設備・システム投資の内容と資金計画、スケジュールおよび推進体制が現実的か。',
  },
  {
    criteria_id: 'CRT-S3',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 3,
    criteria_type: 'review',
    criteria_name: '付加価値額・賃上げ要件の達成性',
    description: '付加価値額CAGRおよび1人あたり給与総額の引き上げ要件を満たす収益構造になっているか。',
  },
  {
    criteria_id: 'CRT-S4',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 4,
    criteria_type: 'bonus',
    criteria_name: 'GX/DX・ワークライフバランス加点',
    description: 'えるぼし・くるみん認定やDX認定・脱炭素（GX）への取り組みによる加点対象要件。',
  },
];

export const INITIAL_QUESTIONS: MQuestion[] = [
  // ものづくり補助金 第19次公募（6問）
  {
    question_id: 'QM-1',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 1,
    section_name: '第1章 企業・事業の現状',
    question_title: '1. 企業概要・現在の事業内容',
    question_guide: '自社の強み、主要製品・取引先、保有設備、これまでの実績を具体的に記載してください。',
    recommended_chars: 400,
    max_chars: 600,
    linked_criteria_ids: ['CRT-M1'],
  },
  {
    question_id: 'QM-2',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 2,
    section_name: '第1章 企業・事業の現状',
    question_title: '2. 経営課題と本事業の目的',
    question_guide: '現状の工程ボトルネックや外部環境・市場変化への対応必要性を整理してください。',
    recommended_chars: 500,
    max_chars: 800,
    linked_criteria_ids: ['CRT-M1', 'CRT-M2'],
  },
  {
    question_id: 'QM-3',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 3,
    section_name: '第2章 革新的な取り組み内容',
    question_title: '3. 補助事業で取り組む革新的な内容',
    question_guide: '導入設備の仕様、従来技術との違い、技術的ハードルと解決方法を明記してください。',
    recommended_chars: 600,
    max_chars: 1000,
    linked_criteria_ids: ['CRT-M1'],
  },
  {
    question_id: 'QM-4',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 4,
    section_name: '第3章 事業化と数値計画',
    question_title: '4. 事業化スケジュール・販売計画',
    question_guide: 'ターゲット顧客、想定単価・販売数量の根拠、営業体制および納品までのスケジュール。',
    recommended_chars: 500,
    max_chars: 800,
    linked_criteria_ids: ['CRT-M2'],
  },
  {
    question_id: 'QM-5',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 5,
    section_name: '第3章 事業化と数値計画',
    question_title: '5. 数値目標・賃上げ計画',
    question_guide: '投資回収見込み、付加価値額・従業員給与増加の具体的な年率目標と原資の根拠。',
    recommended_chars: 400,
    max_chars: 600,
    linked_criteria_ids: ['CRT-M3'],
  },
  {
    question_id: 'QM-6',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 6,
    section_name: '第4章 加点要件',
    question_title: '6. 加点項目に関する取り組み',
    question_guide: '大幅賃上げ特例、BCP（事業継続力強化計画）認定、パートナーシップ構築宣言等の取得状況・予定。',
    recommended_chars: 300,
    max_chars: 500,
    linked_criteria_ids: ['CRT-M4'],
  },
  // 新事業進出補助金 第1回公募（5問）
  {
    question_id: 'QS-1',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 1,
    section_name: '第1章 既存事業と新事業進出の背景',
    question_title: '1. 既存事業の強みと新事業進出の背景',
    question_guide: '既存事業で蓄積した技術・顧客基盤と、新市場へ進出する経営上の背景を記載してください。',
    recommended_chars: 500,
    max_chars: 800,
    linked_criteria_ids: ['CRT-S1'],
  },
  {
    question_id: 'QS-2',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 2,
    section_name: '第2章 新規事業の内容と市場性',
    question_title: '2. 新事業の商品・サービス内容とターゲット市場',
    question_guide: '新規性要件に該当する新商品・サービスの詳細、競合比較、顧客ニーズの根拠を示してください。',
    recommended_chars: 600,
    max_chars: 1000,
    linked_criteria_ids: ['CRT-S1', 'CRT-S2'],
  },
  {
    question_id: 'QS-3',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 3,
    section_name: '第2章 新規事業の内容と市場性',
    question_title: '3. 設備・システム投資計画と実施体制',
    question_guide: '導入する設備・システムの金額内訳、外注・連携先、社内プロジェクト推進体制を記載してください。',
    recommended_chars: 450,
    max_chars: 700,
    linked_criteria_ids: ['CRT-S2'],
  },
  {
    question_id: 'QS-4',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 4,
    section_name: '第3章 収支・賃上げ計画',
    question_title: '4. 収益計画・付加価値額・賃上げ目標',
    question_guide: '3〜5年間の売上・利益計画、付加価値額伸び率、給与支給総額・最低賃金の引き上げ計画を記載してください。',
    recommended_chars: 450,
    max_chars: 700,
    linked_criteria_ids: ['CRT-S3'],
  },
  {
    question_id: 'QS-5',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 5,
    section_name: '第4章 加点項目',
    question_title: '5. 加点認定・政策的取り組み',
    question_guide: 'DX/GX関連の取り組みやワークライフバランス関連認定（えるぼし等）の状況を記載してください。',
    recommended_chars: 300,
    max_chars: 500,
    linked_criteria_ids: ['CRT-S4'],
  },
];

export const INITIAL_REQUIRED_DOCS: MRequiredDoc[] = [
  // ものづくり補助金 第19次公募
  {
    doc_template_id: 'DM-1',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 1,
    doc_name: '直近3期分の決算書一式（BS/PL/製造原価/販管費明細）',
    note: '確定申告書別表一および勘定科目内訳明細書を含むPDFをご準備ください。',
  },
  {
    doc_template_id: 'DM-2',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 2,
    doc_name: '導入予定設備の相見積書（2社以上）',
    note: '単価50万円（税抜）以上の設備は原則2社以上の相見積書が必要です。',
  },
  {
    doc_template_id: 'DM-3',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 3,
    doc_name: '直近の賃金台帳および労働者名簿',
    note: '給与支給総額および事業場内最低賃金の確認に使用します。',
  },
  {
    doc_template_id: 'DM-4',
    subsidy_id: 'sub-monozukuri-19',
    sort_order: 4,
    doc_name: 'GビズIDプライムアカウント取得確認画面',
    note: '電子申請に必須となります。未取得の場合は早急に申請手続きをお願いします。',
  },
  // 新事業進出補助金 第1回公募
  {
    doc_template_id: 'DS-1',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 1,
    doc_name: '直近2期分の決算書および法人税確定申告書一式',
    note: '電子申請添付用のPDFデータをご提出ください。',
  },
  {
    doc_template_id: 'DS-2',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 2,
    doc_name: '金融機関による事業計画確認書',
    note: '補助金額1,500万円超の場合は認定支援機関に加えて金融機関の確認書が必要です。',
  },
  {
    doc_template_id: 'DS-3',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 3,
    doc_name: '新規事業の設備・システム見積書',
    note: '導入予定設備の型番・金額・納期が明記された見積書をご提出ください。',
  },
  {
    doc_template_id: 'DS-4',
    subsidy_id: 'sub-shinjigyo-1',
    sort_order: 4,
    doc_name: '雇用・賃金台帳（直近1年分）',
    note: '基準年度の従業員数・給与支給総額算定に必要です。',
  },
];

export const SAMPLE_MINUTE_INITIAL = `【初回ヒアリング議事録】株式会社○○ 様
日時：初回オンライン面談
出席者：代表取締役 山田太郎様、製造部長 鈴木様／当社：田中健太

1. 企業概要・現在の強み
・1988年創業の精密金属加工メーカー（従業員48名、本社工場・第二工場の2拠点）。
・主力は産業用ロボット向け超精密ギアおよび半導体製造装置用のアルミ・チタン切削部品。
・大手装置メーカー3社と20年以上の直接取引があり、±0.005mm（5ミクロン）の公差保証ができる加工ノウハウと三次元測定機による全数検査体制が強み。

2. 現状の経営課題・ボトルネック
・半導体製造装置の次世代モデル向けに、5軸同時加工が必要な複雑形状部品の引き合いが急増している。
・しかし、既存の3軸マシニングセンタでは1ワークあたり段取り替えが4回発生し、加工リードタイムが14日かかっているため、顧客の短納期要求（5日以内）に応えられず一部失注している。
・熟練工の夜間・休日残業も月45時間超に達し、現場負荷が高い。

3. 導入設備・革新的な取り組み内容
・最新の同時5軸制御マシニングセンタ（自動化パレットチェンジャー付）を2台導入予定（設備投資額 8,400万円）。
・工程集約により段取り替えを4回→1回に削減し、加工精度を±0.002mmへ引き上げつつ、無人夜間稼働でリードタイムを14日→4日へ短縮する計画。

4. 事業化・販売見通し（一部未確定）
・販売単価は1ロットあたり525万円を想定している。
・ただし、年間販売数量の見込み、営業推進体制、具体的な納品開始スケジュールについては社内で試算中のため次回確認予定。

5. 数値目標・賃上げ・加点項目（未確認）
・具体的な付加価値額目標、賃上げ率（％）、BCPやパートナーシップ構築宣言等の加点取得状況については今回ヒアリング時間切れのため未確認。`;

export const SAMPLE_MINUTE_ADDITIONAL = `【第2回 追加ヒアリング回答メール】株式会社○○ 様
受領内容（代表取締役 山田様・経理ご担当者様より回答）：

■ 設問4（事業化スケジュール・販売計画）について
・ターゲット顧客は既存の半導体装置大手2社および新規開拓中の医療機器メーカー3社（すでに2社から試作引き合いを受領済）。
・想定販売数量は初年度月平均7ロット（年間84ロット、売上約4.4億円）、3年後には月平均10ロット（年間120ロット、売上6.3億円）を計画。
・スケジュール：交付決定後2か月で設備発注、6か月目に据付・試運転完了、7か月目から量産出荷を開始する。推進体制は製造部長の鈴木をリーダーに、専任オペレーター3名・営業2名の計6名プロジェクトチームを編成済み。

■ 設問5（数値目標・賃上げ計画）について
・投資回収期間は約3.8年を試算。
・付加価値額は年率平均4.8％向上（3年後に現在の1.15倍以上）、給与支給総額は年率平均3.5％以上増加、1人あたり平均賃上げ率は年率6.2％（従業員への賞与還元およびベースアップ）を実施する計画。事業場内最低賃金も地域別最低賃金＋55円以上へ引き上げる。

■ 設問6（加点項目に関する取り組み）について
・中小企業庁「事業継続力強化計画（BCP）」は昨年11月に認定取得済み（認定番号あり）。
・「パートナーシップ構築宣言」も今年度中に登録公表を完了済みであり、下請取引適正化に取り組んでいる。
・さらに今回、給与支給総額＋6.0％水準を目指す「大幅な賃上げに係る加点（特例）」にもエントリー予定。`;

export const SAMPLE_GUIDELINE_BREAKDOWN = {
  guidelineFileName: '令和7年度_省力化投資・ものづくり革新補助金_第20次公募要領.pdf',
  formFileName: '様式2_補助事業計画書記載フォーマット.xlsx',
  subsidyName: 'ものづくり補助金（AI分解取込）',
  roundName: '第20次公募',
  defaultDeadlineDays: 40,
};

export function createInitialProjects(): TProject[] {
  const nowMinus14 = getRelativeIsoDateTime(-14);
  return [
    {
      project_id: 'PRJ-2026-001',
      client_name: '株式会社○○',
      subsidy_id: 'sub-monozukuri-19',
      subsidy_label_cache: 'ものづくり補助金 第19次公募',
      pic_name: '田中 健太',
      process_status_id: 'status-3', // 書類回収
      next_action: '不足ヒアリング事項・見積書の回収依頼送付',
      next_action_due: getRelativeDateYmd(-3), // 3日前 → 期限超過（赤）
      next_action_owner: '田中 健太',
      application_deadline: getRelativeDateYmd(25),
      waiting_for: 'client', // お客様待ち
      criteria_coverage: [
        {
          criteria_id: 'CRT-M1',
          criteria_name: '技術面の革新性・課題解決力',
          criteria_type: 'review',
          level: 'sufficient',
          reason: 'Q1〜Q3にて既存3軸加工の課題（段取り4回・14日）と同時5軸導入による±0.002mm高精度化・4日短縮が具体的に記述されています。',
          hint: 'さらなる説得力向上のため、検証データや検査機器との連携手順を1文追記すると万全です。',
          evaluated_at: getRelativeIsoDateTime(-5),
        },
        {
          criteria_id: 'CRT-M2',
          criteria_name: '事業化面・市場性',
          criteria_type: 'review',
          level: 'weak',
          reason: 'Q2に引き合い背景はありますが、Q4（事業化スケジュール・販売計画）が単価のみで数量見込み・体制が不足しています。',
          hint: '想定販売数量（月/年ロット数）、ターゲット顧客名、導入〜量産開始の月次スケジュールを追加してください。',
          evaluated_at: getRelativeIsoDateTime(-5),
        },
        {
          criteria_id: 'CRT-M3',
          criteria_name: '政策面・賃上げ目標',
          criteria_type: 'review',
          level: 'missing',
          reason: 'Q5（数値目標・賃上げ計画）が未回答（不足）のため、付加価値額および賃上げ率の記載がありません。',
          hint: '付加価値額の年率目標・給与支給総額の増加率・投資回収年数をヒアリングして記述してください。',
          evaluated_at: getRelativeIsoDateTime(-5),
        },
        {
          criteria_id: 'CRT-M4',
          criteria_name: '賃上げ・事業継続力強化計画加点',
          criteria_type: 'bonus',
          level: 'missing',
          reason: 'Q6（加点項目に関する取り組み）が未記載のため、加点獲得の機会を逃す恐れがあります。',
          hint: 'BCP認定・パートナーシップ構築宣言・賃上げ特例のいずれを取得・予定しているか確認してください。',
          evaluated_at: getRelativeIsoDateTime(-5),
        },
      ],
      last_activity_at: getRelativeIsoDateTime(-5), // 5日前 → 停滞日数 5日
      created_at: nowMinus14,
    },
    {
      project_id: 'PRJ-2026-002',
      client_name: '△△精密工業株式会社',
      subsidy_id: 'sub-shinjigyo-1',
      subsidy_label_cache: '新事業進出補助金 第1回公募',
      pic_name: '佐藤 美咲',
      process_status_id: 'status-4', // 計画書作成
      next_action: '第1回議事録からの仮事業計画書ドラフト作成',
      next_action_due: getRelativeDateYmd(2), // 2日後 → 期限間近（黄）
      next_action_owner: '佐藤 美咲',
      application_deadline: getRelativeDateYmd(40),
      waiting_for: 'internal', // 社内待ち
      criteria_coverage: [
        {
          criteria_id: 'CRT-S1',
          criteria_name: '新市場性・既存事業とのシナジー',
          criteria_type: 'review',
          level: 'missing',
          reason: '仮事業計画書がまだAI抽出・生成されていません。',
          hint: 'タブ②「議事録・AI実行」で「全議事録から回答を抽出・仮計画書を生成」を実行してください。',
          evaluated_at: getRelativeIsoDateTime(-2),
        },
        {
          criteria_id: 'CRT-S2',
          criteria_name: '事業化体制・投資計画の妥当性',
          criteria_type: 'review',
          level: 'missing',
          reason: '仮事業計画書がまだ生成されていません。',
          hint: 'タブ②でAI抽出を実行後、必要に応じて不足項目を確認してください。',
          evaluated_at: getRelativeIsoDateTime(-2),
        },
        {
          criteria_id: 'CRT-S3',
          criteria_name: '付加価値額・賃上げ要件の達成性',
          criteria_type: 'review',
          level: 'missing',
          reason: '仮事業計画書がまだ生成されていません。',
          hint: 'タブ②でAI抽出を実行してください。',
          evaluated_at: getRelativeIsoDateTime(-2),
        },
        {
          criteria_id: 'CRT-S4',
          criteria_name: 'GX/DX・ワークライフバランス加点',
          criteria_type: 'bonus',
          level: 'missing',
          reason: '仮事業計画書がまだ生成されていません。',
          hint: 'タブ②でAI抽出を実行してください。',
          evaluated_at: getRelativeIsoDateTime(-2),
        },
      ],
      last_activity_at: getRelativeIsoDateTime(-2), // 2日前 → 停滞日数 2日
      created_at: getRelativeIsoDateTime(-7),
    },
  ];
}

export function createInitialMinutes(): TMinute[] {
  return [
    {
      minute_id: 'MIN-001',
      project_id: 'PRJ-2026-001',
      recorded_date: getRelativeDateYmd(-6),
      source_title: '第1回 初回ヒアリング議事録（オンライン）',
      input_type: 'text',
      content_text: SAMPLE_MINUTE_INITIAL,
      created_at: getRelativeIsoDateTime(-6),
    },
    {
      minute_id: 'MIN-002',
      project_id: 'PRJ-2026-002',
      recorded_date: getRelativeDateYmd(-2),
      source_title: '第1回 事業ヒアリングメモ（Googleドキュメント抜粋）',
      input_type: 'gdoc_url',
      gdoc_url: 'https://docs.google.com/document/d/demo-shinjigyo-002/edit',
      content_text: `【第1回 ヒアリング議事録】△△精密工業株式会社 様
1. 既存事業の強み：
自動車用金型の設計・メンテナンスで30年の実績（従業員32名）。大手Tier1サプライヤーへの安定供給基盤と、CAD/CAMによる高速高精度モデリング技術が強み。

2. 新事業進出の内容：
既存の金型高精度加工技術を応用し、航空機・ドローン向け軽量CFRP（炭素繊維強化プラスチック）成形パーツの受託製造事業へ新規参入する。
ターゲット市場は国内産業用ドローンメーカーおよびeVTOL試作開発企業。すでに試作サンプルの評価試験で高い評価を得ている。

3. 設備・システム投資：
オートクレーブ成形炉および専用CNCトリミング加工機を導入予定（投資額6,500万円）。

※なお、3〜5年の詳細な売上・賃上げ目標数値、およびDX/GX関連認定の取得有無は現在お客様にて確認中（次回回答予定）。`,
      created_at: getRelativeIsoDateTime(-2),
    },
  ];
}

export function createInitialQuestionAnswers(): TQuestionAnswer[] {
  const upd1 = getRelativeIsoDateTime(-5);
  const upd2 = getRelativeIsoDateTime(-2);

  return [
    // 案件1 (PRJ-2026-001): Q1〜Q3 answered, Q4〜Q6 insufficient
    {
      answer_id: 'ANS-001-1',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-1',
      sort_order: 1,
      section_name: '第1章 企業・事業の現状',
      question_title: '1. 企業概要・現在の事業内容',
      recommended_chars: 400,
      max_chars: 600,
      linked_criteria_ids: ['CRT-M1'],
      answer_status: 'answered',
      draft_text:
        '株式会社○○は1988年創業の精密金属加工メーカー（従業員48名、本社工場・第二工場の2拠点体制）である。主力製品は産業用ロボット向け超精密ギアおよび半導体製造装置用のアルミ・チタン切削部品であり、大手装置メーカー3社と20年以上の直接取引を継続している。最大の強みは±0.005mm（5ミクロン）の公差を保証する高精度加工ノウハウと、三次元測定機を用いた全数検査による品質担保体制にある。',
      is_manual_edited: false,
      evidences: [
        {
          minute_id: 'MIN-001',
          source_label: '第1回 初回ヒアリング議事録（オンライン）',
          recorded_date: getRelativeDateYmd(-6),
          quote: '1988年創業の精密金属加工メーカー（従業員48名、本社工場・第二工場の2拠点）。±0.005mm（5ミクロン）の公差保証ができる加工ノウハウと三次元測定機による全数検査体制が強み。',
        },
      ],
      missing_reason: '',
      updated_at: upd1,
    },
    {
      answer_id: 'ANS-001-2',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-2',
      sort_order: 2,
      section_name: '第1章 企業・事業の現状',
      question_title: '2. 経営課題と本事業の目的',
      recommended_chars: 500,
      max_chars: 800,
      linked_criteria_ids: ['CRT-M1', 'CRT-M2'],
      answer_status: 'answered',
      draft_text:
        '近年、半導体製造装置の次世代モデル向けに、5軸同時加工を要する複雑形状部品の引き合いが急増している。しかし、自社保有の既存3軸マシニングセンタでは1ワークあたり4回の段取り替えが必要となり、加工リードタイムが14日に長期化している。その結果、顧客が求める短納期（5日以内）に対応できず一部案件を失注する機会損失が発生しているほか、熟練工の夜間・休日残業が月45時間を超えるなど現場負荷の増大が喫緊の経営課題となっている。',
      is_manual_edited: false,
      evidences: [
        {
          minute_id: 'MIN-001',
          source_label: '第1回 初回ヒアリング議事録（オンライン）',
          recorded_date: getRelativeDateYmd(-6),
          quote: '既存の3軸マシニングセンタでは1ワークあたり段取り替えが4回発生し、加工リードタイムが14日かかっているため、顧客の短納期要求（5日以内）に応えられず一部失注している。',
        },
      ],
      missing_reason: '',
      updated_at: upd1,
    },
    {
      answer_id: 'ANS-001-3',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-3',
      sort_order: 3,
      section_name: '第2章 革新的な取り組み内容',
      question_title: '3. 補助事業で取り組む革新的な内容',
      recommended_chars: 600,
      max_chars: 1000,
      linked_criteria_ids: ['CRT-M1'],
      answer_status: 'answered',
      draft_text:
        '本事業では、自動化パレットチェンジャーを備えた最新の同時5軸制御マシニングセンタを2台導入する（設備投資額8,400万円）。従来の3軸加工で生じていた多面割り出しの段取り替えを4回から1回へ工程集約することで、段取り誤差を排除し加工精度を±0.002mm水準へと飛躍的に向上させる。さらに自動パレットチェンジャーによる夜間無人連続稼働を組み合わせ、加工リードタイムを14日から4日へ大幅に短縮し、難削・複雑形状部品の安定供給を実現する。',
      is_manual_edited: false,
      evidences: [
        {
          minute_id: 'MIN-001',
          source_label: '第1回 初回ヒアリング議事録（オンライン）',
          recorded_date: getRelativeDateYmd(-6),
          quote: '最新の同時5軸制御マシニングセンタ（自動化パレットチェンジャー付）を2台導入予定（設備投資額 8,400万円）。段取り替えを4回→1回に削減し、加工精度を±0.002mmへ引き上げつつ、リードタイムを14日→4日へ短縮する計画。',
        },
      ],
      missing_reason: '',
      updated_at: upd1,
    },
    {
      answer_id: 'ANS-001-4',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-4',
      sort_order: 4,
      section_name: '第3章 事業化と数値計画',
      question_title: '4. 事業化スケジュール・販売計画',
      recommended_chars: 500,
      max_chars: 800,
      linked_criteria_ids: ['CRT-M2'],
      answer_status: 'insufficient',
      draft_text: '',
      is_manual_edited: false,
      evidences: [],
      missing_reason:
        '想定単価（525万円/ロット）の記載はありますが、年間・月間の販売数量見込み、ターゲット顧客の内訳、設備導入から量産開始までの具体的スケジュール・推進体制に関する情報が議事録にないため回答を作成できません。',
      updated_at: upd1,
    },
    {
      answer_id: 'ANS-001-5',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-5',
      sort_order: 5,
      section_name: '第3章 事業化と数値計画',
      question_title: '5. 数値目標・賃上げ計画',
      recommended_chars: 400,
      max_chars: 600,
      linked_criteria_ids: ['CRT-M3'],
      answer_status: 'insufficient',
      draft_text: '',
      is_manual_edited: false,
      evidences: [],
      missing_reason:
        '付加価値額の年率増加目標、給与支給総額・1人あたり賃上げ率（％）、最低賃金引上げ計画および投資回収期間の具体数値が未聴取のため推測生成を行いませんでした。',
      updated_at: upd1,
    },
    {
      answer_id: 'ANS-001-6',
      project_id: 'PRJ-2026-001',
      template_question_id: 'QM-6',
      sort_order: 6,
      section_name: '第4章 加点要件',
      question_title: '6. 加点項目に関する取り組み',
      recommended_chars: 300,
      max_chars: 500,
      linked_criteria_ids: ['CRT-M4'],
      answer_status: 'insufficient',
      draft_text: '',
      is_manual_edited: false,
      evidences: [],
      missing_reason:
        '事業継続力強化計画（BCP）認定・パートナーシップ構築宣言・大幅賃上げ特例等の取得有無および今後の申請予定について議事録に記載がありません。',
      updated_at: upd1,
    },

    // 案件2 (PRJ-2026-002): 全問 insufficient（タブ②でのAI抽出デモ用）
    ...INITIAL_QUESTIONS.filter((q) => q.subsidy_id === 'sub-shinjigyo-1').map((q, i) => ({
      answer_id: `ANS-002-${i + 1}`,
      project_id: 'PRJ-2026-002',
      template_question_id: q.question_id,
      sort_order: q.sort_order,
      section_name: q.section_name,
      question_title: q.question_title,
      recommended_chars: q.recommended_chars,
      max_chars: q.max_chars,
      linked_criteria_ids: q.linked_criteria_ids,
      answer_status: 'insufficient' as const,
      draft_text: '',
      is_manual_edited: false,
      evidences: [],
      missing_reason: 'まだAI抽出が実行されていません。タブ②から議事録抽出を実行してください。',
      updated_at: upd2,
    })),
  ];
}

export function createInitialClientRequests(): TClientRequest[] {
  const reqAt = getRelativeDateYmd(-4);
  const recAt = getRelativeDateYmd(-5);
  return [
    // PRJ-2026-001 の不足質問3件（2件 unrequested, 1件 requested）
    {
      request_id: 'REQ-001-Q4',
      project_id: 'PRJ-2026-001',
      request_type: 'question',
      linked_answer_id: 'ANS-001-4',
      title: '【Q4確認】想定販売数量（月/年ロット数）と量産スケジュール・推進体制',
      detail_note:
        '単価525万円に対する年間販売数量見込み、ターゲット顧客、設備導入〜量産開始までのスケジュールと担当体制をご教示ください。',
      status: 'requested',
      requested_at: reqAt,
    },
    {
      request_id: 'REQ-001-Q5',
      project_id: 'PRJ-2026-001',
      request_type: 'question',
      linked_answer_id: 'ANS-001-5',
      title: '【Q5確認】付加価値額・賃上げ計画（年率％）および投資回収見込',
      detail_note:
        '年率付加価値額の増加目標、給与支給総額および1人あたり賃上げ率（％）、事業場内最低賃金の引き上げ計画をご確認願います。',
      status: 'unrequested',
    },
    {
      request_id: 'REQ-001-Q6',
      project_id: 'PRJ-2026-001',
      request_type: 'question',
      linked_answer_id: 'ANS-001-6',
      title: '【Q6確認】加点項目（BCP認定・パートナーシップ構築宣言・賃上げ特例）の状況',
      detail_note:
        '事業継続力強化計画（BCP）の認定有無、パートナーシップ構築宣言の公表状況、大幅賃上げ特例へのエントリー意向をご回答ください。',
      status: 'unrequested',
    },
    // PRJ-2026-001 の必要書類4件（2件 received, 1件 requested, 1件 unrequested）
    {
      request_id: 'REQ-001-D1',
      project_id: 'PRJ-2026-001',
      request_type: 'document',
      title: '直近3期分の決算書一式（BS/PL/製造原価/販管費明細）',
      detail_note: '確定申告書別表一および勘定科目内訳明細書を含むPDFをご準備ください。',
      status: 'received',
      requested_at: getRelativeDateYmd(-6),
      received_at: recAt,
    },
    {
      request_id: 'REQ-001-D2',
      project_id: 'PRJ-2026-001',
      request_type: 'document',
      title: '導入予定設備の相見積書（2社以上）',
      detail_note: '単価50万円（税抜）以上の設備は原則2社以上の相見積書が必要です。',
      status: 'requested',
      requested_at: reqAt,
    },
    {
      request_id: 'REQ-001-D3',
      project_id: 'PRJ-2026-001',
      request_type: 'document',
      title: '直近の賃金台帳および労働者名簿',
      detail_note: '給与支給総額および事業場内最低賃金の確認に使用します。',
      status: 'unrequested',
    },
    {
      request_id: 'REQ-001-D4',
      project_id: 'PRJ-2026-001',
      request_type: 'document',
      title: 'GビズIDプライムアカウント取得確認画面',
      detail_note: '電子申請に必須となります。未取得の場合は早急に申請手続きをお願いします。',
      status: 'received',
      requested_at: getRelativeDateYmd(-6),
      received_at: recAt,
    },

    // PRJ-2026-002 の必要書類4件
    ...INITIAL_REQUIRED_DOCS.filter((d) => d.subsidy_id === 'sub-shinjigyo-1').map((d, idx) => ({
      request_id: `REQ-002-D${idx + 1}`,
      project_id: 'PRJ-2026-002',
      request_type: 'document' as const,
      title: d.doc_name,
      detail_note: d.note,
      status: idx === 0 ? ('received' as const) : ('unrequested' as const),
      received_at: idx === 0 ? getRelativeDateYmd(-2) : undefined,
    })),
  ];
}

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  geminiModelStandard: 'gemini-2.5-flash',
  geminiModelHeavy: 'gemini-2.5-pro',
  isApiKeyConfigured: true,
  apiKeyMaskedPreview: 'AIzaSy••••••••••••••••••••MOCK',
};

export function createInitialAppState(): SubsidyAppState {
  return {
    activeScreen: 'dashboard',
    workspaceTab: 'progress',
    selectedProjectId: 'PRJ-2026-001',
    subsidies: createInitialSubsidies(),
    questions: INITIAL_QUESTIONS,
    reviewCriteria: INITIAL_REVIEW_CRITERIA,
    requiredDocs: INITIAL_REQUIRED_DOCS,
    processStatuses: INITIAL_PROCESS_STATUSES,
    projects: createInitialProjects(),
    minutes: createInitialMinutes(),
    questionAnswers: createInitialQuestionAnswers(),
    clientRequests: createInitialClientRequests(),
    systemSettings: INITIAL_SYSTEM_SETTINGS,
  };
}
