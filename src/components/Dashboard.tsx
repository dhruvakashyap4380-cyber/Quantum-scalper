import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";
import { 
  Zap, 
  Activity, 
  ShieldAlert, 
  Target, 
  Settings, 
  Play, 
  Square, 
  History, 
  BarChart3,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";

const socket = io();

export default function Dashboard() {
  const [botState, setBotState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    socket.on("bot_update", (state) => {
      setBotState(state);
    });

    if (chartContainerRef.current) {
      const chartOptions = {
        layout: { 
          background: { color: "transparent" },
          textColor: "#94a3b8" 
        },
        grid: {
          vertLines: { color: "#1e293b" },
          horzLines: { color: "#1e293b" }
        },
        rightPriceScale: { borderColor: "#1e293b" },
        timeScale: { borderColor: "#1e293b" },
      };
      
      const chart = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      // Initial dummy data to make chart look alive
      const data = generateHistoryData();
      candlestickSeries.setData(data);

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
  }, []);

  const generateHistoryData = () => {
    const data = [];
    let time = Math.floor(Date.now() / 1000) - 100 * 300;
    let price = 50000;
    for (let i = 0; i < 100; i++) {
       data.push({
         time: time as any,
         open: price,
         high: price + Math.random() * 100,
         low: price - Math.random() * 100,
         close: price + (Math.random() - 0.5) * 100
       });
       time += 300;
       price = data[data.length - 1].close;
    }
    return data;
  };

  const toggleBot = async () => {
    if (botState?.isRunning) {
      await fetch("/api/stop", { method: "POST" });
    } else {
      await fetch("/api/start", { method: "POST" });
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze the current market context for ${botState?.symbol || "BTC/USDT"} at ${botState?.timeframe || "5m"}.
        Current Price: ${botState?.currentPrice}.
        Bot Confluence Score: ${botState?.confluenceScore}/7.
        Identify potential Support and Resistance (SnR) patterns.
        Provide a concise Bullish/Bearish sentiment and next likely move.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiAnalysis(response.text || "Analysis failed.");
    } catch (err) {
      setAiAnalysis("Error connecting to Gemini Vision.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!botState) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono text-orange-500">
      CONNECTING TO QUANT ENGINE...
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-brand-bg text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-brand-border bg-brand-bg flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-brand-blue rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">AI</div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            QUANTUM <span className="text-brand-blue">SCALP</span> 
            <span className="text-xs font-normal text-gray-500 uppercase tracking-[0.2em] ml-2 hidden sm:inline-block">Automated AI Scalper</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">Local Time (IST)</p>
            <p className="text-sm mono font-bold text-white">{new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <div className="h-10 w-px bg-brand-border"></div>
          <div className="flex gap-4">
            <div className="bg-green-900/10 px-3 py-1 rounded border border-brand-green/30">
              <p className="text-[10px] text-brand-green font-bold uppercase tracking-tighter">Daily Target</p>
              <p className="text-sm mono text-white">${botState.dailyProfit.toFixed(1)} / $200</p>
            </div>
            <div className="bg-red-900/10 px-3 py-1 rounded border border-brand-red/30">
              <p className="text-[10px] text-brand-red font-bold uppercase tracking-tighter">Daily Losses</p>
              <p className="text-sm mono text-white">{botState.dailyLosses} / 5</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 border-r border-brand-border flex flex-col shrink-0 bg-[#0b0e11]">
          <div className="p-4 flex-1 overflow-y-auto">
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-3 block tracking-widest">Market Watch (USDT)</label>
            <div className="space-y-1">
              <div className="flex justify-between items-center p-2 rounded bg-brand-blue/10 border border-brand-blue/30 group cursor-pointer">
                <span className="font-semibold text-white">BTC / USDT</span>
                <span className="text-brand-green mono font-bold">${botState.currentPrice.toLocaleString()}</span>
              </div>
              {["ETH", "SOL", "BNB"].map(coin => (
                <div key={coin} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition cursor-pointer">
                  <span className="text-gray-400 font-medium">{coin} / USDT</span>
                  <span className="text-gray-500 mono">$0.00</span>
                </div>
              ))}
            </div>

            <label className="text-[10px] text-gray-500 uppercase font-bold mt-8 mb-3 block tracking-widest">Timeframe</label>
            <div className="grid grid-cols-3 gap-1">
              {["1m", "5m", "10m", "30m", "1h"].map(tf => (
                <button 
                  key={tf} 
                  className={`px-2 py-1.5 text-xs border rounded transition-all font-bold ${
                    botState.timeframe === tf 
                    ? "border-brand-blue bg-brand-blue/20 text-brand-blue" 
                    : "border-brand-border text-gray-500 hover:border-gray-600"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <nav className="mt-8 space-y-1">
              {[
                { id: "dashboard", icon: BarChart3, label: "Market View" },
                { id: "trades", icon: History, label: "Trade Slot" },
                { id: "settings", icon: Settings, label: "Configuration" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-bold transition-all ${
                    activeTab === tab.id ? "bg-white/5 text-brand-blue" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-4 border-t border-brand-border">
            <div className={`flex items-center gap-2 mb-3 ${botState.isRunning ? "text-brand-green" : "text-yellow-500"}`}>
              <div className={`w-2 h-2 rounded-full ${botState.isRunning ? "bg-brand-green animate-pulse" : "bg-yellow-500"}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {botState.isRunning ? "System Active" : "Standby Mode"}
              </span>
            </div>
            <button 
              onClick={toggleBot}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
                botState.isRunning 
                ? "bg-brand-red hover:bg-red-600 text-white shadow-brand-red/20" 
                : "bg-brand-blue hover:bg-blue-600 text-white shadow-brand-blue/20"
              }`}
            >
              {botState.isRunning ? "Emergency Stop" : "Execute Algo"}
            </button>
          </div>
        </aside>

        {/* Center Panel */}
        <section className="flex-1 flex flex-col p-4 overflow-hidden gap-4 bg-[#080a0c]">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col gap-4 overflow-hidden"
              >
                {/* Chart Card */}
                <div className="flex-1 glass rounded-xl flex flex-col p-5 overflow-hidden">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex gap-4 items-center">
                      <span className="text-lg font-bold text-white tracking-tight">{botState.symbol} <span className="text-xs text-gray-500 font-normal ml-1">M5 SCALPER</span></span>
                      <span className="px-2 py-0.5 rounded bg-brand-green/10 text-brand-green text-[10px] font-bold border border-brand-green/20">BULLISH TREND</span>
                    </div>
                    <div className="flex gap-4 mono text-xs text-gray-400">
                      <span>C: <span className="text-white font-bold">{botState.currentPrice.toLocaleString()}</span></span>
                      <span className="text-[10px] opacity-50 px-2 py-0.5 bg-white/5 rounded">Live Feed</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative bg-black/20 rounded-lg border border-brand-border/50">
                    <div ref={chartContainerRef} className="absolute inset-0"></div>
                    
                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-brand-border w-56 shadow-2xl">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-3 underline decoration-brand-blue underline-offset-4 tracking-widest">Strategy Metrics</p>
                      <div className="space-y-2 text-[10px] mono">
                        <div className="flex justify-between items-center text-gray-400">
                          <span>RSI(14)</span>
                          <span className="text-brand-blue font-bold">64.2</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span>EMA 9/21</span>
                          <span className="text-brand-green font-bold">+45° Angle</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400">
                          <span>Bias</span>
                          <span className="text-white font-bold">Trend Up</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs mt-3 text-white border-t border-brand-border pt-2">
                          <span className="tracking-tighter">CONFLUENCE:</span>
                          <span className="text-brand-green">{botState.confluenceScore}/7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Log Card */}
                <div className="h-44 glass rounded-xl p-4 overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em]">LIVE EXECUTION LOG (IST)</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse"></span>
                      <span className="text-[10px] text-brand-blue mono uppercase font-bold">Feed Active</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 text-[11px] mono pr-2 custom-scrollbar">
                    {botState.trades.length === 0 ? (
                      <div className="text-gray-600 italic px-2">Awaiting signal confluence... System armed and monitoring.</div>
                    ) : (
                      botState.trades.slice().reverse().map((t: any) => (
                        <div key={t.id} className="flex gap-4 items-center group">
                          <span className="text-gray-600 font-bold w-16">[{t.timestamp}]</span> 
                          <span className={`font-bold px-1.5 py-0.5 rounded-[2px] ${t.side === "BUY" ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"}`}>
                            {t.side === "BUY" ? "SIGNAL_LONG" : "SIGNAL_SHORT"}
                          </span>
                          <span className="text-gray-300">PRICE @{t.entry}</span>
                          <span className={`ml-auto text-[10px] font-bold ${
                            t.status === "PROFIT" ? "text-brand-green" : t.status === "LOSS" ? "text-brand-red" : "text-brand-blue"
                          }`}>
                            {t.status} {t.profit ? `(+${t.profit.toFixed(2)})` : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "trades" && (
              <motion.div 
                key="trades"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 glass rounded-xl p-6 overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                    <History className="text-brand-blue" />
                    Trade Slot History
                  </h2>
                  <span className="text-[10px] text-gray-500 mono">{botState.trades.length} Sessions Logged</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0b0e11] z-10">
                      <tr className="text-gray-500 text-left border-b border-brand-border">
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase">Timestamp</th>
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase">Symbol</th>
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase">Action</th>
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase">Entry</th>
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase">Result</th>
                        <th className="pb-4 font-bold tracking-widest text-[10px] uppercase text-right">PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/30">
                      {botState.trades.slice().reverse().map((t: any) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 text-gray-500 mono">{t.timestamp}</td>
                          <td className="py-4 font-bold text-white tracking-tight">{t.symbol}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.side === "BUY" ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"}`}>
                              {t.side}
                            </span>
                          </td>
                          <td className="py-4 text-white mono">{t.entry}</td>
                          <td className="py-4">
                            <span className={`font-bold ${t.status === "PROFIT" ? "text-brand-green" : t.status === "LOSS" ? "text-brand-red" : "text-brand-blue"}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className={`py-4 text-right mono font-bold ${t.profit >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                            {t.profit ? `${t.profit > 0 ? "+" : ""}${t.profit.toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 glass rounded-xl p-8 max-w-2xl mx-auto w-full"
              >
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                  <Settings className="text-brand-blue" />
                  Bot Configuration
                </h2>
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <InputGroup label="Daily Profit Target" value={botState.targetProfit} prefix="$" />
                    <InputGroup label="Max Losses/Day" value={botState.maxLosses} />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <InputGroup label="Trade Asset" value={botState.symbol} />
                    <InputGroup label="Algo Timeframe" value={botState.timeframe} />
                  </div>
                  <div className="p-5 bg-brand-blue/5 border border-brand-blue/20 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldAlert size={48} />
                    </div>
                    <p className="text-[10px] text-brand-blue uppercase tracking-widest mb-3 font-bold">API Security Architecture</p>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      Core exchange connectivity is established via CCXT backend protocols. BINGX_API_KEY and BINGX_SECRET_KEY are strictly environment-scoped. Currently operating in high-frequency scalper mode.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <button className="flex-1 py-4 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue border border-brand-blue/30 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                      Commit Parameters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Sidebar - AI Vision */}
        <aside className="w-64 border-l border-brand-border p-4 shadow-2xl shrink-0 flex flex-col gap-4 bg-[#0b0e11]">
          <div className="bg-brand-blue/10 border border-brand-blue/30 p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black tracking-widest text-white uppercase">AI VISION 3.5</span>
              <span className="text-[8px] bg-brand-blue text-white px-1.5 py-0.5 rounded font-bold uppercase">GEMINI PRO</span>
            </div>
            
            <div className="relative h-40 bg-black/40 rounded-lg border border-brand-border overflow-hidden mb-4 group">
              <div className="absolute top-6 left-4 right-4 h-px bg-brand-red/30 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <div className="absolute top-6 right-2 text-[8px] text-brand-red font-bold uppercase tracking-tighter">Resistance (R1)</div>
              
              <div className="absolute bottom-10 left-4 right-4 h-px bg-brand-green/30 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <div className="absolute bottom-10 right-2 text-[8px] text-brand-green font-bold uppercase tracking-tighter">Support (S1)</div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence>
                  {isAnalyzing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                       <BarChart3 className="text-brand-blue animate-bounce" size={20} />
                       <span className="text-[10px] text-brand-blue font-bold animate-pulse">SCANNING OHLCV...</span>
                    </motion.div>
                  ) : (
                    <span className="text-[10px] text-gray-500 text-center px-4 italic leading-relaxed">
                      {aiAnalysis ? "Analysis active. View report below." : "\"Initialize Vision Scan to identify real-time SnR patterns and price action clusters.\""}
                    </span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-bold">Trend Bias:</span>
                <span className="text-brand-green font-black uppercase">Bullish</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-bold">Confidence:</span>
                <span className="text-white font-black">92%</span>
              </div>
            </div>

            <button 
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-4 py-2 border border-brand-blue/40 text-brand-blue rounded-lg text-xs font-bold hover:bg-brand-blue/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <BrainCircuit size={14} />
              Re-Scan Chart
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="p-4 bg-gray-900/40 border border-brand-border rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">Execution Guard</span>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between mb-2"><span className="text-[10px] text-gray-400 font-medium">Risk Unit</span><span className="text-[10px] text-white mono font-bold">$100.00</span></div>
                    <div className="h-1 bg-brand-border rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-brand-blue rounded-full"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between mb-2"><span className="text-[10px] text-gray-400 font-medium">Trailing Guard</span><span className="text-[10px] text-white mono font-bold">1.5x ATR</span></div>
                    <div className="h-1 bg-brand-border rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-brand-blue rounded-full"></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-gray-400 font-medium">Compounding</span>
                    <div className="w-8 h-4 bg-brand-green/20 border border-brand-green/30 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-0.5 w-2.5 h-2.5 bg-brand-green rounded-full shadow-lg shadow-brand-green/50"></div>
                    </div>
                 </div>
              </div>
            </div>
            
            <p className="text-[9px] text-gray-600 text-center italic mt-auto">Quantum Scalper Protocol v1.42.0-b</p>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-brand-border bg-[#0b0e11] px-4 flex items-center justify-between shrink-0 text-gray-500 z-10">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[10px] font-bold tracking-tighter">BINGX_NODE_ASIA_12</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={10} className="text-brand-blue" />
            <span className="text-[10px] font-bold tracking-tighter">LATENCY: <span className="text-white mono">14ms</span></span>
          </div>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-[#2a2a2a] mono uppercase">BingX-CCXT-Middleware-v3.0</div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl shadow-lg hover:border-neutral-700 transition-all cursor-default">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase text-neutral-600 tracking-wider font-bold">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-neutral-700 font-mono mt-1 uppercase">{sub}</div>
    </div>
  );
}

function InputGroup({ label, value, prefix }: any) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-bold">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-3.5 text-gray-500 mono">{prefix}</span>}
        <input 
          readOnly 
          value={value} 
          className={`w-full bg-black/40 border border-brand-border text-white px-4 py-3.5 rounded-lg text-sm mono font-bold ${prefix ? "pl-8" : ""}`} 
        />
      </div>
    </div>
  );
}
