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
  const [apiKey, setApiKey] = useState('');
  const [keyword, setKeyword] = useState('');
  const [worries, setWorries] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleSuggest = async () => {
    if (!keyword) {
      alert('先にキーワードを入力してください。');
      return;
    }
    if (!apiKey) {
      alert('Gemini APIキーを入力してください。');
      return;
    }

    setSuggesting(true);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, apiKey }),
      });

      if (!response.ok) throw new Error('提案に失敗しました');
      const data = await response.json();
      setWorries(data.suggestion);
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setSuggesting(false);
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
          apiKey,
          keyword,
          worries,
          affiliateUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '記事の生成に失敗しました');
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました', err);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#222] py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 fade-in">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-[#1a1a1a]">
            電話占い記事生成ツール
          </h1>
          <p className="text-[#666] text-sm tracking-wide">
            PASONAの法則に基づいた、高CVなSEOアフィリエイト記事を自動生成
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
            5,000文字規模の圧倒的な原稿作成をご体験ください。
          </p>
        </div>

        <div className="space-y-16">

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
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-[#999] uppercase tracking-widest">
                      メインキーワード
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggesting || !keyword}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                        suggesting 
                        ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                        : 'bg-[#2CB696]/[0.05] text-[#2CB696] border-[#2CB696]/20 hover:bg-[#2CB696] hover:text-white'
                      }`}
                    >
                      {suggesting ? (
                        <div className="w-2 h-2 border-2 border-[#2CB696] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      悩みをAIで提案
                    </button>
                  </div>
                  <div className="relative">
                    <Sparkles className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2CB696]" />
                    <input
                      type="text"
                      className="w-full bg-transparent text-lg border-b border-gray-100 py-3 pl-8 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                      placeholder="例：復縁 冷却期間"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                    ターゲットの悩み・状況
                  </label>
                  <textarea
                    className="w-full bg-gray-50/30 border border-gray-100 rounded-2xl p-6 focus:border-[#2CB696] focus:ring-1 focus:ring-[#2CB696] transition-all outline-none placeholder:text-gray-200 text-sm min-h-[120px]"
                    placeholder="例：元彼にLINEを無視されている、3ヶ月連絡が取れていない、など具体的に"
                    value={worries}
                    onChange={(e) => setWorries(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-6">
                  <label className="block text-xs font-bold text-[#999] uppercase tracking-widest mb-3">
                    誘導先アフィリエイトURL
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200" />
                    <input
                      type="url"
                      className="w-full bg-transparent text-sm border-b border-gray-100 py-3 pl-8 focus:border-[#2CB696] transition-colors outline-none placeholder:text-gray-200"
                      placeholder="https://..."
                      value={affiliateUrl}
                      onChange={(e) => setAffiliateUrl(e.target.value)}
                      required
                    />
                  </div>
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
                      <span className="text-sm tracking-widest uppercase">記事を生成中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm tracking-widest uppercase text-white font-bold">記事を生成する</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 sm:p-16 shadow-[0_12px_48px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-8 border-b border-gray-50 pb-8">
                <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-[#2CB696]' : 'text-[#999]'}`}
                  >
                    プレビュー
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'html' ? 'bg-white shadow-sm text-[#2CB696]' : 'text-[#999]'}`}
                  >
                    HTMLコード
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => copyToClipboard(result)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2CB696] text-white rounded-full text-xs font-bold hover:bg-[#259b7f] transition-all shadow-sm"
                  >
                    {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {activeTab === 'preview' ? 'HTMLをコピー' : 'コードをコピー'}
                  </button>
                </div>
              </div>

              <div className="max-w-none prose prose-slate">
                {activeTab === 'preview' ? (
                  <div 
                    className="bg-[#FDFDFD] rounded-2xl p-8 sm:p-12 border border-gray-50/50 preview-area overflow-auto max-h-[800px]"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                ) : (
                  <div className="bg-[#1e1e1e] rounded-2xl p-8 sm:p-12 border border-gray-800 font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-[800px]">
                    {result}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-20 text-center pb-12">
          <p className="text-[#ccc] text-[10px] font-bold tracking-[0.3em] uppercase">
            Built with Uranai Article Generator AI
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

        .preview-area h1 { font-size: 1.8rem; font-weight: bold; margin-bottom: 1.5rem; color: #1a1a1a; }
        .preview-area h2 { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #2CB696; border-left: 4px solid #2CB696; padding-left: 1rem; }
        .preview-area h3 { font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #333; }
        .preview-area p { margin-bottom: 1.25rem; line-height: 1.8; color: #444; }
        .preview-area ul { margin-bottom: 1.25rem; padding-left: 1.5rem; list-style-type: disc; }
        .preview-area li { margin-bottom: 0.5rem; color: #444; }
        .preview-area a { color: #2CB696; text-decoration: underline; }
      `}</style>
    </main>
  );
}
