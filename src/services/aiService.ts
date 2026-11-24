import {
  AnswerEvidence,
  CriteriaCoverageItem,
  CriteriaCoverageLevel,
  MQuestion,
  MRequiredDoc,
  MReviewCriterion,
  TMinute,
  TProject,
  TQuestionAnswer,
} from '../types';

export interface FileExtractResult {
  ok: boolean;
  extractedText: string;
  suggestedTitle: string;
  errorMessage?: string;
}

export interface DecomposedTemplateDraft {
  subsidyName: string;
  roundName: string;
  defaultDeadlineDays: number;
  criteria: Omit<MReviewCriterion, 'subsidy_id'>[];
  questions: Omit<MQuestion, 'subsidy_id'>[];
  requiredDocs: Omit<MRequiredDoc, 'subsidy_id'>[];
}

/**
 * 1. ファイル / GoogleドキュメントURLからのテキスト抽出（モック）
 */
export async function extractTextFromSource(input: {
  file?: File | null;
  gdocUrl?: string;
}): Promise<FileExtractResult> {
  await new Promise((r) => setTimeout(r, 450));

  if (input.file) {
    const file = input.file;
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.txt')) {
      const content = await file.text();
      return {
        ok: true,
        extractedText: content,
        suggestedTitle: file.name.replace(/\.txt$/i, ''),
      };
    }

    return {
      ok: true,
      suggestedTitle: file.name.replace(/\.[^.]+$/, ''),
      extractedText: `【ファイル「${file.name}」からテキストを抽出しました（モック）】
・企業体制：高精度生産設備を保有し、取引先からの信頼が厚い。
・課題：多品種少量化に伴う段取り替え工数の増加と納期対応が課題。
・設備投資：新規設備の導入により生産能力を1.4倍に引き上げ、納期を半減する。
・販売見通し：既存顧客2社から増産要望があり、月平均8ロット・年間96ロットの受注見込み。
・賃上げ目標：付加価値額年率4.5％増、1人あたり給与年率6.0％以上の引き上げを計画。
・加点項目：事業継続力強化計画（BCP）認定取得済み。`,
    };
  }

  const url = (input.gdocUrl || '').trim();
  if (!url) {
    return {
      ok: false,
      extractedText: '',
      suggestedTitle: '',
      errorMessage: 'Googleドキュメント／ドライブのURLを入力してください。',
    };
  }

  if (url.toLowerCase().includes('error')) {
    return {
      ok: false,
      extractedText: '',
      suggestedTitle: '',
      errorMessage: 'アクセス権限がありません。共有設定を確認してください。',
    };
  }

  return {
    ok: true,
    suggestedTitle: 'Googleドキュメント取込議事録',
    extractedText: `【URL「${url}」からGoogleドキュメント本文を抽出しました（モック）】
・ヒアリング記録：新規投資および販売拡大・賃上げ方針について顧客と合意。
・ターゲット顧客：製造業・半導体関連の既存取引先および新規開拓先。
・販売数量：初年度月7ロット、3年後月10ロットを目標とし、推進プロジェクトチーム6名体制で稼働予定。
・数値計画：付加価値額年率4.8％向上、給与支給総額3.5％増・1人あたり賃上げ率6.2％を実施予定。
・加点認定：パートナーシップ構築宣言登録済み、BCP認定取得済み。`,
  };
}

/**
 * 2. 公募要領・申請様式のAI自動分解（画面5用）
 */
