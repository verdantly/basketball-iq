import React from 'react';
import { DraftPick, Player } from '../types/fantasy';

interface DraftGridProps {
  totalTeams: number;
  userSlot: number;
  currentPick: number;
  draftHistory: DraftPick[];
  allPlayers: Player[];
  onInspectPlayer: (player: Player) => void;
}

export const DraftGrid: React.FC<DraftGridProps> = ({
  totalTeams = 12,
  userSlot = 4,
  currentPick,
  draftHistory,
  allPlayers,
  onInspectPlayer,
}) => {
  const totalRounds = 13;
  const pickMap = new Map<number, DraftPick>();
  draftHistory.forEach(p => pickMap.set(p.pickNumber, p));

  // Build grid matrix: 13 rounds x 12 teams
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const teams = Array.from({ length: totalTeams }, (_, i) => i + 1);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            12-Team Snake Draft Board
          </h3>
          <p className="text-xs text-slate-400">
            Your draft position: <strong className="text-violet-400">Team #{userSlot}</strong> (Highlighted)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />
            <span className="text-slate-300">My Picks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="text-slate-300">On The Clock</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full border-collapse text-[11px] font-mono-numbers">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0E1420]">
              <th className="p-2 text-slate-500 font-sans text-left">Round</th>
              {teams.map(teamNum => (
                <th
                  key={teamNum}
                  className={`p-2 text-center whitespace-nowrap min-w-[100px] font-sans ${
                    teamNum === userSlot
                      ? 'bg-violet-950/60 text-violet-300 font-bold border-x border-violet-800/40'
                      : 'text-slate-400'
                  }`}
                >
                  {teamNum === userSlot ? `Team ${teamNum} (You)` : `Team ${teamNum}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rounds.map(roundNum => {
              const isEvenRound = roundNum % 2 === 0;

              return (
                <tr key={roundNum} className="hover:bg-slate-800/20">
                  <td className="p-2 text-slate-500 font-bold font-sans">
                    R{roundNum}
                  </td>

                  {teams.map(teamNum => {
                    // In a snake draft:
                    // Odd round: Team 1 -> 12
                    // Even round: Team 12 -> 1
                    const pickInRound = isEvenRound ? totalTeams - teamNum + 1 : teamNum;
                    const overallPickNumber = (roundNum - 1) * totalTeams + pickInRound;
                    const pick = pickMap.get(overallPickNumber);
                    const isCurrent = overallPickNumber === currentPick;
                    const isUserCell = teamNum === userSlot;

                    return (
                      <td
                        key={teamNum}
                        className={`p-1.5 text-center transition-colors border-r border-slate-800/40 ${
                          isUserCell ? 'bg-violet-950/20' : ''
                        } ${isCurrent ? 'bg-amber-950/40 ring-1 ring-amber-500/80' : ''}`}
                      >
                        <div
                          className={`p-1.5 rounded-md text-left flex flex-col justify-between h-14 ${
                            pick
                              ? isUserCell
                                ? 'bg-violet-900/40 border border-violet-700/60'
                                : 'bg-slate-900 border border-slate-800'
                              : isCurrent
                              ? 'bg-amber-950/60 border border-amber-500/60'
                              : 'bg-slate-950/40 border border-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>#{overallPickNumber}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-amber-400 uppercase animate-pulse font-sans">
                                Clock
                              </span>
                            )}
                          </div>

                          {pick ? (
                            <button
                              onClick={() => pick.player && onInspectPlayer(pick.player)}
                              className="font-sans font-bold text-white text-[11px] truncate hover:text-violet-300 transition-colors cursor-pointer text-left block"
                              title={pick.player?.name}
                            >
                              {pick.player?.name.split(' ').slice(1).join(' ') || pick.player?.name}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic font-sans">
                              Open
                            </span>
                          )}

                          {pick?.player && (
                            <span className="text-[9px] text-slate-400 font-sans truncate">
                              {pick.player.team} · {pick.player.positions[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
