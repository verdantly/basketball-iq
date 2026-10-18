import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Play, Square, CheckCircle2, AlertTriangle, RefreshCw, X, Eye, Sparkles } from 'lucide-react';
import { Player, VisionDetectionItem, VisionDetectionResponse } from '../types/fantasy';

interface BoardVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlayers: Player[];
  onApplyDetectedPicks: (detectedPicks: VisionDetectionItem[]) => void;
}

export const BoardVisionModal: React.FC<BoardVisionModalProps> = ({
  isOpen,
  onClose,
  availablePlayers,
  onApplyDetectedPicks,
}) => {
  const [activeMode, setActiveMode] = useState<'screen' | 'upload' | 'demo'>('screen');
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionDetectionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanIntervalRef = useRef<any>(null);

  // Stop stream when closing modal
  useEffect(() => {
    if (!isOpen) {
      stopScreenCapture();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScreenCapture();
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
    };
  }, []);

  // Listen for clipboard paste
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setPreviewImage(base64);
              setActiveMode('upload');
              analyzeImage(base64);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const startScreenCapture = async () => {
    setErrorMsg(null);
    try {
      // In iframes, getDisplayMedia requires display-capture permission or standard prompt
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturingScreen(true);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenCapture();
      };
    } catch (err: any) {
      console.warn('Screen capture error:', err);
      setErrorMsg('Could not share screen window. You can also paste or upload a screenshot directly.');
      setIsCapturingScreen(false);
    }
  };

  const stopScreenCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturingScreen(false);
    setAutoScanEnabled(false);
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
  };

  const captureFrameAndAnalyze = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(base64);
    analyzeImage(base64);
  };

  // Auto scan interval handling
  useEffect(() => {
    if (autoScanEnabled && isCapturingScreen) {
      autoScanIntervalRef.current = setInterval(() => {
        if (!isAnalyzing) {
          captureFrameAndAnalyze();
        }
      }, 25000);
    } else {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    }
    return () => {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
    };
  }, [autoScanEnabled, isCapturingScreen, isAnalyzing]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const generateDemoDraftBoard = () => {
    // Generates a mock visual Yahoo Draft Board snapshot with real player picks for demonstration
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background dark Yahoo UI
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 700);

    // Header bar
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, 1200, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('YAHOO! FANTASY BASKETBALL — LIVE DRAFT ROOM (9-CAT H2H)', 30, 40);

    // Round 1 header
    ctx.fillStyle = '#334155';
    ctx.fillRect(30, 80, 1140, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ROUND 1 PICKS (COMPLETED)', 45, 104);

    const demoPicks = [
      { pick: 1, team: 'Team Ballers', player: 'Victor Wembanyama', pos: 'C, PF', teamNba: 'SAS' },
      { pick: 2, team: 'Joker Wild', player: 'Nikola Jokic', pos: 'C', teamNba: 'DEN' },
      { pick: 3, team: 'Thunder Up', player: 'Shai Gilgeous-Alexander', pos: 'PG, SG', teamNba: 'OKC' },
      { pick: 4, team: 'Mavs Dynasty', player: 'Luka Doncic', pos: 'PG, SG', teamNba: 'DAL' },
      { pick: 5, team: 'Greek Freaks', player: 'Giannis Antetokounmpo', pos: 'PF, C', teamNba: 'MIL' },
      { pick: 6, team: 'Showtime', player: 'Anthony Davis', pos: 'PF, C', teamNba: 'LAL' },
    ];

    demoPicks.forEach((p, index) => {
      const y = 130 + index * 85;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, y, 1140, 75);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(30, y, 1140, 75);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`#${p.pick}`, 50, y + 45);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(p.player, 120, y + 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Drafted by: ${p.team}  |  Positions: ${p.pos}  |  Team: ${p.teamNba}`, 120, y + 60);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('DRAFTED', 1040, y + 45);
    });

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(base64);
    analyzeImage(base64);
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setVisionResult(null);

    try {
      const candidateNames = availablePlayers.slice(0, 80).map(p => p.name);
      const res = await fetch('/api/ai/scan-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
          candidatePlayerNames: candidateNames,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Server error inspecting board image');
      }

      const data: VisionDetectionResponse = await res.json();

      // Correlate detected player names to local player IDs
      const enrichedPicks = (data.detectedDrafted || []).map(item => {
        const matched = availablePlayers.find(
          p => p.name.toLowerCase().trim() === item.playerName.toLowerCase().trim()
        );
        return {
          ...item,
          matchedPlayerId: matched?.id,
          matchedPlayerName: matched?.name || item.playerName,
        };
      });

      setVisionResult({
        ...data,
        detectedDrafted: enrichedPicks,
      });
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze draft board screenshot.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!visionResult || !visionResult.detectedDrafted) return;
    onApplyDetectedPicks(visionResult.detectedDrafted);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Multimodal Draft Board Vision
              </h2>
              <p className="text-xs text-slate-400">
                Let Gemini 3.8 Flash visually inspect your live Yahoo Draft Room and sync picks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveMode('screen')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'screen'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Live Tab Screen Share
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'upload'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Paste or Upload Screenshot
          </button>
          <button
            onClick={() => {
              setActiveMode('demo');
              generateDemoDraftBoard();
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'demo'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Try Yahoo Demo Board
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeMode === 'screen' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    Share your Yahoo Draft Tab
                  </h4>
                  <p className="text-xs text-slate-400">
                    Select your active Yahoo Fantasy browser tab to let the AI watch the draft board live
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isCapturingScreen ? (
                    <button
                      onClick={startScreenCapture}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Select Yahoo Tab
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={captureFrameAndAnalyze}
                        disabled={isAnalyzing}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        Scan Board Now
                      </button>
                      <button
                        onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                          autoScanEnabled
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Auto-Scan (25s)
                      </button>
                      <button
                        onClick={stopScreenCapture}
                        className="p-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors"
                        title="Stop sharing"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${!isCapturingScreen ? 'hidden' : ''}`}
                />
                {!isCapturingScreen && (
                  <div className="text-center p-6">
                    <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">
                      No screen stream active. Click "Select Yahoo Tab" above or switch to Paste/Upload.
                    </p>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Gemini Vision Reading Yahoo Board...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMode === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-700 hover:border-violet-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 text-center block">
                <Upload className="w-8 h-8 text-violet-400 mb-2" />
                <span className="text-sm font-semibold text-slate-200">
                  Drop Yahoo Draft screenshot or click to browse
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  You can also press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">Ctrl+V</kbd> to paste directly from your clipboard
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {previewImage && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-black">
                  <img
                    src={previewImage}
                    alt="Captured draft board"
                    className="w-full h-auto object-contain max-h-72"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-white">
                        AI Scanning Draft Board...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeMode === 'demo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-violet-950/40 border border-violet-800/50 p-3.5 rounded-xl text-xs text-violet-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Simulated Yahoo Fantasy 9-Cat Draft Room (Testing Mode)
                  </span>
                </div>
                <button
                  onClick={generateDemoDraftBoard}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Regenerate Board
                </button>
              </div>

              {previewImage && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-black">
                  <img
                    src={previewImage}
                    alt="Demo draft board"
                    className="w-full h-auto object-contain max-h-72"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-white">
                        AI Scanning Demo Board...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vision Detection Results */}
          {visionResult && (
            <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Vision Scan Results ({visionResult.totalPicksFound} Picks Detected)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Confidence: <strong className="text-emerald-400 capitalize">{visionResult.overallConfidence}</strong>
                </span>
              </div>

              <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                "{visionResult.rawSummary}"
              </p>

              {visionResult.detectedDrafted.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {visionResult.detectedDrafted.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {item.pickNumber ? (
                          <span className="font-mono-numbers px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-bold">
                            #{item.pickNumber}
                          </span>
                        ) : null}
                        <span className="font-bold text-white">
                          {item.matchedPlayerName || item.playerName}
                        </span>
                        {item.teamName && (
                          <span className="text-[11px] text-slate-400">
                            ({item.teamName})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-bold">
                        DRAFTED
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  No drafted players found in this image frame. Make sure the draft board or recent picks feed is visible.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={visionResult.detectedDrafted.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Picks to Draft Board
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
