'use client';

import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Info, FileText, Sparkles, ChevronDown, ChevronUp, Wrench, ShoppingBag, CreditCard, LayoutTemplate, Share2, Upload, X, FileMinus, FileUp, FileSearch, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// PDF.js worker setup is now handled inside extractTextFromPdf

const PATTERNS = [
  { id: 'auto', name: 'Auto-Optimize', desc: 'AIが最適な構成を提案' },
  { id: 'resolution', name: 'Solution', desc: '価値提供と具体的な解決策' },
  { id: 'story', name: 'Narrative', desc: '経験と共感の共有' },
  { id: 'contrarian', name: 'Paradigm Shift', desc: '視点の転換と新しい気づき' },
  { id: 'list', name: 'Roadmap', desc: '体系的なステップ解説' },
  { id: 'data', name: 'Data-Driven', desc: '客観的事実と考察' },
];

const PLATFORMS = [
  { id: 'x', name: 'X (Twitter)', icon: '𝕏' },
  { id: 'note', name: 'note', icon: 'n' },
  { id: 'other', name: 'Other', icon: '...' },
];

export default function Home() {
  const [platform, setPlatform] = useState('note');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState('');
  const [target, setTarget] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tools, setTools] = useState('');
  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('auto');
  const [inputType, setInputType] = useState<'url' | 'text' | 'file'>('url');
  const [sourceText, setSourceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const extractTextFromPdf = async (file: File) => {
    try {
      // Dynamic import to avoid SSR issues with DOMMatrix
      // @ts-ignore
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
      
      // Setup worker
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n';
      }
      return fullText;
    } catch (error) {
      console.error('PDF Extraction Error:', error);
      throw new Error('PDFからテキストを抽出できませんでした。');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setExtracting(true);

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setSourceText(text);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setSourceText(text);
      } else {
        alert('サポートされていないファイル形式です。PDFまたはテキストファイルを選択してください。');
        setFileName('');
      }
    } catch (error: any) {
      alert(error.message);
      setFileName('');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey) {
      alert('Gemini APIキーを入力してください。詳細は最上部の設定項目をご確認ください。');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          apiKey,
          theme,
          target,
          referenceUrl: inputType === 'url' ? referenceUrl : '',
          sourceText: inputType !== 'url' ? sourceText : '',
          purpose,
          tools,
          service,
          price,
          pattern: selectedPattern,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '執筆に失敗しました');
      }

      const data = await response.json();
      setResult(data.content);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'text' | 'rich') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'text') {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      } else {
        setCopiedRich(true);
        setTimeout(() => setCopiedRich(false), 2000);
      }
    } catch (err) {
      console.error('コピーに失敗しました', err);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#222] py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-[#1a1a1a]">
            Content Architecture
          </h1>
          <p className="text-[#666] text-sm tracking-wide">
            読者の心に深く届くストーリーを紡ぐ、執筆アシスタント
          </p>
        </div>

        {/* Limited Time Notice */}
        <div className="mb-12 bg-[#2CB696]/[0.03] border border-[#2CB696]/20 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center justify-center gap-2 text-[#2CB696] mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Limited Time Release</span>
          </div>
          <p className="text-sm text-[#444] leading-relaxed">
            現在、期間限定で「Content Architecture AI」を一般公開中です。<br />
            1万文字規模の圧倒的な原稿作成をご体験ください。
          </p>
        </div>

        <div className="space-y-16">
          {/* Platform Tab */}
          <div className="flex justify-center mb-8">
            <div className="bg-white border text-sm border-gray-100 rounded-full p-1 shadow-sm flex gap-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${platform === p.id
                    ? 'bg-[#2CB696] text-white'
                    : 'text-[#666] hover:bg-gray-50'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* API Key Settings */}
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4 mb-8">
                <div className="flex items-center gap-2 text-[#666] mb-2">
                  <Key className="absolute right-0 w-1 y-1 opacity-0" />
                  <Sparkles className="w-4 h-4 text-[#2CB696]" />
                  <label className="text-xs font-bold uppercase tracking-widest">
                    Gemini API Key
                  </label>
                </div>
                <input
                  type="password"
                  className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 focus:border-[#2CB696] focus:ring-1 focus:ring-[#2CB696] transition-all outline-none placeholder:text-gray-300 text-sm"
                  placeholder="AIzaSy...（複数入力はカンマ区切り）"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                />
                <p className="text-[10px] text-[#999] leading-relaxed">
                  ※ APIキーはあなたのブラウザにのみ保存されます。複数入力するとランダムに切り替えて使用します。キーをお持ちでない方は <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#2CB696] underline">Google AI Studio</a> で取得してください。
                </p>
              </div>

              {/* Core Information */}
              <div className="space-y-10">
                {/* Input Type Selection */}
                <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100 max-w-sm mx-auto">
                  {(['url', 'text', 'file'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setInputType(t)}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${inputType === t
                        ? 'bg-white shadow-sm text-[#2CB696]'
                        : 'text-[#999] hover:text-[#666]'
                        }`}
                    >
                      {t === 'url' ? 'Reference URL' : t === 'text' ? 'Direct Input' : 'File Upload'}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {inputType === 'url' && (
                    <motion.div
                      key="url"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                        参考URL (キュレーション元)
                      </label>
                      <div className="relative">
                        <Share2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200" />
                        <input
                          type="url"
                          className="w-full bg-transparent text-lg border-b border-gray-100 py-3 pl-8 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                          placeholder="https://example.com/article"
                          value={referenceUrl}
                          onChange={(e) => setReferenceUrl(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}

                  {inputType === 'text' && (
                    <motion.div
                      key="text"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <label className="block text-xs font-bold text-[#999] uppercase tracking-widest">
                        リライト元のテキスト
                      </label>
                      <textarea
                        className="w-full bg-gray-50/30 border border-gray-100 rounded-2xl p-6 focus:border-[#2CB696] focus:ring-1 focus:ring-[#2CB696] transition-all outline-none placeholder:text-gray-200 text-sm min-h-[200px]"
                        placeholder="リライトしたい文章をここに貼り付けてください..."
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                      />
                    </motion.div>
                  )}

                  {inputType === 'file' && (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <label className="block text-xs font-bold text-[#999] uppercase tracking-widest">
                        ソースファイルのアップロード
                      </label>
                      <div className={`relative border-2 border-dashed rounded-3xl p-10 transition-all text-center ${extracting ? 'border-[#2CB696] bg-[#2CB696]/[0.02]' : 'border-gray-100 hover:border-[#2CB696]/30'
                        }`}>
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-4">
                          {extracting ? (
                            <div className="w-10 h-10 border-4 border-[#2CB696] border-t-transparent rounded-full animate-spin" />
                          ) : fileName ? (
                            <FileSearch className="w-10 h-10 text-[#2CB696]" />
                          ) : (
                            <FileUp className="w-10 h-10 text-gray-200" />
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#444] mb-1">
                              {fileName || 'ファイルをドラッグ＆ドロップ'}
                            </p>
                            <p className="text-[10px] text-[#999] uppercase tracking-widest">
                              PDF or TXT (Max 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                      {sourceText && !extracting && (
                        <div className="bg-green-50/50 rounded-xl p-4 flex items-center gap-3">
                          <Check className="w-4 h-4 text-[#2CB696]" />
                          <span className="text-[10px] text-[#2CB696] font-bold uppercase tracking-wider">
                            テキストの抽出に成功しました（{sourceText.length}文字）
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-8 pt-6 border-t border-gray-50">
                  <div>
                    <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                      伝えたいコアメッセージ（テーマ）
                    </label>
                    <input
                      type="text"
                      className="w-full bg-transparent text-xl font-medium border-b border-gray-100 py-3 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                      placeholder="伝えたい想いの中心を言葉にしてください (任意)"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                        この記事を一番届けたい相手
                      </label>
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-100 py-2 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                        placeholder="読者の顔を思い浮かべて (任意)"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                        読後のゴール設定（目的）
                      </label>
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-100 py-2 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                        placeholder="読んだ後の変化は？"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings (Accordion) */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(!isDetailOpen)}
                  className="flex items-center gap-2 text-[#999] text-xs font-bold hover:text-[#2CB696] transition-colors"
                >
                  {isDetailOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  DETAILS & CONTEXT
                </button>
                {isDetailOpen && (
                  <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-bold text-[#999] mb-2 uppercase tracking-widest">
                        活用しているツール・手段
                      </label>
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-100 py-2 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200 text-sm"
                        placeholder="お気に入りの道具やメソッド"
                        value={tools}
                        onChange={(e) => setTools(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <label className="block text-xs font-bold text-[#999] mb-2 uppercase tracking-widest">
                          提案したい解決策・サービス
                        </label>
                        <input
                          type="text"
                          className="w-full bg-transparent border-b border-gray-100 py-2 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200 text-sm"
                          placeholder="あなたの価値を提案する"
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#999] mb-2 uppercase tracking-widest">
                          価値提供の目安（単価など）
                        </label>
                        <input
                          type="text"
                          className="w-full bg-transparent border-b border-gray-100 py-2 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200 text-sm"
                          placeholder="誠実な対価のイメージ"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Style Selection */}
              <div className="space-y-6 pt-4">
                <label className="block text-xs font-bold text-[#999] uppercase tracking-widest">
                  Content Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPattern(p.id)}
                      className={`px-4 py-5 rounded-2xl border text-left transition-all duration-300 relative ${selectedPattern === p.id
                        ? 'border-[#2CB696] bg-[#2CB696]/[0.02] shadow-[0_4px_12px_rgba(44,182,150,0.1)]'
                        : 'border-gray-50 bg-[#FAFAFA] hover:border-gray-100'
                        }`}
                    >
                      <div className="font-bold text-xs text-[#333] mb-1">{p.name}</div>
                      <div className="text-[10px] text-[#999] leading-tight uppercase tracking-tight">{p.desc}</div>
                      {selectedPattern === p.id && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-3 h-3 text-[#2CB696]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-5 rounded-full font-bold text-white shadow-sm flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden relative ${loading
                    ? 'bg-[#2CB696]/40 cursor-not-allowed'
                    : 'bg-[#2CB696] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm tracking-widest">ARCHITECTING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="text-sm tracking-widest uppercase">Create Content</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 sm:p-16 shadow-[0_12px_48px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-12 border-b border-gray-50 pb-8">
                <div className="flex items-center gap-4 text-[#999]">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Manuscript</span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => copyToClipboard(result, 'rich')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2CB696] text-white rounded-full text-xs font-bold hover:bg-[#259b7f] transition-all shadow-sm"
                  >
                    {copiedRich ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy as Rich Text
                  </button>
                  <button
                    onClick={() => copyToClipboard(result, 'text')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-[#666] rounded-full text-xs font-bold hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy Text
                  </button>
                </div>
              </div>
              <div className="max-w-none">
                <div className="bg-[#FDFDFD] rounded-2xl p-8 sm:p-12 border border-gray-50/50">
                  <div className="text-[#333] text-[15px] leading-[1.8] tracking-tight whitespace-pre-wrap selection:bg-[#2CB696]/10 font-sans">
                    {result}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-20 text-center pb-12">
          <p className="text-[#ccc] text-[10px] font-bold tracking-[0.3em] uppercase">
            Built with Content Architecture AI
          </p>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        
        body {
          background-color: #FAFAFA;
          font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .fade-in {
          animation: fadeIn 1.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
