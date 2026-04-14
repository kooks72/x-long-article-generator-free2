import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keyword, apiKey: requestApiKey } = body;

        let finalApiKey = requestApiKey || '';
        if (finalApiKey.includes(',') || finalApiKey.includes('\n')) {
            const keys = finalApiKey.split(/[,\n]/).map((k: string) => k.trim()).filter(Boolean);
            if (keys.length > 0) {
                finalApiKey = keys[Math.floor(Math.random() * keys.length)];
            }
        }

        if (!finalApiKey) {
            return NextResponse.json({ error: 'Gemini APIキーを入力してください。' }, { status: 401 });
        }

        if (!keyword) {
            return NextResponse.json({ error: 'キーワードを入力してください' }, { status: 400 });
        }

        const systemPrompt = `
あなたはプロの心理カウンセラーです。
指定されたキーワードで検索している人が抱えているであろう「具体的な悩みやシチュエーション」を1つ提案してください。

【キーワード】: ${keyword}

【出力ルール】
- 読者の共感を得られるような、リアルで具体的な悩みの内容にしてください。
- 100文字〜150文字程度の日本語で出力してください。
- 「〜という悩みがあります」などの前置きは不要です。悩みそのものを出力してください。
- 電話占いに相談したくなるような、一人では解決しがたい不安や迷いを含めてください。
`;

        try {
            const genAIInstance = new GoogleGenerativeAI(finalApiKey);
            const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ];

            // フォールバック付きの生成ロジック
            let response;
            try {
                // 第一候補: Gemini 3.1
                const model = genAIInstance.getGenerativeModel({ 
                    model: 'gemini-3.1-flash-lite-preview',
                    safetySettings
                });
                const result = await model.generateContent(systemPrompt);
                response = await result.response;
            } catch (firstError: any) {
                console.warn('Suggest API: First model attempt failed, falling back to 1.5-flash:', firstError.message);
                // 第二候補: Gemini 1.5 Flash
                const model = genAIInstance.getGenerativeModel({ 
                    model: 'gemini-1.5-flash',
                    safetySettings
                });
                const result = await model.generateContent(systemPrompt);
                response = await result.response;
            }
            
            // 安全フィルターなどでブロックされた場合のハンドリング
            if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
                return NextResponse.json({ 
                    suggestion: "申し訳ありません。このキーワードに関する提案は安全フィルターにより制限されました。別のキーワードでお試しください。",
                    isBlocked: true
                });
            }

            const text = response.text().trim();
            return NextResponse.json({ suggestion: text });
        } catch (apiError: any) {
            console.error('Gemini Suggest API Ultimate Error:', apiError);
            return NextResponse.json({ 
                error: '提案の生成中にエラーが発生しました。APIキーの権限等をご確認ください。',
                details: apiError.message 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