export async function decomposeGuidelineAndForms(params: {
  guidelineFileName: string;
  formFileName: string;
  model: string;
}): Promise<DecomposedTemplateDraft> {
  await new Promise((r) => setTimeout(r, 1400));

  const criteria: Omit<MReviewCriterion, 'subsidy_id'>[] = [
    {
      criteria_id: 'CRT-AI-1',
      sort_order: 1,
      criteria_type: 'review',
      criteria_name: '技術・サービスの革新性と業務課題の解消度',
      description: '省力化・デジタル化・先端設備導入による生産性向上の技術的妥当性とボトルネック解消効果。',
    },
    {
      criteria_id: 'CRT-AI-2',
      sort_order: 2,
      criteria_type: 'review',
      criteria_name: '市場ニーズ・販売計画と実施体制の確実性',
      description: 'ターゲット市場の成長性、顧客獲得根拠、導入スケジュールおよび社内推進体制の具体性。',
    },
    {
      criteria_id: 'CRT-AI-3',
      sort_order: 3,
      criteria_type: 'review',
      criteria_name: '付加価値額拡大・持続的賃上げ目標の妥当性',
      description: '事業期間終了後の付加価値額年率3〜4%以上および従業員給与引き上げ計画の実現性。',
    },
    {
      criteria_id: 'CRT-AI-4',
      sort_order: 4,
      criteria_type: 'bonus',
      criteria_name: '政策加点（大幅賃上げ・BCP・パートナーシップ宣言）',
      description: '事業継続力強化計画認定、パートナーシップ構築宣言、大幅賃上げ特例等の該当状況。',
    },
  ];

  const questions: Omit<MQuestion, 'subsidy_id'>[] = [
    {
      question_id: 'Q-AI-1',
      sort_order: 1,
      section_name: '1. 企業の現状と強み',
      question_title: '1-1. 事業概要および既存事業の競争優位性',
      question_guide: '主要製品・取引先・保有設備・認証実績等を踏まえた自社の強みを整理してください。',
      recommended_chars: 400,
      max_chars: 600,
      linked_criteria_ids: ['CRT-AI-1'],
    },
    {
      question_id: 'Q-AI-2',
      sort_order: 2,
      section_name: '1. 企業の現状と強み',
      question_title: '1-2. 解決すべき現場課題と投資の背景',
      question_guide: '労働生産性・納期・人手不足など定量的課題を提示してください。',
      recommended_chars: 450,
      max_chars: 750,
      linked_criteria_ids: ['CRT-AI-1', 'CRT-AI-2'],
    },
    {
      question_id: 'Q-AI-3',
      sort_order: 3,
      section_name: '2. 補助事業の内容',
      question_title: '2-1. 導入設備・システムの概要と技術的革新性',
      question_guide: '型番・投資額・自動化や省力化につながる具体的メカニズムを明記してください。',
      recommended_chars: 600,
      max_chars: 1000,
      linked_criteria_ids: ['CRT-AI-1'],
    },
    {
      question_id: 'Q-AI-4',
      sort_order: 4,
      section_name: '3. 事業化・スケジュール',
      question_title: '3-1. 販売計画・ターゲット市場と推進体制',
      question_guide: '想定顧客・単価・数量根拠および設備発注から稼働開始までの月次計画を記載してください。',
      recommended_chars: 500,
      max_chars: 800,
      linked_criteria_ids: ['CRT-AI-2'],
    },
    {
      question_id: 'Q-AI-5',
      sort_order: 5,
      section_name: '4. 数値目標・加点',
      question_title: '4-1. 付加価値額・賃上げ計画と加点への取り組み',
      question_guide: '3〜5年間の付加価値額・給与増加率目標およびBCP等の認定取得状況を明記してください。',
      recommended_chars: 450,
      max_chars: 700,
      linked_criteria_ids: ['CRT-AI-3', 'CRT-AI-4'],
    },
  ];

  const requiredDocs: Omit<MRequiredDoc, 'subsidy_id'>[] = [
    {
      doc_template_id: 'D-AI-1',
      sort_order: 1,
      doc_name: '直近3期分の決算書・確定申告書別表一',
      note: `「${params.guidelineFileName || '公募要領'}」P.18指定の様式にてPDF提出。`,
    },
    {
      doc_template_id: 'D-AI-2',
      sort_order: 2,
      doc_name: '導入予定設備の相見積書（2社以上）',
      note: '税抜50万円以上の設備導入は同一仕様での2社見積が必須。',
    },
    {
      doc_template_id: 'D-AI-3',
      sort_order: 3,
      doc_name: '賃金台帳・労働者名簿（直近事業年度分）',
      note: '給与支給総額と最低賃金水準の確認書類。',
    },
    {
      doc_template_id: 'D-AI-4',
      sort_order: 4,
      doc_name: '加点項目証明書類（BCP認定通知書・宣言受理票等）',
      note: '該当加点項目を申請する場合のみ提出。',
    },
  ];

  return {
    subsidyName: params.guidelineFileName.includes('省力化')
      ? 'ものづくり・省力化支援補助金'
      : '新規公募補助金（AI分解取込）',
    roundName: '第20次公募',
    defaultDeadlineDays: 40,
    criteria,
    questions,
    requiredDocs,
  };
}

