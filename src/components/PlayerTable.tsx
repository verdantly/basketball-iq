import React, { useState, useMemo } from 'react';
import { Player, CategoryKey, CATEGORIES, PuntState } from '../types/fantasy';
import { Search, UserPlus, Check, Flame, ArrowUpRight, ArrowDownRight, Scale, Info } from 'lucide-react';

interface PlayerTableProps {
  players: (Player & { adjustedZ: number })[];
  draftedIds: Set<string>;
  userRosterIds: Set<string>;
  punts: PuntState;
  onDraftPlayer: (player: Player) => void;
  onMarkTaken: (player: Player) => void;
  onToggleCompare: (player: Player) => void;
  comparedIds: Set<string>;
  onInspectPlayer: (player: Player) => void;
}

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  draftedIds,
  userRosterIds,
  punts,
  onDraftPlayer,
  onMarkTaken,
  onToggleCompare,
  comparedIds,
  onInspectPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [hideDrafted, setHideDrafted] = useState(true);
  const [sortBy, setSortBy] = useState<'adjustedZ' | 'yahooAdp' | 'pts' | 'ast' | 'reb' | 'blk' | 'stl'>('adjustedZ');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        if (hideDrafted && (draftedIds.has(p.id) || userRosterIds.has(p.id))) {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchTeam = p.team.toLowerCase().includes(q);
          if (!matchName && !matchTeam) return false;
        }
        if (selectedPosition !== 'All') {
          if (selectedPosition === 'G') {
            if (!p.positions.includes('PG') && !p.positions.includes('SG')) return false;
          } else if (selectedPosition === 'F') {
            if (!p.positions.includes('SF') && !p.positions.includes('PF')) return false;
          } else {
            if (!p.positions.includes(selectedPosition as any)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'adjustedZ') {
          diff = b.adjustedZ - a.adjustedZ;
        } else if (sortBy === 'yahooAdp') {
          diff = a.yahooAdp - b.yahooAdp;
        } else {
          diff = (b.stats[sortBy] ?? 0) - (a.stats[sortBy] ?? 0);
        }
        return sortAsc ? -diff : diff;
      });
  }, [players, hideDrafted, draftedIds, userRosterIds, searchQuery, selectedPosition, sortBy, sortAsc]);

  const handleSort = (field: 'adjustedZ' | 'yahooAdp' | 'pts' | 'ast' | 'reb' | 'blk' | 'stl') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(field === 'yahooAdp'); // ADP lower number is higher draft pick
    }
  };

  const getZColor = (z: number) => {
    if (z >= 6.0) return 'text-emerald-400 font-extrabold';
    if (z >= 4.0) return 'text-emerald-300 font-bold';
    if (z >= 2.0) return 'text-slate-200 font-medium';
    if (z >= 0.0) return 'text-slate-400';
    return 'text-rose-400 font-medium';
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Controls Bar */}
      <div className="p-3.5 border-b border-slate-800 bg-[#0E1420] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Hide Drafted Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search NBA player or team..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-52 sm:w-64 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideDrafted}
              onChange={e => setHideDrafted(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
            />
            <span>Hide Drafted</span>
          </label>
        </div>

        {/* Position Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {['All', 'PG', 'SG', 'G', 'SF', 'PF', 'F', 'C'].map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedPosition === pos
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold tracking-wider uppercase text-[10px]">
              <th className="py-2.5 px-3 whitespace-nowrap">#</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Player / Team</th>
              <th
                onClick={() => handleSort('adjustedZ')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Adj. Z {sortBy === 'adjustedZ' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th
                onClick={() => handleSort('yahooAdp')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                Yahoo ADP {sortBy === 'yahooAdp' ? (sortAsc ? '↑' : '↓') : ''}
              </th>
              <th
                onClick={() => handleSort('pts')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                  punts.pts ? 'opacity-40 line-through text-amber-500' : ''
                }`}
              >
                PTS
              </th>
              <th
                onClick={() => handleSort('reb')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                  punts.reb ? 'opacity-40 line-through text-amber-500' : ''
                }`}
              >
                REB
              </th>
              <th
                onClick={() => handleSort('ast')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                  punts.ast ? 'opacity-40 line-through text-amber-500' : ''
                }`}
              >
                AST
              </th>
              <th className={`py-2.5 px-2.5 text-right whitespace-nowrap ${punts.tpm ? 'opacity-40 line-through text-amber-500' : ''}`}>
                3PM
              </th>
              <th
                onClick={() => handleSort('stl')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                  punts.stl ? 'opacity-40 line-through text-amber-500' : ''
                }`}
              >
                STL
              </th>
              <th
                onClick={() => handleSort('blk')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap ${
                  punts.blk ? 'opacity-40 line-through text-amber-500' : ''
                }`}
              >
                BLK
              </th>
              <th className={`py-2.5 px-2.5 text-right whitespace-nowrap ${punts.fgPct ? 'opacity-40 line-through text-amber-500' : ''}`}>
                FG%
              </th>
              <th className={`py-2.5 px-2.5 text-right whitespace-nowrap ${punts.ftPct ? 'opacity-40 line-through text-amber-500' : ''}`}>
                FT%
              </th>
              <th className={`py-2.5 px-2.5 text-right whitespace-nowrap ${punts.to ? 'opacity-40 line-through text-amber-500' : ''}`}>
                TO
              </th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-500 font-sans">
                  No matching available players found.
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player, index) => {
                const isDraftedByUser = userRosterIds.has(player.id);
                const isDraftedByOther = draftedIds.has(player.id);
                const isDrafted = isDraftedByUser || isDraftedByOther;
                const isCompared = comparedIds.has(player.id);

                // Value over ADP: if rank in our Z-score is higher than ADP, it's a steal!
                const overallRank = index + 1;
                const adpDelta = Number((player.yahooAdp - overallRank).toFixed(1));

                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-slate-800/40 transition-colors h-10 ${
                      isDraftedByUser
                        ? 'bg-violet-950/20'
                        : isDraftedByOther
                        ? 'opacity-40 bg-slate-950/40'
                        : ''
                    }`}
                  >
                    {/* Rank index */}
                    <td className="py-2 px-3 text-slate-500 text-[11px] font-bold">
                      {overallRank}
                    </td>

                    {/* Player Name, Team, Positions (Clean unboxed text) */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 font-sans">
                        <button
                          onClick={() => onInspectPlayer(player)}
                          className="font-bold text-white hover:text-violet-400 transition-colors text-left truncate max-w-[150px] sm:max-w-xs cursor-pointer"
                        >
                          {player.name}
                        </button>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {player.team} · {player.positions.join('/')}
                        </span>
                        {player.tier === 1 && (
                          <span title="Tier 1 Cornerstone" className="text-amber-400 text-[10px]">★</span>
                        )}
                      </div>
                    </td>

                    {/* Adjusted Z-score */}
                    <td className={`py-2 px-3 text-right font-bold text-xs ${getZColor(player.adjustedZ)}`}>
                      {player.adjustedZ > 0 ? `+${player.adjustedZ}` : player.adjustedZ}
                    </td>

                    {/* Yahoo ADP & Steal/Reach Delta */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <span className="text-slate-300 font-mono-numbers">{player.yahooAdp.toFixed(1)}</span>
                        {adpDelta >= 3.0 && (
                          <span
                            title={`Projected ${adpDelta} spots ahead of ADP (Value Steal)`}
                            className="text-[10px] text-emerald-400 font-bold flex items-center font-mono-numbers"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            +{Math.round(adpDelta)}
                          </span>
                        )}
                        {adpDelta <= -5.0 && (
                          <span
                            title={`Projected ${Math.abs(adpDelta)} spots behind ADP (Reach)`}
                            className="text-[10px] text-rose-400 font-medium flex items-center font-mono-numbers"
                          >
                            <ArrowDownRight className="w-3 h-3" />
                            {Math.round(adpDelta)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 9 Categories */}
                    <td className={`py-2 px-2.5 text-right ${punts.pts ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.pts.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.reb ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.reb.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.ast ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.ast.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.tpm ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.tpm.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.stl ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.stl.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.blk ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.blk.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.fgPct ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.fgPct.toFixed(1)}%
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.ftPct ? 'opacity-30' : 'text-slate-200'}`}>
                      {player.stats.ftPct.toFixed(1)}%
                    </td>
                    <td className={`py-2 px-2.5 text-right ${punts.to ? 'opacity-30' : 'text-slate-400'}`}>
                      {player.stats.to.toFixed(1)}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-sans">
                        {isDraftedByUser ? (
                          <span className="text-[11px] font-bold text-violet-400 px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/50">
                            My Team
                          </span>
                        ) : isDraftedByOther ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Taken
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => onDraftPlayer(player)}
                              title="Draft to My Roster"
                              className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Draft
                            </button>
                            <button
                              onClick={() => onMarkTaken(player)}
                              title="Mark Drafted by Other Team"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Taken
                            </button>
                            <button
                              onClick={() => onToggleCompare(player)}
                              title="Add to Head-to-Head Compare"
                              className={`p-1 rounded text-[11px] transition-colors cursor-pointer ${
                                isCompared
                                  ? 'bg-amber-600 text-white'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
