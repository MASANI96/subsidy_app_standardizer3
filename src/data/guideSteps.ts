import { ScreenId, WorkspaceTabId } from '../types';

export interface GuideTarget {
  screen?: ScreenId;
  workspaceTab?: WorkspaceTabId;
  projectId?: string;
  openOverviewModal?: 'overview' | null;
}

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  guideId: string;
  specTag: string;
  target?: GuideTarget;
}

export interface GuideChapter {
  id: string;
  numberLabel: string; // '00'..'07'
  title: string;
  durationHint: string;
  talkingPoints: string[];
  defaultTarget?: GuideTarget;
  steps: GuideStep[];
}

export interface SpecCorrespondenceRow {
  no: string;
  screenLabel: string;
  featureName: string;
  summary: string;
  guideId: string;
  target: GuideTarget;
}

/**
 * 新仕様（台本00〜07）説明ガイド章定義
 */
export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'ch-00',
    numberLabel: '00',
    title: '本モックの概要と対象範囲',
    durationHint: '約2分',
    talkingPoints: [
      '本システムは「GAS Webアプリ＋Googleスプレッドシート（9テーブル）＋Gemini API」で構築する補助金申請支援システムの動作検証用モックです。',
      '3大アウトプット（①工程管理表＆停滞監視、②顧客向け質問・書類依頼文の自動生成、③根拠付き＆推測禁止の仮事業計画書＋審査3段階判定）を一貫体験できます。',
      '決算書PDF解析・BS/PL収支シミュレーション・ロール別権限・顧客共有URL等は本スコープ対象外とし、現場の進行管理と計画書一次ドラフト作成に一点集中しています。',
    ],
    defaultTarget: { screen: 'dashboard' },
    steps: [
      {
        id: 'step-00-1',
        title: 'システム全体構成・GAS本番構成図を開く',
        description:
          '全体像、対象範囲・対象外範囲、9テーブル構造と3大アウトプットをまとめた俯瞰図モーダルを表示します。',
        actionLabel: '全体俯瞰図モーダルを開く',
        guideId: 'guide-dashboard-table',
        specTag: '台本 00',
        target: { screen: 'dashboard', openOverviewModal: 'overview' },
      },
    ],
  },
  {
    id: 'ch-01',
    numberLabel: '01',
    title: '工程管理表と期限・停滞管理',
    durationHint: '約3分',
    talkingPoints: [
      '「進行中のみ表示」トグルを初期ONにし、完了・不採択案件を除いた進行中案件だけを一覧監視できます。',
      '次アクション期限や申請締切が過ぎた案件は赤背景＋「期限超過」バッジ、3日以内は黄バッジで即座に警告します。',
      '「何待ち区分（お客様待ち／社内待ち）」「未回答質問／未回収書類件数」「停滞日数」でボトルネック案件を把握できます。',
    ],
    defaultTarget: { screen: 'dashboard' },
    steps: [
      {
        id: 'step-01-1',
        title: '絞り込み＆停滞日数ソートを確認',
        description:
          '「進行中のみ表示」や担当者・何待ち区分・停滞日数順ソートで、フォローが必要な案件を即座に抽出できます。',
        actionLabel: '絞り込みバーを強調',
        guideId: 'guide-dashboard-filters',
        specTag: '画面1 / No.3',
        target: { screen: 'dashboard' },
      },
      {
        id: 'step-01-2',
        title: '期限超過（株式会社○○）と期限間近（△△精密工業）',
        description:
          '「株式会社○○」は3日超過（赤背景）・お客様待ち・停滞5日としてハイライト表示されています。',
        actionLabel: '案件一覧テーブルを強調',
        guideId: 'guide-dashboard-table',
        specTag: '画面1 / No.3',
        target: { screen: 'dashboard' },
      },
    ],
  },
  {
    id: 'ch-02',
    numberLabel: '02',
    title: '補助金テンプレートと公募要領AI分解',
    durationHint: '約3分',
    talkingPoints: [
      '新しい補助金や公募回が公開された際、公募要領PDFと申請様式をアップロードするだけでAIが設問・審査基準・必要書類を自動分解します。',
      '分解結果を手動で微調整・並び替えして確定保存すると、新規案件作成時にそのまま利用できます。',
    ],
    defaultTarget: { screen: 'templates' },
    steps: [
      {
        id: 'step-02-1',
        title: 'AI自動分解ウィザードを体験する',
        description:
          '「サンプル公募要領・様式をセット」を押し、「AIで設問・審査項目・必要書類を自動分解する」を実行してください。',
        actionLabel: 'AI自動分解ウィザードへ移動',
        guideId: 'guide-templates-ai',
        specTag: '画面5 / No.1〜2',
        target: { screen: 'templates' },
      },
      {
        id: 'step-02-2',
        title: '分解結果の編集・紐付け・確定保存',
        description:
          '設問ごとの推奨/上限文字数や審査項目との紐付けを確認・修正して確定保存します。',
        actionLabel: 'テンプレート編集エリアを強調',
        guideId: 'guide-templates-editor',
        specTag: '画面5 / No.2',
        target: { screen: 'templates' },
      },
    ],
  },
  {
    id: 'ch-03',
    numberLabel: '03',
    title: '新規案件登録と議事録蓄積',
    durationHint: '約2分',
    talkingPoints: [
      '工程管理表の「新規案件を登録」から補助金テンプレートを選ぶと、案件専用の設問リストと必要書類リストが自動コピーされます。',
      '案件ワークスペースのタブ②では「テキスト直貼り」「ファイル読取」「GoogleドキュメントURL」の3方式で議事録を蓄積できます。',
    ],
    defaultTarget: { screen: 'dashboard' },
    steps: [
      {
        id: 'step-03-1',
        title: '新規案件登録ボタンを確認',
        description:
          '企業名とテンプレートを選択するだけで設問と必要書類が初期展開されます。',
        actionLabel: '新規案件登録ボタンを強調',
        guideId: 'guide-dashboard-add',
        specTag: '画面1 / No.4',
        target: { screen: 'dashboard' },
      },
      {
        id: 'step-03-2',
        title: '議事録登録フォーム（3つの入力方式）',
        description:
          'テキスト直貼り・ファイル・GoogleドキュメントURL（URLに error を入れると共有権限エラー表示テスト可）で議事録を登録できます。',
        actionLabel: 'タブ2 議事録フォームへ移動',
        guideId: 'guide-minutes-form',
        specTag: '画面3 / No.7',
        target: {
          screen: 'workspace',
          workspaceTab: 'minutes',
          projectId: 'PRJ-2026-002',
        },
      },
    ],
  },
  {
    id: 'ch-04',
    numberLabel: '04',
    title: '推測禁止抽出と不足→お客様待ち・依頼文連動',
    durationHint: '約4分',
    talkingPoints: [
      'AI抽出では「推測禁止ルール」を徹底しており、議事録にない数値・計画は絶対に創作せず「不足」として残します。',
      '不足になった設問はタブ①の「不足質問＆必要書類 回収リスト」へ自動同期され、そのまま顧客送付用メール文面をワンクリック生成できます。',
      '「チェック項目を一括で『依頼済』に変更」を押すと、案件の何待ち区分も自動で「お客様待ち」へ切り替わります。',
    ],
    defaultTarget: {
      screen: 'workspace',
      workspaceTab: 'minutes',
      projectId: 'PRJ-2026-002',
    },
    steps: [
      {
        id: 'step-04-1',
        title: '△△精密工業で「全議事録から抽出」を実行',
        description:
          '第1回議事録のみの状態から抽出を実行し、前半は根拠付きで回答生成、情報がない後半は推測禁止で「不足」となる動きを確認します。',
        actionLabel: 'AI生成コントロールへ移動',
        guideId: 'guide-minutes-ai',
        specTag: '画面3 / No.8〜9',
        target: {
          screen: 'workspace',
          workspaceTab: 'minutes',
          projectId: 'PRJ-2026-002',
        },
      },
      {
        id: 'step-04-2',
        title: '株式会社○○ タブ1で依頼文生成＆一括「依頼済」化',
        description:
          '未依頼の不足質問・必要書類にチェックを入れて「依頼文面を生成」→「一括で『依頼済（お客様待ち）』に変更」を試せます。',
        actionLabel: 'タブ1 依頼文生成パネルへ移動',
        guideId: 'guide-progress-generator',
        specTag: '画面2 / No.12〜14',
        target: {
          screen: 'workspace',
          workspaceTab: 'progress',
          projectId: 'PRJ-2026-001',
        },
      },
    ],
  },
  {
    id: 'ch-05',
    numberLabel: '05',
    title: '追加ヒアリングによる不足設問のみ再生成',
    durationHint: '約3分',
    talkingPoints: [
      'お客様から追加回答が届いたら、タブ②で追加議事録を登録し、「不足だった設問のみを再抽出・追記生成」を実行します。',
      '既に回答済み・手修正済みの設問には一切触れず、不足だった設問だけが「回答あり」へ昇格し、タブ①の対応項目も自動で「回収・回答済」になります。',
    ],
    defaultTarget: {
      screen: 'workspace',
      workspaceTab: 'minutes',
      projectId: 'PRJ-2026-001',
    },
    steps: [
      {
        id: 'step-05-1',
        title: 'サンプル2（追加ヒアリング）を登録して不足のみ再抽出',
        description:
          '株式会社○○のタブ②で「サンプル2: 追加ヒアリング回答を挿入」→「議事録を登録」→「不足だった設問のみを再抽出」を実行してみてください。',
        actionLabel: '株式会社○○ タブ2へ移動',
        guideId: 'guide-minutes-form',
        specTag: '画面3 / No.10',
        target: {
          screen: 'workspace',
          workspaceTab: 'minutes',
          projectId: 'PRJ-2026-001',
        },
      },
    ],
  },
  {
    id: 'ch-06',
    numberLabel: '06',
    title: '仮事業計画書の編集・審査3段階判定・コピー',
    durationHint: '約3分',
    talkingPoints: [
      'タブ③では回答根拠（どの議事録のどこから抽出したか）を照合しながら、各設問の文章を直接修正・保存できます。',
      '保存された設問には「手修正済」バッジが付き、以降の全抽出でも保護対象になります。',
      '「審査項目のカバー状況を判定（再判定）」で「十分記述されている」「記述が薄い」「未記載」の3段階診断と補強ヒントを確認できます。',
    ],
    defaultTarget: {
      screen: 'workspace',
      workspaceTab: 'draft',
      projectId: 'PRJ-2026-001',
    },
    steps: [
      {
        id: 'step-06-1',
        title: '審査項目・加点項目の3段階判定パネルを確認',
        description:
          '通常審査・加点項目ごとの充足レベルと補強ヒントを確認し、「再判定」ボタンで最新化できます。',
        actionLabel: '審査項目カバーパネルへ移動',
        guideId: 'guide-draft-criteria',
        specTag: '画面4 / No.15',
        target: {
          screen: 'workspace',
          workspaceTab: 'draft',
          projectId: 'PRJ-2026-001',
        },
      },
      {
        id: 'step-06-2',
        title: '設問別カード（文字数カウント・根拠照合・直接保存）',
        description:
          'リアルタイム文字数・推奨/上限チェックを確認しながら文章を修正・保存し、「手修正済」保護やコピー機能を試せます。',
        actionLabel: '設問カード一覧を強調',
        guideId: 'guide-draft-cards',
        specTag: '画面4 / No.11, 16',
        target: {
          screen: 'workspace',
          workspaceTab: 'draft',
          projectId: 'PRJ-2026-001',
        },
      },
    ],
  },
  {
    id: 'ch-07',
    numberLabel: '07',
    title: 'システム設定と本番化構成',
    durationHint: '約2分',
    talkingPoints: [
      '画面6では案件の進行ステージ（M_ProcessStatuses）の名称・順序・完了扱いフラグを現場運用に合わせて編集できます。',
      '標準処理用・高精度解析用のGeminiモデルを独立して切り替えられ、本番GAS環境ではAPIキーをスクリプトプロパティへ安全に格納します。',
    ],
    defaultTarget: { screen: 'settings' },
    steps: [
      {
        id: 'step-07-1',
        title: '工程ステータスマスタの編集',
        description:
          '既存案件で参照中のステータスを無効化しても表示名が壊れない安全設計を確認します。',
        actionLabel: '工程ステータスマスタへ移動',
        guideId: 'guide-settings-statuses',
        specTag: '画面6 / M_ProcessStatuses',
        target: { screen: 'settings' },
      },
      {
        id: 'step-07-2',
        title: 'Gemini AIモデル・APIキー設定ガイド',
        description:
          '標準モデル（gemini-2.5-flash）と高精度モデル（gemini-2.5-pro）の切替とスクリプトプロパティ設定手順を確認します。',
        actionLabel: 'Gemini AI設定を強調',
        guideId: 'guide-settings-gemini',
        specTag: '画面6 / Gemini設定',
        target: { screen: 'settings' },
      },
    ],
  },
];

