import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, RefreshCw, Scale, Send, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Player, AIRecommendationResponse, PuntState } from '../types/fantasy';

interface AdvisorPanelProps {
  userRoster: Player[];
  availablePlayers: (Player & { adjustedZ: number })[];
  punts: PuntState;
  currentPick: number;
  leagueSize: number;
  onDraftPlayer: (player: Player) => void;
  comparedPlayers: Player[];
  onClearCompare: () => void;
  onInspectPlayer: (player: Player) => void;
}

export const AdvisorPanel: React.FC<AdvisorPanelProps> = ({
  userRoster,
  availablePlayers,
  punts,
  currentPick,
  leagueSize,
  onDraftPlayer,
  comparedPlayers,
  onClearCompare,
  onInspectPlayer,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendationResponse | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [errorRecs, setErrorRecs] = useState<string | null>(null);

  // Compare state
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "Welcome to Hardwood IQ! I'm monitoring your Yahoo 9-Cat Draft in real time. Ask me anything about category synergy, whether to punt, or who pairs best with your roster.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Fetch recommendations when user turns or draft state shifts
  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    setErrorRecs(null);
    try {
      const activePunts = Object.entries(punts)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRoster,
          availablePlayers: availablePlayers.slice(0, 20),
          puntedCategories: activePunts,
          currentPickNumber: currentPick,
          leagueSize,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate pick suggestions');
      }

      const data: AIRecommendationResponse = await res.json();
      setRecommendations(data);
    } catch (err: any) {
      console.error(err);
      setErrorRecs(err.message || 'Could not load AI recommendations');
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userRoster.length, currentPick]);

  // Run Head-to-Head Compare
  const runComparison = async () => {
    if (comparedPlayers.length < 2) return;
    setIsLoadingCompare(true);
    setComparisonResult(null);
    try {
      const activePunts = Object.entries(punts)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: comparedPlayers,
          userRoster,
          puntedCategories: activePunts,
        }),
      });

      if (!res.ok) throw new Error('Failed to compare players');
      const data = await res.json();
      setComparisonResult(data.comparison);
    } catch (err: any) {
      console.error(err);
      setComparisonResult('Could not run comparison right now.');
    } finally {
      setIsLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (comparedPlayers.length >= 2) {
      runComparison();
    } else {
      setComparisonResult(null);
    }
  }, [comparedPlayers]);

  // Send Chat message
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsSendingChat(true);

    try {
      const activePunts = Object.entries(punts)
        .filter(([_, v]) => v)
        .map(([k]) => k);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          userRoster,
          availableTop: availablePlayers.slice(0, 10),
          puntedCategories: activePunts,
          currentPick,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'Error contacting AI draft advisor. Please try again.' },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Best Overall Fit':
        return 'bg-violet-950/60 text-violet-300 border-violet-700/60';
      case 'Category Specialist':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      case 'High-Upside Steal':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      default:
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Recommendations Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Next Pick Recommendations
              </h3>
              <p className="text-xs text-slate-400">
                Tailored for Yahoo 9-Cat H2H based on your current team strengths
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={isLoadingRecs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecs ? 'animate-spin' : ''}`} />
            Refresh Advice
          </button>
        </div>

        {/* Strategy Context Callouts */}
        {recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Current Build Status
              </span>
              <p className="text-xs text-slate-200">
                {recommendations.overallAssessment}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                Punt Strategy Recommendation
              </span>
              <p className="text-xs text-slate-200">
                {recommendations.suggestedPuntPath}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                Positional Scarcity Alert
              </span>
              <p className="text-xs text-slate-200">
                {recommendations.positionalAlert}
              </p>
            </div>
          </div>
        )}

        {/* Pick Cards Grid */}
        {isLoadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-900/60 border border-slate-800 rounded-xl p-4 h-48" />
            ))}
          </div>
        ) : recommendations && recommendations.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.recommendations.map(rec => {
              const matchedPlayer = availablePlayers.find(
                p => p.id === rec.playerId || p.name.toLowerCase() === rec.playerName.toLowerCase()
              );

              return (
                <div
                  key={rec.playerId || rec.playerName}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Badge & Slot */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(rec.badge)}`}>
                        {rec.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono-numbers">
                        Fits: <strong className="text-white">{rec.rosterFitSlot}</strong>
                      </span>
                    </div>

                    {/* Player Name & Team */}
                    <button
                      onClick={() => matchedPlayer && onInspectPlayer(matchedPlayer)}
                      className="text-sm font-bold text-white hover:text-violet-400 transition-colors text-left block truncate cursor-pointer"
                    >
                      {rec.playerName}
                    </button>
                    {matchedPlayer && (
                      <span className="text-[11px] text-slate-400 block mb-2 font-mono-numbers">
                        {matchedPlayer.team} · {matchedPlayer.positions.join('/')} · ADP {matchedPlayer.yahooAdp}
                      </span>
                    )}

                    {/* Reasoning */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {rec.strategicReasoning}
                    </p>

                    {/* Category Pros & Risks */}
                    <div className="space-y-1 mb-3 text-[11px]">
                      {rec.pros.slice(0, 2).map((pro, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>{pro}</span>
                        </div>
                      ))}
                      {rec.risks.slice(0, 1).map((risk, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-rose-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Draft Action */}
                  {matchedPlayer && (
                    <button
                      onClick={() => onDraftPlayer(matchedPlayer)}
                      className="w-full mt-2 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Draft {matchedPlayer.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No active recommendations available. Click 'Refresh Advice' to re-query.
          </div>
        )}
      </div>

      {/* Head-to-Head Compare Section (if players selected) */}
      {comparedPlayers.length > 0 && (
        <div className="bg-[#111827] border border-amber-600/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Head-to-Head Player Comparison ({comparedPlayers.length} Selected)
              </h3>
            </div>
            <button
              onClick={onClearCompare}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {comparedPlayers.map(p => (
              <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                <span className="font-bold text-white block">{p.name}</span>
                <span className="text-[11px] text-slate-400 font-mono-numbers">
                  {p.team} · {p.positions.join('/')} · ADP {p.yahooAdp}
                </span>
                <div className="mt-2 text-[11px] text-slate-300 font-mono-numbers grid grid-cols-2 gap-1">
                  <span>PTS: {p.stats.pts}</span>
                  <span>REB: {p.stats.reb}</span>
                  <span>AST: {p.stats.ast}</span>
                  <span>BLK: {p.stats.blk}</span>
                  <span>FG: {p.stats.fgPct}%</span>
                  <span>FT: {p.stats.ftPct}%</span>
                </div>
              </div>
            ))}
          </div>

          {isLoadingCompare ? (
            <div className="flex items-center justify-center p-6 gap-2 text-xs text-amber-300">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing head-to-head category matchup...</span>
            </div>
          ) : comparisonResult ? (
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {comparisonResult}
            </div>
          ) : null}
        </div>
      )}

      {/* Live AI Draft Co-GM Chat */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Live AI Draft Advisor Chat
          </h3>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">Ask any fast-paced draft question</span>
        </div>

        {/* Chat Stream Window */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto space-y-3 mb-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                <span className="text-[10px] font-bold uppercase opacity-60 block mb-0.5">
                  {msg.sender === 'user' ? 'You' : 'Hardwood IQ'}
                </span>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}
          {isSendingChat && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span>Co-GM is calculating 9-cat odds...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="e.g. 'I took Giannis round 1, who should I target in round 2?'"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isSendingChat}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