/** 議事録から該当抜粋を1〜2文取り出すヘルパー */
function pickQuoteFromMinute(minute: TMinute, keywords: string[]): string {
  const lines = minute.content_text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && !l.startsWith('【'));

  for (const kw of keywords) {
    const found = lines.find((l) => l.includes(kw));
    if (found) return found.slice(0, 140);
  }
  return (lines[0] || minute.content_text.slice(0, 100)).slice(0, 140);
}

/** 追加ヒアリング等の充実情報が含まれるか判定 */
function hasAdditionalComprehensiveInfo(minutes: TMinute[]): boolean {
  if (minutes.length >= 2) return true;
  const joined = minutes.map((m) => m.content_text).join('\n');
  const hasConcreteQty =
    joined.includes('月平均') ||
    joined.includes('年間84') ||
    joined.includes('年間96') ||
    joined.includes('月7ロット');
  const hasConcreteWage =
    joined.includes('年率') &&
    (joined.includes('4.') || joined.includes('6.') || joined.includes('3.5'));
  const hasConcreteBonus =
    joined.includes('認定取得済') ||
    joined.includes('認定を取得済') ||
    joined.includes('登録公表');
  return hasConcreteQty && hasConcreteWage && hasConcreteBonus;
}

/** 設問に応じたドラフト文章を生成（推測禁止ルール準拠） */
function buildDraftTextForQuestion(
  project: TProject,
  question: MQuestion,
  minutes: TMinute[],
  isSecondStage: boolean
): string {
  const joined = minutes.map((m) => m.content_text).join('\n');
  const qIdx = question.sort_order;
  const company = project.client_name;

  // 案件1（株式会社○○）やものづくり系のキーワードがある場合
  if (joined.includes('5軸') || joined.includes('精密金属') || project.subsidy_id === 'sub-monozukuri-19') {
    if (qIdx === 1) {
      return `${company}は1988年創業の精密金属加工メーカー（従業員48名、本社工場・第二工場の2拠点体制）である。産業用ロボット向け超精密ギアおよび半導体製造装置用アルミ・チタン切削部品を主力とし、大手装置メーカー3社と20年以上の直接取引実績を有する。±0.005mmの公差保証加工技術と三次元測定機による全数検査体制が強みである。`;
    }
    if (qIdx === 2) {
      return `近年、半導体製造装置の次世代モデル向けに5軸同時加工が必要な複雑形状部品の引き合いが急増しているが、既存の3軸マシニングセンタでは1ワークあたり段取り替えが4回発生し、加工リードタイムが14日に長期化している。顧客の短納期要求（5日以内）に応えられず失注が生じているほか、熟練工の残業負荷も月45時間超に達しており、工程集約と自動化による生産性抜本改善が急務となっている。`;
    }
    if (qIdx === 3) {
      return `本事業では自動化パレットチェンジャー付き同時5軸制御マシニングセンタを2台導入する（設備投資額8,400万円）。従来3軸機で4回を要した段取り替えを1回へ集約し、加工誤差を抑制して精度を±0.002mmへ引き上げる。さらに自動パレット交換による夜間無人連続稼働を組み合わせることで、リードタイムを14日から4日へと大幅に短縮し、高品質・短納期の供給体制を確立する。`;
    }
    if (qIdx === 4 && isSecondStage) {
      return `ターゲット顧客は既存の半導体装置大手2社および新規開拓中の医療機器メーカー3社（うち2社から試作引き合い受領済）である。販売単価は1ロット525万円を想定し、初年度は月平均7ロット（年間84ロット・売上約4.4億円）、3年後には月平均10ロット（年間120ロット・売上6.3億円）を計画している。交付決定後2か月で設備発注、6か月目に据付・試運転を完了し、7か月目から量産出荷を開始する。推進体制は製造部長をリーダーに専任オペレーター3名・営業2名の計6名体制で実行する。`;
    }
    if (qIdx === 5 && isSecondStage) {
      return `本設備投資の回収期間は約3.8年を見込んでいる。生産性向上と高付加価値部品の受注拡大により、付加価値額は年率平均4.8％以上（3年後には基準年度比1.15倍以上）を達成する計画である。創出された利益を従業員へ還元するため、給与支給総額を年率平均3.5％以上増加させるとともに、1人あたり平均賃上げ率年率6.2％（賞与還元およびベースアップ）、事業場内最低賃金も地域別最低賃金＋55円以上へと継続的に引き上げる。`;
    }
    if (qIdx === 6 && isSecondStage) {
      return `当社は中小企業庁の「事業継続力強化計画（BCP）」について認定を取得済みであり、自然災害等のリスク発生時にもサプライチェーン供給責任を果たす体制を整備している。また「パートナーシップ構築宣言」を登録公表済みであり、取引先との適正な価格転嫁・共存共栄を推進している。さらに本事業では給与支給総額の大幅引き上げ計画に基づく「大幅な賃上げに係る加点（特例）」にも申請する方針である。`;
    }
  }

  // 案件2（△△精密工業）や新事業進出・汎用テンプレートの場合
  if (qIdx === 1) {
    return `${company}は金型設計・精密加工分野で培った高い技術力と顧客基盤を強みとしている。${pickQuoteFromMinute(minutes[0], ['強み', '実績', '金型', '事業'])}こうした既存コア技術を基盤に、新たな成長市場への展開を図るため本事業を計画した。`;
  }
  if (qIdx === 2) {
    return `市場環境の変化や既存領域の成熟化を背景に、新規事業分野での高付加価値な製品・サービス提供が急務となっている。${pickQuoteFromMinute(minutes[0], ['新事業', '課題', 'ターゲット', '市場', 'CFRP'])}既存顧客からの技術評価を足掛かりに、迅速な市場投入を目指す。`;
  }
  if (qIdx === 3) {
    return `本事業では専門性の高い新規設備・システムを導入し、高精度かつ効率的な生産・提供プロセスを構築する。${pickQuoteFromMinute(minutes[0], ['導入', '設備', '投資', 'オートクレーブ'])}これにより従来の制約を解消し、競合に対する明確な優位性を確立する。`;
  }
  if (isSecondStage) {
    return `【追加ヒアリング反映】${question.question_title}について、ヒアリング回答に基づき具体的な目標値・スケジュール・推進体制を整理した。${pickQuoteFromMinute(minutes[minutes.length - 1], ['販売', '賃上げ', '付加価値', 'BCP', 'スケジュール', '加点'])}これらを計画期間内に確実に実行し、継続的な事業成長と従業員への賃金還元を両立する。`;
  }

  return '';
}

