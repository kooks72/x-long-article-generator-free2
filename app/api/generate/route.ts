import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 2000
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        const isRetryable = error.message?.includes('429') || error.status === 429 || error.status === 503;
        if (retries > 0 && isRetryable) {
            console.log(`API Error (Status: ${error.status}). Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keyword, worries, affiliateUrl, apiKey: requestApiKey, linkPlacement } = body;
        const isMiddleLink = linkPlacement === 'middle';

        // APIキーの選定
        let finalApiKey = requestApiKey || '';
        if (finalApiKey.includes(',') || finalApiKey.includes('\n')) {
            const keys = finalApiKey.split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean);
            if (keys.length > 0) {
                finalApiKey = keys[Math.floor(Math.random() * keys.length)];
            }
        }

        if (!finalApiKey) {
            return NextResponse.json({
                error: 'Gemini APIキーを入力してください。'
            }, { status: 401 });
        }

        if (!keyword || !worries) {
            return NextResponse.json({ error: 'キーワードと悩みを入力してください' }, { status: 400 });
        }

        const systemPrompt = `
あなたはプロのセールスライター兼、心理カウンセラーです。
提供された「キーワード」と「ターゲットの悩み」に基づいて、電話占いの無料登録へ誘導するためのSEOブログ記事を生成してください。

【入力情報】
メインキーワード: ${keyword}
ターゲットの悩み・状況: ${worries}
誘導先URL: ${affiliateUrl || 'https://e-kantei.net/lp/news_10018/'}

【記事構成のルール（PASONAの法則）】
1. タイトル：思わずクリックしたくなる魅力的なタイトル（30文字前後）
2. 導入（Problem/Agitation）：ターゲットの悩みに深く共感し、「このままでは状況が悪化するかもしれない」という危機感を優しく煽る。
3. 見出し1?3（Solution）：悩みを解決するための一般的なアドバイスと、スピリチュアルな視点（縁、タイミング、相手の深層心理など）を交えた解説（各見出しごとにh2タグを使用）。
${isMiddleLink ? '   ※ 見出し2の直後など、読者の興味が高まったタイミングで「まずは無料で相談してみる」といった自然な文脈を作り、アフィリエイトURLへのテキストリンクまたはボタン（後述のスタイル）を1箇所挿入してください。' : ''}
4. 事例紹介：同じような悩みを持っていた人が、第三者（占い師）に相談して状況が好転した「よくあるケーススタディ」を1つ挿入（h3タグを使用）。
5. 結論と誘導（Narrowing down/Action）：「一人で抱え込まず、プロの占い師に現状を透視してもらうことで道が開ける」という結論へ導く。
6. CTA：最後に、提供されたアフィリエイトURLへのリンクボタンを配置する。「初回無料特典を使って相談してみる」といったクリックしたくなるマイクロコピーを添えること。

【出力形式】
- WordPressに直接貼り付けられるHTML形式で出力してください。
- Markdown記法（\`\`\`html や # など）は一切使用しないでください。
- <h1>, <h2>, <h3>, <p>, <ul>, <li>, <a href="..."> などの適切なHTMLタグのみを使用してください。
- すべてのリンク（<a>タグ）には、必ず target="_blank" rel="nofollow noopener" を付与してください。
- CTAのリンクボタンは、<a href="${affiliateUrl}" target="_blank" rel="nofollow noopener" style="background-color: #ff4500; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"> という形式で、目立つように作成してください。
`;

        try {
            const genAIInstance = new GoogleGenerativeAI(finalApiKey);
            const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ];

            // フォールバック付きの生成ロジック（しらみつぶしに試行）
            let response;
            let lastError;
            const modelsToTry = [
                'gemini-3.1-flash-lite-preview',
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash-latest',
                'gemini-1.5-flash',
                'gemini-pro'
            ];

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting generation with model: ${modelName}`);
                    const model = genAIInstance.getGenerativeModel({ 
                        model: modelName,
                        safetySettings
                    });
                    const result = await withRetry(() => model.generateContent(systemPrompt));
                    response = await result.response;
                    if (response) break; // 成功したら抜ける
                } catch (err: any) {
                    console.warn(`Model ${modelName} failed/not found:`, err.message);
                    lastError = err;
                    continue; // 次のモデルへ
                }
            }

            if (!response) {
                // 診断：利用可能なモデルをリストアップしてみる
                let availableModelsStr = 'none';
                try {
                    const modelList = await genAIInstance.listModels();
                    availableModelsStr = modelList.models.map(m => m.name).join(', ');
                } catch (listErr) {
                    availableModelsStr = `failed to list (${listErr instanceof Error ? listErr.message : 'unknown error'})`;
                }

                throw new Error(`利用可能なAIモデルが見つかりませんでした。このキーで認識されているモデル一覧: [${availableModelsStr}]`);
            }

            // 安全フィルターなどでブロックされた場合のハンドリング
            if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
                return NextResponse.json({ 
                    error: "生成内容が安全フィルターにより制限されました。表現を和らげるか、別のキーワードでお試しください。"
                }, { status: 400 });
            }

            let text = response.text();

            if (!text) {
                throw new Error('AIからの応答が空でした。');
            }

            // Markdownのデコレーションを取り除く（もし含まれてしまった場合）
            text = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

            return NextResponse.json({ content: text });
        } catch (apiError: any) {
            console.error('Gemini API Ultimate Error:', apiError);
            let message = '記事の生成中にエラーが発生しました。APIキーの有効期限や権限を再度ご確認ください。';
            if (apiError.message?.includes('429')) {
                message = 'リクエスト上限に達しました。しばらく待ってから再試行してください。';
            }
            // 詳細理由をメインのエラー文言に含める
            if (apiError.message) {
                message += ` (詳細: ${apiError.message})`;
            }
            return NextResponse.json({ error: message, details: apiError.message }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
