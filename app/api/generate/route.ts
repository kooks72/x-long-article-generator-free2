import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


const PATTERN_PROMPTS: Record<string, string> = {
    resolution: '「Solution」スタイル：読者が抱える特定の悩みや課題に対し、誠実かつ論理的な解決策を提示し、確かな価値を提供する構成で執筆してください。',
    story: '「Narrative」スタイル：普遍的なエピソードや自身の体験を交え、読者の心に深く寄り添いながら共感と学びを届ける構成で執筆してください。',
    contrarian: '「Paradigm Shift」スタイル：一般的な常識に対し、本質的な問いを投げかけることで、読者に新しい視点と衝撃を与える構成で執筆してください。',
    list: '「Roadmap」スタイル：複雑な情報やノウハウを、実践的で体系的なステップとして整理し、読者が迷わず行動できる構成で執筆してください。',
    data: '「Data-Driven」スタイル：客観的な事実やデータに基づき、表面的な理解を超えた深い洞察と信頼性を届ける構成で執筆してください。',
};

async function fetchUrlContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) return '';
        const html = await response.text();
        // スクリプト、スタイル、HTMLタグを削除してテキストのみを抽出
        const cleanContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return cleanContent.substring(0, 6000); // プロンプトの制限を考慮して6000文字程度に制限
    } catch (error) {
        console.error('Fetch error:', error);
        return '';
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { platform, theme, target, purpose, tools, service, price, pattern, referenceUrl, sourceText } = body;
        const requestApiKey = body.apiKey;

        // APIキーの選定：リクエストボディのキーを優先し、なければ環境変数を使用
        let finalApiKey = requestApiKey || process.env.GEMINI_API_KEY || '';

        // 複数のAPIキーが入力されている場合（カンマまたは改行区切り）、ランダムに1つ選択
        if (finalApiKey.includes(',') || finalApiKey.includes('\n')) {
            const keys = finalApiKey.split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean);
            if (keys.length > 0) {
                finalApiKey = keys[Math.floor(Math.random() * keys.length)];
            }
        }

        // 必須チェックの緩和：referenceUrl または sourceText がある場合はtheme/targetは任意
        if (!referenceUrl && !sourceText && (!theme || !target)) {
            return NextResponse.json({ error: '参考URL、ソーステキスト、またはコアメッセージと届けたい相手の入力が必要です' }, { status: 400 });
        }

        let contentToUse = sourceText || '';
        if (!contentToUse && referenceUrl) {
            contentToUse = await fetchUrlContent(referenceUrl);
        }

        // パターンの決定
        let patternPrompt = pattern === 'auto' || !PATTERN_PROMPTS[pattern]
            ? 'テーマと対象読者に最も適したスタイル（Solution、Narrative、Paradigm Shift、Roadmap、Data-Drivenのいずれか）をあなた自身で判断し、そのエッセンスを最大限に活かして執筆してください。'
            : PATTERN_PROMPTS[pattern];

        // プラットフォーム別の構成指示
        let platformInstructions = platform === 'note'
            ? `
【note 向け構成指示】
「読ませる」ことに特化した、以下の構成で出力してください：
1. 魅力的な大見出し（タイトル案を3つ程度）
2. まえがき（読者の期待を高めるリード文）
3. 目次構造（## 見出しを活用）
4. 本文（各章を非常に濃密に記述）
5. あとがき（著者からのメッセージと、読後の余韻を大切にする結び）
`
            : `
【X (Twitter) 向け構成指示】
読者の指を止める、以下の構成で出力してください：
1. 冒頭的強烈なフック（140文字以内で、物語の核心を突く）
2. 本文（1万文字規模の圧倒的な熱量と情報量）
3. インサイト：各見出し（##）の冒頭に、必ず読者の思考を深める1〜2行のメッセージを挿入すること。
`;

        // 詳細情報の反映指示
        const detailPrompt = `
【補足情報】
${tools ? `- 活用しているツール・手段: ${tools}` : ''}
${service ? `- 提案したい解決策・サービス: ${service}` : ''}
${price ? `- 価値提供の目安: ${price}` : ''}

これらの情報を、文脈に合わせて自然かつ誠実に組み込んでください。
`;

        const sourcePrompt = contentToUse ? `
【提供されたソースコンテンツ】
以下のコンテンツを分析し、そのエッセンス（主張、事実、データ、インサイト）を完全に吸収した上で、指定されたスタイルとターゲットに合わせて、新しく独創的な1万文字の原稿として再構成（リライト・拡張）してください：
---
${contentToUse}
---
` : '';

        const systemPrompt = `
あなたは、クリエイターの思考を体系化し、読者の人生に影響を与える言葉を紡ぐプロのコンテンツアーキテクトです。
${contentToUse ? '提供されたソースコンテンツを深く理解し、' : ''}ターゲット読者に対して、本質的な価値と信頼を届ける1万文字規模の原稿を執筆してください。

【共通の指針】
- 言語: 日本語
- トーン: 誠実、知的、深い洞察。過度な煽りは避け、言葉の質で勝負すること。
- 文字数: **1万文字規模**を目指し、一文字一文字に価値を込めること。
- 形式: マークダウン形式。

【執筆の核】
- メッセージ（テーマ）: ${theme || 'ソースコンテンツから抽出した核心'}
- 届けたい相手: ${target || 'ソースコンテンツが想定する、あるいは最も恩恵を受ける読者層'}
- 読後のゴール: ${purpose || '読者の心に深く残り、信頼が醸成されること'}
${detailPrompt}
${sourcePrompt}

【構成のアプローチ】
${patternPrompt}
${platformInstructions}

それでは、読者の本棚に一生残るような、圧倒的な品質の1万文字原稿を執筆してください。
`;

        if (!finalApiKey) {
            console.warn('APIキーが未設定です。');
            return NextResponse.json({
                content: `【テストモード】
# ${theme || '再構成原稿'}
（APIキーが未設定のため、デモ用構成を表示しています）

## 【引き戻しフック】「この真実を知らないだけで、あなたは機会損失をしています。」
${contentToUse ? `提供されたソース内容（${contentToUse.substring(0, 50)}...）を基に執筆された記事です。` : `ターゲット読者(${target})に向けた、${pattern}パターンの記事です。`}
${service ? `おすすめ商品: ${service} (${price})` : ''}
${tools ? `推奨ツール: ${tools}` : ''}
`,
                pattern: pattern
            });
        }

        try {
            const genAIInstance = new GoogleGenerativeAI(finalApiKey);
            const modelName = 'gemini-1.5-flash';
            const model = genAIInstance.getGenerativeModel({ model: modelName });

            console.log(`Generating article with ${modelName} for ${theme || referenceUrl || 'direct text'}`);
            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();

            if (!text) {
                throw new Error('AIからの応答が空でした。');
            }

            return NextResponse.json({ content: text });
        } catch (apiError: any) {
            console.error('Gemini API Error (Full):', apiError);
            let message = '記事の生成中にエラーが発生しました。APIキーが無効か、一時的なネットワークエラーの可能性があります。';
            
            if (apiError.message?.includes('404')) {
                message = `指定されたモデル (gemini-1.5-flash) が見つかりません。APIキーの権限を確認してください。`;
            } else if (apiError.message?.includes('429')) {
                message = 'リクエスト上限に達しました。しばらく待ってから再試行してください。';
            } else if (apiError.message?.includes('API key not valid')) {
                message = 'APIキーが無効です。正しいキーを入力してください。';
            }
            
            return NextResponse.json({ 
                error: `${message} (詳細: ${apiError.message})` 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