/** 設問ごとの不足理由テキスト */
function buildMissingReason(question: MQuestion): string {
  if (question.question_title.includes('販売計画') || question.sort_order === 4) {
    return '想定販売数量（月/年ロット数）、ターゲット顧客内訳、導入〜量産までのスケジュール・体制に関する具体情報が議事録に不足しています。';
  }
  if (question.question_title.includes('賃上げ') || question.question_title.includes('数値') || question.sort_order === 5) {
    return '付加価値額の年率目標、給与支給総額・1人あたり賃上げ率（％）、投資回収見込みの具体数値が議事録にないため推測生成しませんでした。';
  }
  if (question.question_title.includes('加点') || question.sort_order === 6) {
    return 'BCP認定・パートナーシップ構築宣言・賃上げ特例・DX/GX認定等の取得有無について議事録に記載がありません。';
  }
  return `「${question.question_title}」を根拠付きで記述するための具体情報が現在の議事録に見当たらないため、推測で埋めず不足としています。`;
}

/**
 * 3. 全議事録からの回答抽出＆推測禁止ルール（画面3用）
 */
export async function extractAllAnswersFromMinutes(params: {
  project: TProject;
  questions: MQuestion[];
  minutes: TMinute[];
  existingAnswers: TQuestionAnswer[];
  protectManualEdits: boolean;
}): Promise<{
  answers: TQuestionAnswer[];
  answeredCount: number;
  insufficientCount: number;
  skippedManualCount: number;
}> {
  await new Promise((r) => setTimeout(r, 900));

  const nowIso = new Date().toISOString();
  const hasFullInfo = hasAdditionalComprehensiveInfo(params.minutes);
  const sortedQuestions = [...params.questions].sort((a, b) => a.sort_order - b.sort_order);

  // 初回議事録のみの場合は前半3問（全5問なら3問、全6問なら3問）のみ回答し、残りは推測禁止で不足とする
  const answerableLimit = hasFullInfo
    ? sortedQuestions.length
    : Math.min(3, Math.max(1, sortedQuestions.length - 2));

  let answeredCount = 0;
  let insufficientCount = 0;
  let skippedManualCount = 0;

  const nextAnswers: TQuestionAnswer[] = sortedQuestions.map((q, idx) => {
    const existing = params.existingAnswers.find((a) => a.template_question_id === q.question_id);

    if (params.protectManualEdits && existing?.is_manual_edited) {
      skippedManualCount += 1;
      if (existing.answer_status === 'answered') answeredCount += 1;
      else insufficientCount += 1;
      return existing;
    }

    if (params.minutes.length === 0) {
      insufficientCount += 1;
      return {
        answer_id: existing?.answer_id || `ANS-${params.project.project_id}-${q.sort_order}`,
        project_id: params.project.project_id,
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
        missing_reason: '議事録が1件も登録されていません。ヒアリング議事録を登録してから再実行してください。',
        updated_at: nowIso,
      };
    }

    const canAnswer = idx < answerableLimit;
    if (!canAnswer) {
      insufficientCount += 1;
      return {
        answer_id: existing?.answer_id || `ANS-${params.project.project_id}-${q.sort_order}`,
        project_id: params.project.project_id,
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
        missing_reason: buildMissingReason(q),
        updated_at: nowIso,
      };
    }

    const isSecondStagePart = idx >= 3;
    const sourceMinute =
      isSecondStagePart && params.minutes.length >= 2
        ? params.minutes[params.minutes.length - 1]
        : params.minutes[0];

    const draftText = buildDraftTextForQuestion(params.project, q, params.minutes, true);
    const quoteKeywords =
      idx === 0
        ? ['創業', '精密', '強み', '金型', '主力']
        : idx === 1
          ? ['課題', 'リードタイム', '段取り', '失注', 'CFRP', '新事業']
          : idx === 2
            ? ['5軸', '導入', '投資', '短縮', 'オートクレーブ']
            : idx === 3
              ? ['ロット', '販売', 'スケジュール', '体制']
              : idx === 4
                ? ['賃上げ', '付加価値', '最低賃金', '回収']
                : ['BCP', 'パートナーシップ', '加点', '認定'];

    const evidence: AnswerEvidence = {
      minute_id: sourceMinute.minute_id,
      source_label: sourceMinute.source_title,
      recorded_date: sourceMinute.recorded_date,
      quote: pickQuoteFromMinute(sourceMinute, quoteKeywords),
    };

    answeredCount += 1;
    return {
      answer_id: existing?.answer_id || `ANS-${params.project.project_id}-${q.sort_order}`,
      project_id: params.project.project_id,
      template_question_id: q.question_id,
      sort_order: q.sort_order,
      section_name: q.section_name,
      question_title: q.question_title,
      recommended_chars: q.recommended_chars,
      max_chars: q.max_chars,
      linked_criteria_ids: q.linked_criteria_ids,
      answer_status: 'answered',
      draft_text: draftText,
      is_manual_edited: false,
      evidences: [evidence],
      missing_reason: '',
      updated_at: nowIso,
    };
  });

  return {
    answers: nextAnswers,
    answeredCount,
    insufficientCount,
    skippedManualCount,
  };
}

