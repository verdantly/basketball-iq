/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { PuntBar } from './components/PuntBar';
import { PlayerTable } from './components/PlayerTable';
import { RosterSidebar } from './components/RosterSidebar';
import { BoardVisionModal } from './components/BoardVisionModal';
import { AdvisorPanel } from './components/AdvisorPanel';
import { DraftGrid } from './components/DraftGrid';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { INITIAL_PLAYERS } from './data/players';
import {
  Player,
  CategoryKey,
  PuntState,
  DraftPick,
  YahooRosterSlot,
  VisionDetectionItem,
} from './types/fantasy';
import {
  sortPlayersByAdjustedZ,
  calculateTeamCategoryStrengths,
  createInitialYahooRoster,
  assignPlayerToBestSlot,
  removePlayerFromRoster,
} from './utils/zscore';
import { Camera, Bot, Shield, Trophy, ChevronRight, User, Settings2 } from 'lucide-react';

const STORAGE_KEY = 'hardwood_iq_draft_state_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'war-room' | 'vision' | 'roster' | 'grid' | 'advisor'>('war-room');
  const [allPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [userSlot, setUserSlot] = useState<number>(4);
  const [leagueSize, setLeagueSize] = useState<number>(12);
  const [currentPick, setCurrentPick] = useState<number>(1);
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([]);
  const [rosterSlots, setRosterSlots] = useState<YahooRosterSlot[]>(createInitialYahooRoster);
  const [punts, setPunts] = useState<PuntState>({
    fgPct: false,
    ftPct: false,
    tpm: false,
    pts: false,
    reb: false,
    ast: false,
    stl: false,
    blk: false,
    to: false,
  });
  const [comparedPlayers, setComparedPlayers] = useState<Player[]>([]);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.draftHistory) setDraftHistory(data.draftHistory);
        if (data.currentPick) setCurrentPick(data.currentPick);
        if (data.userSlot) setUserSlot(data.userSlot);
        if (data.punts) setPunts(data.punts);
        if (data.rosterSlots) setRosterSlots(data.rosterSlots);
      }
    } catch (e) {
      console.warn('Failed to parse saved draft state', e);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          draftHistory,
          currentPick,
          userSlot,
          punts,
          rosterSlots,
        })
      );
    } catch (e) {
      console.warn('Failed to save draft state', e);
    }
  }, [draftHistory, currentPick, userSlot, punts, rosterSlots]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Set of drafted player IDs
  const draftedIds = useMemo(() => {
    const set = new Set<string>();
    draftHistory.forEach(p => set.add(p.playerId));
    return set;
  }, [draftHistory]);

  // Set of player IDs drafted to user's roster
  const userRosterIds = useMemo(() => {
    const set = new Set<string>();
    rosterSlots.forEach(s => {
      if (s.assignedPlayer) set.add(s.assignedPlayer.id);
    });
    return set;
  }, [rosterSlots]);

  // User's currently drafted players list
  const userRosterPlayers = useMemo(() => {
    return rosterSlots
      .map(s => s.assignedPlayer)
      .filter((p): p is Player => p !== null);
  }, [rosterSlots]);

  // Re-rank available players dynamically by adjusted Z-score
  const rankedPlayers = useMemo(() => {
    return sortPlayersByAdjustedZ(allPlayers, punts);
  }, [allPlayers, punts]);

  // Available players (not drafted by anyone)
  const availablePlayers = useMemo(() => {
    return rankedPlayers.filter(p => !draftedIds.has(p.id) && !userRosterIds.has(p.id));
  }, [rankedPlayers, draftedIds, userRosterIds]);

  // Team Category Strengths
  const teamStrengths = useMemo(() => {
    return calculateTeamCategoryStrengths(userRosterPlayers, punts);
  }, [userRosterPlayers, punts]);

  // Determine which team is on the clock in a snake draft
  const currentDraftingTeam = useMemo(() => {
    const round = Math.floor((currentPick - 1) / leagueSize) + 1;
    const isEvenRound = round % 2 === 0;
    const posInRound = ((currentPick - 1) % leagueSize) + 1;
    return isEvenRound ? leagueSize - posInRound + 1 : posInRound;
  }, [currentPick, leagueSize]);

  const isUserTurn = currentDraftingTeam === userSlot;

  // Draft a player to user's team
  const handleDraftToUser = (player: Player) => {
    if (draftedIds.has(player.id) || userRosterIds.has(player.id)) return;

    const round = Math.floor((currentPick - 1) / leagueSize) + 1;
    const pickInRound = ((currentPick - 1) % leagueSize) + 1;

    const newPick: DraftPick = {
      pickNumber: currentPick,
      round,
      pickInRound,
      teamId: userSlot,
      teamName: `Team ${userSlot} (You)`,
      playerId: player.id,
      player,
      isUserPick: true,
      timestamp: Date.now(),
    };

    setDraftHistory(prev => [...prev, newPick]);
    setRosterSlots(prev => assignPlayerToBestSlot(prev, player));
    setCurrentPick(prev => prev + 1);
    showToast(`Drafted ${player.name} to your roster!`);
  };

  // Mark a player drafted by another team
  const handleMarkTaken = (player: Player) => {
    if (draftedIds.has(player.id) || userRosterIds.has(player.id)) return;

    const round = Math.floor((currentPick - 1) / leagueSize) + 1;
    const pickInRound = ((currentPick - 1) % leagueSize) + 1;

    const newPick: DraftPick = {
      pickNumber: currentPick,
      round,
      pickInRound,
      teamId: currentDraftingTeam,
      teamName: `Team ${currentDraftingTeam}`,
      playerId: player.id,
      player,
      isUserPick: false,
      timestamp: Date.now(),
    };

    setDraftHistory(prev => [...prev, newPick]);
    setCurrentPick(prev => prev + 1);
    showToast(`Marked ${player.name} drafted by Team ${currentDraftingTeam}`);
  };

  // Remove player from user's roster
  const handleRemoveFromRoster = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    setRosterSlots(prev => removePlayerFromRoster(prev, playerId));
    setDraftHistory(prev => prev.filter(p => p.playerId !== playerId));
    showToast(`Removed ${player?.name || 'player'} from roster.`);
  };

  // Toggle category punt
  const handleTogglePunt = (key: CategoryKey) => {
    setPunts(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Apply Punt Presets
  const handleApplyPreset = (preset: 'balanced' | 'punt-ft' | 'punt-fg' | 'punt-ast' | 'punt-blk') => {
    const nextPunts: PuntState = {
      fgPct: false,
      ftPct: false,
      tpm: false,
      pts: false,
      reb: false,
      ast: false,
      stl: false,
      blk: false,
      to: false,
    };

    if (preset === 'punt-ft') {
      nextPunts.ftPct = true;
      nextPunts.tpm = true;
    } else if (preset === 'punt-fg') {
      nextPunts.fgPct = true;
      nextPunts.to = true;
    } else if (preset === 'punt-ast') {
      nextPunts.ast = true;
    } else if (preset === 'punt-blk') {
      nextPunts.blk = true;
    }
    setPunts(nextPunts);
    showToast(`Applied ${preset.replace('-', ' ').toUpperCase()} strategy preset.`);
  };

  // Toggle player in compare drawer
  const handleToggleCompare = (player: Player) => {
    setComparedPlayers(prev => {
      const exists = prev.some(p => p.id === player.id);
      if (exists) {
        return prev.filter(p => p.id !== player.id);
      } else {
        if (prev.length >= 3) {
          showToast('You can compare up to 3 players at a time.');
          return prev;
        }
        return [...prev, player];
      }
    });
  };

  // Apply OCR detected picks from Board Vision
  const handleApplyVisionPicks = (detectedPicks: VisionDetectionItem[]) => {
    let newlyDraftedCount = 0;
    const newHistory: DraftPick[] = [...draftHistory];
    let pickCounter = currentPick;

    detectedPicks.forEach(item => {
      const targetPlayer = allPlayers.find(
        p => p.id === item.matchedPlayerId || p.name.toLowerCase() === item.playerName.toLowerCase()
      );

      if (targetPlayer && !draftedIds.has(targetPlayer.id) && !userRosterIds.has(targetPlayer.id)) {
        const round = Math.floor((pickCounter - 1) / leagueSize) + 1;
        const pickInRound = ((pickCounter - 1) % leagueSize) + 1;

        newHistory.push({
          pickNumber: item.pickNumber && item.pickNumber > 0 ? item.pickNumber : pickCounter,
          round,
          pickInRound,
          teamId: currentDraftingTeam,
          teamName: item.teamName || `Team ${currentDraftingTeam}`,
          playerId: targetPlayer.id,
          player: targetPlayer,
          isUserPick: false,
          timestamp: Date.now(),
        });

        pickCounter++;
        newlyDraftedCount++;
      }
    });

    setDraftHistory(newHistory);
    setCurrentPick(pickCounter);
    showToast(`Synced ${newlyDraftedCount} drafted players from Yahoo Board!`);
  };

  // Reset entire draft state
  const handleResetDraft = () => {
    if (window.confirm('Reset draft board and start over?')) {
      setDraftHistory([]);
      setCurrentPick(1);
      setRosterSlots(createInitialYahooRoster());
      setPunts({
        fgPct: false,
        ftPct: false,
        tpm: false,
        pts: false,
        reb: false,
        ast: false,
        stl: false,
        blk: false,
        to: false,
      });
      localStorage.removeItem(STORAGE_KEY);
      showToast('Draft board reset to Pick 1.');
    }
  };

  const comparedIds = useMemo(() => new Set(comparedPlayers.map(p => p.id)), [comparedPlayers]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Header with Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVision={() => setIsVisionOpen(true)}
        onResetDraft={handleResetDraft}
        currentPick={currentPick}
        totalPicks={leagueSize * 13}
        isUserTurn={isUserTurn}
        userSlot={userSlot}
      />

      {/* Draft Setup Sub-Toolbar */}
      <div className="bg-[#0E1420] border-b border-slate-800/80 px-4 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">My Draft Slot:</span>
              <select
                value={userSlot}
                onChange={e => setUserSlot(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
              >
                {Array.from({ length: leagueSize }, (_, i) => i + 1).map(slot => (
                  <option key={slot} value={slot}>
                    Pick #{slot} (Team {slot})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">League:</span>
              <span className="text-slate-200 font-bold">12-Team Yahoo 9-Cat H2H</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>On The Clock:</span>
            <span className={`font-bold font-mono-numbers px-2 py-0.5 rounded ${
              isUserTurn ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'text-white'
            }`}>
              {isUserTurn ? 'YOU (Team ' + userSlot + ')' : 'Team ' + currentDraftingTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5">
        {/* 9-Cat Punt Strategy Engine */}
        <PuntBar
          punts={punts}
          onTogglePunt={handleTogglePunt}
          onApplyPreset={handleApplyPreset}
        />

        {/* Tab 1: Draft War Room */}
        {activeTab === 'war-room' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Dynamic Player Rankings Table */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Dynamic 9-Cat Player Rankings
                  </h2>
                  <p className="text-xs text-slate-400">
                    Adjusted Z-Scores automatically weight your active punt strategy
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono-numbers">
                  {availablePlayers.length} Available Players
                </div>
              </div>

              <PlayerTable
                players={rankedPlayers}
                draftedIds={draftedIds}
                userRosterIds={userRosterIds}
                punts={punts}
                onDraftPlayer={handleDraftToUser}
                onMarkTaken={handleMarkTaken}
                onToggleCompare={handleToggleCompare}
                comparedIds={comparedIds}
                onInspectPlayer={p => setInspectingPlayer(p)}
              />
            </div>

            {/* Right 4 Columns: 13-Man Roster & Category Radar */}
            <div className="lg:col-span-4 space-y-5">
              {/* Quick AI Advisor Hook */}
              <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 border border-violet-800/50 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center text-violet-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Need Pick Guidance?</h4>
                    <p className="text-[11px] text-slate-400">AI Co-GM analyzes your roster in real time</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('advisor')}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  View Picks
                </button>
              </div>

              <RosterSidebar
                rosterSlots={rosterSlots}
                teamStrengths={teamStrengths}
                punts={punts}
                onRemovePlayer={handleRemoveFromRoster}
                onInspectPlayer={p => setInspectingPlayer(p)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Board Vision Sync */}
        {activeTab === 'vision' && (
          <div className="space-y-6">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
              <div className="max-w-2xl mb-6">
                <h2 className="text-base font-bold text-white tracking-tight mb-1">
                  Draft Board Optical Vision Hub
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Keep this window open or click "Launch Board Scanner" to share your Yahoo live draft tab.
                  Gemini 3.8 Flash automatically extracts drafted player names and syncs your draft board without manual typing.
                </p>
              </div>

              <button
                onClick={() => setIsVisionOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-950/50 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Open Interactive Board Scanner</span>
              </button>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-white tracking-tight uppercase mb-3">
                Recent Board Vision Pick History ({draftHistory.length} Total Picks)
              </h3>
              {draftHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">
                  No picks recorded yet. Use the Board Scanner or Draft buttons in the War Room to log picks.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
                  {draftHistory.map(pick => (
                    <div
                      key={pick.pickNumber}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono-numbers text-slate-500 font-bold">
                          #{pick.pickNumber}
                        </span>
                        <div>
                          <span className="font-bold text-white block">
                            {pick.player?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-numbers">
                            {pick.player?.team} · {pick.player?.positions.join('/')} · {pick.teamName}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pick.isUserPick ? 'bg-violet-950 text-violet-300 border border-violet-800' : 'text-slate-500'
                      }`}>
                        {pick.isUserPick ? 'My Pick' : 'Taken'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: My 9-Cat Build & Roster */}
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white tracking-tight mb-1">
                  13-Spot Yahoo Roster Depth
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Positions adhere strictly to Yahoo Fantasy Basketball rules (PG, SG, G, SF, PF, F, C, C, Util x2, BN x3)
                </p>

                <div className="space-y-2">
                  {rosterSlots.map(slot => (
                    <div
                      key={slot.slotKey}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        slot.assignedPlayer
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-slate-950/40 border-dashed border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-xs font-bold text-violet-400 font-mono-numbers">
                          {slot.displayLabel}
                        </span>
                        {slot.assignedPlayer ? (
                          <div>
                            <button
                              onClick={() => slot.assignedPlayer && setInspectingPlayer(slot.assignedPlayer)}
                              className="font-bold text-white hover:text-violet-400 transition-colors text-left block"
                            >
                              {slot.assignedPlayer.name}
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono-numbers">
                              {slot.assignedPlayer.team} · {slot.assignedPlayer.positions.join('/')} · {slot.assignedPlayer.stats.pts} PTS, {slot.assignedPlayer.stats.reb} REB, {slot.assignedPlayer.stats.ast} AST
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-slate-500">
                            Open ({slot.eligiblePositions.join('/')})
                          </span>
                        )}
                      </div>

                      {slot.assignedPlayer && (
                        <button
                          onClick={() => slot.assignedPlayer && handleRemoveFromRoster(slot.assignedPlayer.id)}
                          className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-1 rounded bg-slate-800/60"
                        >
                          Drop
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <RosterSidebar
                rosterSlots={rosterSlots}
                teamStrengths={teamStrengths}
                punts={punts}
                onRemovePlayer={handleRemoveFromRoster}
                onInspectPlayer={p => setInspectingPlayer(p)}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Snake Draft Board Grid */}
        {activeTab === 'grid' && (
          <DraftGrid
            totalTeams={leagueSize}
            userSlot={userSlot}
            currentPick={currentPick}
            draftHistory={draftHistory}
            allPlayers={allPlayers}
            onInspectPlayer={p => setInspectingPlayer(p)}
          />
        )}

        {/* Tab 5: AI Co-GM Pick Advisor & Chat */}
        {activeTab === 'advisor' && (
          <AdvisorPanel
            userRoster={userRosterPlayers}
            availablePlayers={rankedPlayers.filter(p => !draftedIds.has(p.id))}
            punts={punts}
            currentPick={currentPick}
            leagueSize={leagueSize}
            onDraftPlayer={handleDraftToUser}
            comparedPlayers={comparedPlayers}
            onClearCompare={() => setComparedPlayers([])}
            onInspectPlayer={p => setInspectingPlayer(p)}
          />
        )}
      </main>

      {/* Floating Vision Modal */}
      <BoardVisionModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        availablePlayers={availablePlayers}
        onApplyDetectedPicks={handleApplyVisionPicks}
      />

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={inspectingPlayer}
        onClose={() => setInspectingPlayer(null)}
        onDraftPlayer={handleDraftToUser}
        onMarkTaken={handleMarkTaken}
        onToggleCompare={handleToggleCompare}
        isDraftedByUser={inspectingPlayer ? userRosterIds.has(inspectingPlayer.id) : false}
        isDraftedByOther={inspectingPlayer ? draftedIds.has(inspectingPlayer.id) : false}
        isCompared={inspectingPlayer ? comparedIds.has(inspectingPlayer.id) : false}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-violet-500/80 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
