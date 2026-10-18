import React from 'react';
import { YahooRosterSlot, TeamCategoryStrength, CATEGORIES, PuntState, Player } from '../types/fantasy';
import { Shield, UserCheck, X, AlertCircle } from 'lucide-react';

interface RosterSidebarProps {
  rosterSlots: YahooRosterSlot[];
  teamStrengths: Record<string, TeamCategoryStrength>;
  punts: PuntState;
  onRemovePlayer: (playerId: string) => void;
  onInspectPlayer: (player: Player) => void;
}

export const RosterSidebar: React.FC<RosterSidebarProps> = ({
  rosterSlots,
  teamStrengths,
  punts,
  onRemovePlayer,
  onInspectPlayer,
}) => {
  const filledCount = rosterSlots.filter(s => s.assignedPlayer !== null).length;

  const getGradeBadge = (grade: string, isPunted: boolean) => {
    if (isPunted) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-600/40 font-bold uppercase">
          Punt
        </span>
      );
    }
    switch (grade) {
      case 'A+':
      case 'A':
        return <span className="text-[11px] font-extrabold text-emerald-400">{grade}</span>;
      case 'B+':
      case 'B':
        return <span className="text-[11px] font-bold text-teal-300">{grade}</span>;
      case 'C+':
      case 'C':
        return <span className="text-[11px] font-medium text-slate-300">{grade}</span>;
      default:
        return <span className="text-[11px] font-bold text-rose-400">{grade}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 9-Category Team Radar & Strength Meter */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white tracking-tight uppercase">
              My 9-Cat Team Balance
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono-numbers">
            {filledCount}/13 Drafted
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => {
            const data = teamStrengths[cat.key];
            const isPunted = !!punts[cat.key];

            return (
              <div
                key={cat.key}
                className={`p-2 rounded-lg border flex flex-col justify-between ${
                  isPunted
                    ? 'bg-amber-950/20 border-amber-900/40 opacity-75'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className={`font-bold ${isPunted ? 'line-through text-amber-400' : 'text-slate-300'}`}>
                    {cat.shortLabel}
                  </span>
                  {data && getGradeBadge(data.grade, isPunted)}
                </div>

                <div className="flex items-baseline justify-between text-[10px] font-mono-numbers text-slate-400">
                  <span>{data ? (data.totalZScore > 0 ? `+${data.totalZScore}` : data.totalZScore) : '0.0'}z</span>
                  <span className="text-slate-500">{data ? data.averageRaw : 0}{cat.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yahoo 13-Man Roster Slots */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white tracking-tight uppercase">
              Yahoo Roster Slots (13-Spot Standard)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            H2H Standard
          </span>
        </div>

        <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
          {rosterSlots.map(slot => {
            const player = slot.assignedPlayer;

            return (
              <div
                key={slot.slotKey}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                  player
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/50 border-dashed border-slate-800/80 text-slate-500'
                }`}
              >
                {/* Slot Label */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 text-[11px] font-bold text-violet-400 font-mono-numbers shrink-0">
                    {slot.displayLabel}
                  </span>

                  {player ? (
                    <div className="min-w-0">
                      <button
                        onClick={() => onInspectPlayer(player)}
                        className="font-bold text-slate-200 hover:text-white transition-colors truncate block text-left cursor-pointer"
                      >
                        {player.name}
                      </button>
                      <span className="text-[10px] text-slate-400 font-sans block">
                        {player.team} · {player.positions.join('/')} · {player.stats.pts}p / {player.stats.reb}r / {player.stats.ast}a
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Empty ({slot.eligiblePositions.join('/')})
                    </span>
                  )}
                </div>

                {/* Remove button if filled */}
                {player && (
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    title="Remove player from my roster"
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