/**
 * 4. 不足設問のみの再抽出・追記生成（画面3用）
 * - answer_status === 'insufficient' かつ is_manual_edited === false のみを対象
 * - 既に answered / 手修正済は絶対に変更しない
 */
export async function reExtractInsufficientAnswers(params: {
  project: TProject;
  questions: MQuestion[];
  minutes: TMinute[];
  existingAnswers: TQuestionAnswer[];
}): Promise<{
  answers: TQuestionAnswer[];
  newlyAnsweredIds: string[];
  stillInsufficientCount: number;
  keptInsufficientByNoInfo: boolean;
}> {
  await new Promise((r) => setTimeout(r, 750));

  const nowIso = new Date().toISOString();
  const hasFullInfo = hasAdditionalComprehensiveInfo(params.minutes);

  if (!hasFullInfo) {
    const stillCount = params.existingAnswers.filter((a) => a.answer_status === 'insufficient').length;
    return {
      answers: params.existingAnswers,
      newlyAnsweredIds: [],
      stillInsufficientCount: stillCount,
      keptInsufficientByNoInfo: true,
    };
  }

  const latestMinute = params.minutes[params.minutes.length - 1];
  const newlyAnsweredIds: string[] = [];

  const nextAnswers = params.existingAnswers.map((ans) => {
    // 既に回答あり、または手修正済は絶対に変更しない
    if (ans.answer_status === 'answered' || ans.is_manual_edited) {
      return ans;
    }

    const q = params.questions.find((item) => item.question_id === ans.template_question_id);
    if (!q) return ans;

    const draftText = buildDraftTextForQuestion(params.project, q, params.minutes, true);
    if (!draftText) return ans;

    const quoteKeywords =
      q.sort_order === 4
        ? ['ロット', '販売', 'スケジュール', '体制']
        : q.sort_order === 5
          ? ['賃上げ', '付加価値', '最低賃金', '回収']
          : ['BCP', 'パートナーシップ', '加点', '認定'];

    const evidence: AnswerEvidence = {
      minute_id: latestMinute.minute_id,
      source_label: latestMinute.source_title,
      recorded_date: latestMinute.recorded_date,
      quote: pickQuoteFromMinute(latestMinute, quoteKeywords),
    };

    newlyAnsweredIds.push(ans.answer_id);
    return {
      ...ans,
      answer_status: 'answered' as const,
      draft_text: draftText,
      evidences: [evidence],
      missing_reason: '',
      updated_at: nowIso,
    };
  });

  const stillInsufficientCount = nextAnswers.filter((a) => a.answer_status === 'insufficient').length;

  return {
    answers: nextAnswers,
    newlyAnsweredIds,
    stillInsufficientCount,
    keptInsufficientByNoInfo: false,
  };
}