/**
 * 機能・仕様書対応表（仕様書第2章・第4章 機能No.1〜16b）
 */
export const SPEC_CORRESPONDENCE_ROWS: SpecCorrespondenceRow[] = [
  {
    no: 'No.1',
    screenLabel: '画面5',
    featureName: '公募要領・申請様式 AI自動分解',
    summary: '公募要領PDF・申請様式から設問・審査基準・必要書類を抽出',
    guideId: 'guide-templates-ai',
    target: { screen: 'templates' },
  },
  {
    no: 'No.2',
    screenLabel: '画面5',
    featureName: 'テンプレート手動調整・確定保存',
    summary: '文字数設定・審査項目紐付け・並び替えとM_*シート確定保存',
    guideId: 'guide-templates-editor',
    target: { screen: 'templates' },
  },
  {
    no: 'No.3',
    screenLabel: '画面1',
    featureName: '工程管理表・停滞/期限監視',
    summary: '進行中フィルタ・何待ち・停滞日数・期限超過/間近アラート',
    guideId: 'guide-dashboard-table',
    target: { screen: 'dashboard' },
  },
  {
    no: 'No.4',
    screenLabel: '画面1',
    featureName: '新規案件登録（テンプレート展開）',
    summary: '補助金選択時に設問と必要書類を案件専用レコードへ自動複製',
    guideId: 'guide-dashboard-add',
    target: { screen: 'dashboard' },
  },
  {
    no: 'No.5〜6',
    screenLabel: '画面2',
    featureName: '案件ステータス・次アクション管理',
    summary: '工程/期限/何待ち区分の更新と最終更新日時の自動記録',
    guideId: 'guide-progress-form',
    target: { screen: 'workspace', workspaceTab: 'progress', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.7',
    screenLabel: '画面3',
    featureName: '議事録蓄積（3方式入力）',
    summary: 'テキスト直貼り・ファイル読取・GoogleドキュメントURL取込',
    guideId: 'guide-minutes-form',
    target: { screen: 'workspace', workspaceTab: 'minutes', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.8〜9',
    screenLabel: '画面3',
    featureName: '全議事録抽出＆推測禁止ルール',
    summary: '根拠引用付き抽出と情報不足設問の「不足」自動判定',
    guideId: 'guide-minutes-ai',
    target: { screen: 'workspace', workspaceTab: 'minutes', projectId: 'PRJ-2026-002' },
  },
  {
    no: 'No.10',
    screenLabel: '画面3',
    featureName: '不足設問のみの再抽出・追記',
    summary: '回答済・手修正済を保護し不足設問だけを追加議事録から補完',
    guideId: 'guide-minutes-ai',
    target: { screen: 'workspace', workspaceTab: 'minutes', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.11',
    screenLabel: '画面4',
    featureName: '根拠照合・文字数カウント表示',
    summary: '引用元議事録の展開表示と推奨/上限文字数リアルタイム監視',
    guideId: 'guide-draft-cards',
    target: { screen: 'workspace', workspaceTab: 'draft', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.12〜13',
    screenLabel: '画面2',
    featureName: '不足質問・必要書類統合リスト',
    summary: '不足設問の自動同期、書類追加、回収ステータス管理',
    guideId: 'guide-progress-requests',
    target: { screen: 'workspace', workspaceTab: 'progress', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.14',
    screenLabel: '画面2',
    featureName: '依頼文面生成＆一括依頼済更新',
    summary: '顧客送付用メール生成と選択項目の一括『依頼済（お客様待ち）』化',
    guideId: 'guide-progress-generator',
    target: { screen: 'workspace', workspaceTab: 'progress', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.15',
    screenLabel: '画面4',
    featureName: '審査項目3段階カバー判定',
    summary: '十分・薄い・未記載の診断と補強ヒント提示（再判定対応）',
    guideId: 'guide-draft-criteria',
    target: { screen: 'workspace', workspaceTab: 'draft', projectId: 'PRJ-2026-001' },
  },
  {
    no: 'No.16a/16b',
    screenLabel: '画面4',
    featureName: '設問別直接編集・手修正保護＆コピー',
    summary: '担当者の直接修正保存（手修正済バッジ）と個別/一括コピー',
    guideId: 'guide-draft-summary',
    target: { screen: 'workspace', workspaceTab: 'draft', projectId: 'PRJ-2026-001' },
  },
  {
    no: '管理',
    screenLabel: '画面6',
    featureName: '工程マスタ＆Geminiモデル管理',
    summary: '工程ステータス編集と標準/高精度モデルの切替・APIキー管理',
    guideId: 'guide-settings-statuses',
    target: { screen: 'settings' },
  },
];