/**
 * 5. 審査項目・加点項目の3段階意味判定（画面4用）
 */
export async function evaluateCriteriaCoverage(params: {
  criteria: MReviewCriterion[];
  answers: TQuestionAnswer[];
}): Promise<CriteriaCoverageItem[]> {
  await new Promise((r) => setTimeout(r, 650));

  const nowIso = new Date().toISOString();

  return [...params.criteria]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((criterion) => {
      const linkedAnswers = params.answers.filter((a) =>
        a.linked_criteria_ids.includes(criterion.criteria_id)
      );

      const answeredLinked = linkedAnswers.filter(
        (a) => a.answer_status === 'answered' && a.draft_text.trim().length > 0
      );

      if (linkedAnswers.length === 0 || answeredLinked.length === 0) {
        return {
          criteria_id: criterion.criteria_id,
          criteria_name: criterion.criteria_name,
          criteria_type: criterion.criteria_type,
          level: 'missing' as CriteriaCoverageLevel,
          reason: `紐づく設問（${linkedAnswers.map((a) => `Q${a.sort_order}`).join('・') || '対象設問'}）が未回答または未記述のため、審査観点「${criterion.criteria_name}」の裏付けがありません。`,
          hint: `${criterion.description} に関する具体事実をヒアリングし、該当設問へ追記してください。`,
          evaluated_at: nowIso,
        };
      }

      const hasInsufficientLinked = linkedAnswers.some((a) => a.answer_status === 'insufficient');
      const totalChars = answeredLinked.reduce((sum, a) => sum + a.draft_text.trim().length, 0);
      const minSubstantialChars = Math.min(
        180,
        Math.round(
          answeredLinked.reduce((sum, a) => sum + a.recommended_chars, 0) * 0.35
        )
      );

      if (hasInsufficientLinked || totalChars < Math.max(100, minSubstantialChars)) {
        const missingTitles = linkedAnswers
          .filter((a) => a.answer_status === 'insufficient')
          .map((a) => `Q${a.sort_order}`)
          .join('・');
        return {
          criteria_id: criterion.criteria_id,
          criteria_name: criterion.criteria_name,
          criteria_type: criterion.criteria_type,
          level: 'weak' as CriteriaCoverageLevel,
          reason: hasInsufficientLinked
            ? `一部設問には記述がありますが、連動する ${missingTitles} が不足しているため審査観点の説明が片手落ちになっています。`
            : `記述文字数（${totalChars}文字）が推奨水準に対して少なく、具体的な数値根拠・裏付けがやや薄い状態です。`,
          hint: `「${criterion.description}」に沿って、定量数値（件数・％・期間）や推進体制を補強してください。`,
          evaluated_at: nowIso,
        };
      }

      return {
        criteria_id: criterion.criteria_id,
        criteria_name: criterion.criteria_name,
        criteria_type: criterion.criteria_type,
        level: 'sufficient' as CriteriaCoverageLevel,
        reason: `連動する設問（${answeredLinked.map((a) => `Q${a.sort_order}`).join('・')}・計${totalChars}文字）にて、審査観点「${criterion.criteria_name}」に必要な具体的根拠が十分に記述されています。`,
        hint: '現在の記述で評価観点をカバーできています。申請直前に数値の整合性のみ最終確認してください。',
        evaluated_at: nowIso,
      };
    });
}
