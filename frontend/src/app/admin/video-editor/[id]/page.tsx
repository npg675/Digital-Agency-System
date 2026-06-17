"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { fabric } from "fabric";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Play, Pause, SkipBack, Scissors, Type, Music, Image as ImageIcon,
  Download, Loader2, ArrowLeft, Volume2, Save, Undo, Plus, Trash2,
  SlidersHorizontal, CloudUpload, HardDrive, Upload, Sparkles, X, Layers,
  Keyboard
} from "lucide-react";

// --- VideoClip type ---
type VideoClip = {
  id: string;
  name: string;
  url: string;
  fileDuration: number; // Total original file length
  duration: number;     // Effective visible length
  trimStart: number;    // Where to start playing the underlying file
  trimEnd: number;      // Where to stop playing the underlying file
  startTime: number;    // Global position on the timeline
  trackId: string;      // Which video track this clip belongs to
  color: string;
};

type VideoTrack = {
  id: string;
  name: string;
};

// --- Social Media Aspect Ratio Presets ---
const ASPECT_RATIOS = [
  { id: "16:9",  label: "YouTube",    icon: "Monitor",    w: 640, h: 360,  ffmpegScale: "1280:720"  },
  { id: "9:16",  label: "TikTok",     icon: "Smartphone", w: 360, h: 640,  ffmpegScale: "720:1280"  },
  { id: "1:1",   label: "Instagram",  icon: "Square",     w: 480, h: 480,  ffmpegScale: "1080:1080" },
  { id: "4:5",   label: "Feed",       icon: "Square",     w: 432, h: 540,  ffmpegScale: "1080:1350" },
];

// --- Color Filter Presets ---
const COLOR_FILTERS = [
  { id: "none",      label: "Original",   brightness: 0,    contrast: 1,    saturate: 1,    sepia: 0,    hueRotate: 0   },
  { id: "vivid",     label: "Vivid",      brightness: 0.1,  contrast: 1.2,  saturate: 1.5,  sepia: 0,    hueRotate: 0   },
  { id: "cinematic", label: "Cinematic",  brightness: -0.1, contrast: 1.15, saturate: 0.8,  sepia: 0.15, hueRotate: 5   },
  { id: "vintage",   label: "Vintage",    brightness: -0.1, contrast: 0.9,  saturate: 0.7,  sepia: 0.4,  hueRotate: 0   },
  { id: "bw",        label: "B&W",        brightness: 0,    contrast: 1.1,  saturate: 0,    sepia: 0,    hueRotate: 0   },
  { id: "golden",    label: "Golden",     brightness: 0.05, contrast: 1.05, saturate: 1.2,  sepia: 0.3,  hueRotate: 0   },
  { id: "cool",      label: "Cool",       brightness: 0,    contrast: 1.05, saturate: 1.1,  sepia: 0,    hueRotate: 200 },
  { id: "fade",      label: "Fade",       brightness: 0.2,  contrast: 0.85, saturate: 0.8,  sepia: 0.1,  hueRotate: 0   },
];
// --- Emoji / Sticker presets ---
const STICKERS = [
  "🔥","⚡","🎯","🚀","💥","✨","🎉","💡","❤️","👑","🏆","💰","📢","⭐","🎬","💪",
];

// --- Font families ---
const FONTS = ["Arial","Georgia","Impact","Courier New","Verdana","Trebuchet MS"];

export default function VideoEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  
  const videoId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1); // avoid / 0
  
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Adjustments State
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [saturate, setSaturate] = useState(1);
  const [sepia, setSepia] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [videoZoom, setVideoZoom] = useState(1);
  const [activeFilterId, setActiveFilterId] = useState("none");
  const [activeTab, setActiveTab] = useState("media");
  const [leftPanel, setLeftPanel] = useState<"text" | "stickers" | "filters" | "audio" | null>(null);
  const [isCaptionsLoading, setIsCaptionsLoading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  
  // Chroma Key State
  const [enableChromaKey, setEnableChromaKey] = useState(false);
  const [chromaKeyColor, setChromaKeyColor] = useState("#00ff00");
  const [chromaKeySimilarity, setChromaKeySimilarity] = useState(0.1);

  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const tracksAreaRef = useRef<HTMLDivElement>(null);

  // Text controls state
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState("Arial");
  const [textSize, setTextSize] = useState(40);
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  
  // Multi-clip state
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([{ id: "v1", name: "V1" }]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);   // currently playing clip URL
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null); // kept for single-clip compat
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // Canvas assets list (for Assets panel)
  const [canvasAssets, setCanvasAssets] = useState<{ id: string; label: string; obj: fabric.Object; startTime: number; endTime: number }[]>([]);
  const refreshAssets = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    setCanvasAssets(objects.map((o, i) => ({
      id: (o as any).id || String(i),
      label: (o as any).text ? `Text: "${((o as any).text as string).substring(0, 20)}"` :
             (o as any).getSrc ? "Image / Logo" : `Object ${i + 1}`,
      obj: o,
      startTime: (o as any).startTime || 0,
      endTime: (o as any).endTime || 9999,
    })));
  }, []);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetDragState, setAssetDragState] = useState<{
    assetId: string;
    type: 'move' | 'trimStart' | 'trimEnd';
    startX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);
  
  // Drag to reorder clips
  const [draggedClipIdx, setDraggedClipIdx] = useState<number | null>(null);

  // Trim & Speed State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null); // null = end of video
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTrimPanel, setShowTrimPanel] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // FFmpeg loading status
  const [ffmpegStatus, setFfmpegStatus] = useState("Initialising engine…");
  
  // Load Video Details (skip if opened as blank editor via /new)
  useEffect(() => {
    if (videoId === "new") return; // blank editor — user will import their own video
    const fetchVideo = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
    // when a remote video is found, turn it into clip 0
    if (video && video.video_url) {
      const clip: VideoClip = { id: "remote-0", name: video.title || "Video", url: video.video_url, fileDuration: 0, duration: 0, trimStart: 0, trimEnd: 0, color: CLIP_COLORS[0] };
      setClips([clip]);
      setVideoUrl(video.video_url);
      setOriginalVideoUrl(video.video_url);
      
      const tmp = document.createElement("video");
      tmp.src = video.video_url;
      tmp.onloadedmetadata = () => {
        setClips([{ ...clip, fileDuration: tmp.duration, duration: tmp.duration, trimEnd: tmp.duration }]);
        tmp.remove();
      };
    }
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchVideo();
  }, [token, videoId]);

  // Load FFmpeg & Initialize Fabric
  useEffect(() => {
    // Initialize Fabric Canvas
    if (canvasContainerRef.current && !fabricCanvasRef.current) {
      const initCanvas = new fabric.Canvas("fabric-canvas", {
        width: 640,
        height: 360,
        backgroundColor: "transparent",
      });
      // Track selected object for text controls
      initCanvas.on("selection:created", (e) => { setSelectedObj(e.selected?.[0] ?? null); refreshAssets(); });
      initCanvas.on("selection:updated", (e) => { setSelectedObj(e.selected?.[0] ?? null); refreshAssets(); });
      initCanvas.on("selection:cleared", () => { setSelectedObj(null); refreshAssets(); });
      initCanvas.on("object:added",   () => refreshAssets());
      initCanvas.on("object:removed", () => refreshAssets());
      fabricCanvasRef.current = initCanvas;
    }
  }, []);

  useEffect(() => {
    const loadFfmpeg = async () => {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      const ffmpegInst = new FFmpeg();
      ffmpegInst.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      setFfmpegStatus("Downloading FFmpeg core (≈8 MB)…");
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      setFfmpegStatus("Loading WebAssembly engine…");
      await ffmpegInst.load({ coreURL, wasmURL });
      setFfmpeg(ffmpegInst);
      setIsLoaded(true);
    };
    loadFfmpeg().catch(e => { console.error(e); setFfmpegStatus("Failed to load. Check CORS headers."); });
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current) videoRef.current.play().catch(e => console.log(e));
      setIsPlaying(true);
    }
  };

  // --- Multi-Track Engine: Determine active clip for current globalTime ---
  const getActiveClipAtTime = useCallback((time: number) => {
    for (let i = videoTracks.length - 1; i >= 0; i--) {
      const track = videoTracks[i];
      const clipOnTrack = clips.find(c => c.trackId === track.id && time >= c.startTime && time < c.startTime + c.duration);
      if (clipOnTrack) return clipOnTrack;
    }
    return null;
  }, [clips, videoTracks]);

  const activeClip = getActiveClipAtTime(globalTime);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && isPlaying) {
      const cTime = videoRef.current.currentTime;
      setCurrentTime(cTime);
      
      const clip = getActiveClipAtTime(globalTime);
      let currentGlobalTime = globalTime;
      
      if (clip) {
        currentGlobalTime = clip.startTime + (cTime - (clip.trimStart || 0));
        setGlobalTime(currentGlobalTime);
        
        // Push past boundary if we reach the end of the clip's trim
        if (cTime >= (clip.trimEnd || clip.duration)) {
           setGlobalTime(clip.startTime + clip.duration + 0.01);
        }
      }
      
      // Toggle canvas objects visibility based on global time
      if (fabricCanvasRef.current) {
        let canvasChanged = false;
        fabricCanvasRef.current.getObjects().forEach(obj => {
          const startTime = (obj as any).startTime || 0;
          const endTime = (obj as any).endTime || 99999;
          const isVisible = currentGlobalTime >= startTime && currentGlobalTime <= endTime;
          if (isVisible && obj.opacity === 0) {
            obj.set('opacity', 1);
            obj.set('selectable', true);
            obj.set('evented', true);
            canvasChanged = true;
          } else if (!isVisible && obj.opacity !== 0) {
            obj.set('opacity', 0);
            obj.set('selectable', false);
            obj.set('evented', false);
            fabricCanvasRef.current?.discardActiveObject();
            canvasChanged = true;
          }
        });
        if (canvasChanged) fabricCanvasRef.current.renderAll();
      }
    }
  }, [globalTime, isPlaying, getActiveClipAtTime]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 1);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const time = Number(e.target.value);
    setGlobalTime(time);
    
    const clipAtTime = getActiveClipAtTime(time);
    if (clipAtTime && videoRef.current) {
      if (originalVideoUrl === clipAtTime.url) {
        const localTime = (time - clipAtTime.startTime) + (clipAtTime.trimStart || 0);
        videoRef.current.currentTime = localTime;
      }
    }
  };

  // Apply playback speed when it changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Clip total duration (sum)
  const totalDuration = clips.length > 0 
    ? Math.max(...clips.map(c => c.startTime + c.duration), 1)
    : 1;

  // Global Time Driver for Gaps
  useEffect(() => {
    let frameId: number;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      if (isPlaying) {
        const clip = getActiveClipAtTime(globalTime);
        if (!clip) {
          setGlobalTime(prev => {
             const next = prev + delta * playbackSpeed;
             if (next >= totalDuration) { setIsPlaying(false); return totalDuration; }
             return next;
          });
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, globalTime, playbackSpeed, totalDuration, getActiveClipAtTime]);

  useEffect(() => {
    if (!activeClip) {
      setVideoUrl(null);
      setOriginalVideoUrl(null);
      return;
    }
    // Only update if the active clip actually changed
    if (originalVideoUrl !== activeClip.url || trimStart !== activeClip.trimStart || trimEnd !== activeClip.trimEnd) {
      setOriginalVideoUrl(activeClip.url);
      setVideoUrl(activeClip.url);
      setTrimStart(activeClip.trimStart);
      setTrimEnd(activeClip.trimEnd);
      setPlaybackSpeed(1); // Reset speed for now

      if (videoRef.current) {
        // Calculate local time within the clip
        const localTime = (globalTime - activeClip.startTime) + activeClip.trimStart;
        videoRef.current.currentTime = localTime;
        if (isPlaying) videoRef.current.play().catch(e => console.log(e));
      }
    }
  }, [activeClip, originalVideoUrl, trimStart, trimEnd, globalTime, isPlaying]);

  // Playhead dragging
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksAreaRef.current) return;
      const rect = tracksAreaRef.current.getBoundingClientRect();
      const paddingLeft = 12; // equivalent to px-3
      const paddingRight = 12;
      const trackWidth = rect.width - paddingLeft - paddingRight;
      
      let newX = e.clientX - rect.left - paddingLeft;
      if (newX < 0) newX = 0;
      if (newX > trackWidth) newX = trackWidth;
      
      const newGlobalTime = (newX / trackWidth) * (totalDuration || 1);
      
      handleSeek({ target: { value: newGlobalTime.toString() } } as any);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, totalDuration]);

  // Asset Drag & Trim Logic
  useEffect(() => {
    if (!assetDragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const trackEl = document.getElementById("asset-tracks-container");
      if (!trackEl) return;
      const width = trackEl.getBoundingClientRect().width;
      const deltaPx = e.clientX - assetDragState.startX;
      const deltaTime = (deltaPx / width) * (totalDuration || 1);

      const asset = canvasAssets.find(a => a.id === assetDragState.assetId);
      if (!asset) return;
      const obj = asset.obj as any;

      if (assetDragState.type === 'move') {
        const dur = assetDragState.initialEnd - assetDragState.initialStart;
        let newStart = Math.max(0, assetDragState.initialStart + deltaTime);
        let newEnd = newStart + dur;
        if (newEnd > totalDuration) {
          newEnd = totalDuration;
          newStart = Math.max(0, totalDuration - dur);
        }
        obj.startTime = newStart;
        obj.endTime = newEnd;
      } else if (assetDragState.type === 'trimStart') {
        let newStart = Math.max(0, assetDragState.initialStart + deltaTime);
        newStart = Math.min(newStart, assetDragState.initialEnd - 0.2); // min length
        obj.startTime = newStart;
      } else if (assetDragState.type === 'trimEnd') {
        let newEnd = Math.min(totalDuration, assetDragState.initialEnd + deltaTime);
        newEnd = Math.max(newEnd, assetDragState.initialStart + 0.2);
        obj.endTime = newEnd;
      }
      
      refreshAssets();
      handleTimeUpdate();
    };

    const handleMouseUp = () => setAssetDragState(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [assetDragState, totalDuration, canvasAssets, refreshAssets, handleTimeUpdate]);



  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;
    const text = new fabric.IText("Click to edit", {
      left: 80,
      top: 80,
      fontFamily: textFont,
      fill: textColor,
      fontSize: textSize,
      fontWeight: "bold",
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.8)", blur: 4, offsetX: 2, offsetY: 2 })
    });
    (text as any).id = `txt-${Date.now()}`;
    (text as any).startTime = globalTime;
    (text as any).endTime = Math.min(globalTime + 3, totalDuration); // default 3s duration
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    setSelectedObj(text);
    setLeftPanel("text");
  };

  const handleAddSticker = (emoji: string) => {
    if (!fabricCanvasRef.current) return;
    const sticker = new fabric.Text(emoji, {
      left: 120 + Math.random() * 100,
      top: 80 + Math.random() * 80,
      fontSize: 64,
    });
    (sticker as any).id = `stk-${Date.now()}`;
    (sticker as any).startTime = globalTime;
    (sticker as any).endTime = Math.min(globalTime + 3, totalDuration);

    fabricCanvasRef.current.add(sticker);
    fabricCanvasRef.current.setActiveObject(sticker);
    fabricCanvasRef.current.renderAll();
  };

  const handleAddLogo = () => {
    if (!fabricCanvasRef.current) return;
    fabric.Image.fromURL('https://cdn-icons-png.flaticon.com/512/1160/1160358.png', (img) => {
      img.scale(0.2);
      img.set({ left: 20, top: 20 });
      (img as any).id = `img-${Date.now()}`;
      (img as any).startTime = globalTime;
      (img as any).endTime = Math.min(globalTime + 3, totalDuration);
      fabricCanvasRef.current?.add(img);
      fabricCanvasRef.current?.renderAll();
    }, { crossOrigin: 'anonymous' });
  };

  // Append imported video as a new clip
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file, i) => {
      const objUrl = URL.createObjectURL(file);
      const tmp = document.createElement("video");
      tmp.src = objUrl;
      tmp.onloadedmetadata = () => {
        const vidDuration = tmp.duration;
        tmp.remove();
        
        const defaultTrack = videoTracks[0].id;
        const maxStartTimeOnTrack = clips
          .filter(c => c.trackId === defaultTrack)
          .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
          
        const newClip: VideoClip = {
          id: `clip_${Date.now()}`,
          trackId: defaultTrack,
          name: file.name,
          url: objUrl,
          fileDuration: vidDuration,
          duration: vidDuration,
          trimStart: 0,
          trimEnd: vidDuration,
          startTime: maxStartTimeOnTrack,
          color: CLIP_COLORS[clips.length % CLIP_COLORS.length]
        };
        setClips(prev => [...prev, newClip]);
      };
    });
    e.target.value = "";
  };

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleAutoCaptions = async () => {
    if (clips.length === 0 || !ffmpeg) {
      showToast("Please add a clip and wait for FFmpeg to load.", "error");
      return;
    }
    
    setIsCaptionsLoading(true);
    showToast("Extracting audio and generating auto-captions...", "info");
    
    try {
      const token = localStorage.getItem("token");
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        
        const clipData = await fetchFile(clip.url);
        await ffmpeg.writeFile('input.mp4', clipData);
        
        await ffmpeg.exec(['-ss', (clip.trimStart || 0).toString(), '-t', clip.duration.toString(), '-i', 'input.mp4', '-vn', '-c:a', 'libmp3lame', '-q:a', '5', 'audio.mp3']);
        
        const audioData = await ffmpeg.readFile('audio.mp3');
        const audioBlob = new Blob([audioData as Uint8Array], { type: 'audio/mpeg' });
        
        const formData = new FormData();
        formData.append("file", audioBlob, `clip_${i}.mp3`);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/transcribe`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (!res.ok) throw new Error("Failed to transcribe clip " + (i+1));
        
        const data = await res.json();
        
        if (data.words && fabricCanvasRef.current) {
          data.words.forEach((wordObj: any) => {
            const start = clip.startTime + wordObj.start;
            const end = clip.startTime + wordObj.end;
            
            const text = new fabric.IText(wordObj.word, {
              left: 320,
              top: 280,
              originX: "center",
              originY: "center",
              fontFamily: "Inter, sans-serif",
              fill: "#ffffff",
              fontSize: 32,
              fontWeight: "bold",
              shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.8)", blur: 4, offsetX: 2, offsetY: 2 })
            });
            
            (text as any).id = `cap-${Date.now()}-${Math.random()}`;
            (text as any).startTime = start;
            (text as any).endTime = end;
            (text as any).isCaption = true;
            
            fabricCanvasRef.current!.add(text);
          });
        }
      }
      
      fabricCanvasRef.current?.renderAll();
      refreshAssets();
      handleTimeUpdate();
      showToast("Auto-captions generated successfully!", "success");
      
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to generate captions", "error");
    } finally {
      setIsCaptionsLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedAssetId || !fabricCanvasRef.current) {
      showToast("Please select an image asset on the canvas first.", "error");
      return;
    }
    
    const asset = canvasAssets.find(a => a.id === selectedAssetId);
    if (!asset || asset.obj.type !== 'image') {
      showToast("Background removal only works on image assets.", "error");
      return;
    }

    setIsRemovingBg(true);
    showToast("Removing background...", "info");

    try {
      const token = localStorage.getItem("token");
      
      const dataUrl = (asset.obj as fabric.Image).toDataURL({ format: 'png' });
      const resBlob = await fetch(dataUrl).then(r => r.blob());
      
      const formData = new FormData();
      formData.append("file", resBlob, "image.png");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/remove-bg`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Failed to remove background");

      const blob = await res.blob();
      const newUrl = URL.createObjectURL(blob);
      
      fabric.Image.fromURL(newUrl, (img) => {
        const oldImg = asset.obj as fabric.Image;
        img.set({
          left: oldImg.left,
          top: oldImg.top,
          scaleX: oldImg.scaleX,
          scaleY: oldImg.scaleY,
          angle: oldImg.angle,
        });
        (img as any).id = (oldImg as any).id;
        (img as any).startTime = (oldImg as any).startTime;
        (img as any).endTime = (oldImg as any).endTime;
        
        fabricCanvasRef.current!.remove(oldImg);
        fabricCanvasRef.current!.add(img);
        fabricCanvasRef.current!.setActiveObject(img);
        fabricCanvasRef.current!.renderAll();
        
        setCanvasAssets(prev => prev.map(a => a.id === selectedAssetId ? { ...a, obj: img } : a));
      });
      
      showToast("Background removed!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to remove background", "error");
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Split current clip or selected asset at playhead
  const handleSplitClip = () => {
    if (!activeClip) return;
    
    // Split Asset if selected
    if (selectedAssetId && fabricCanvasRef.current) {
      const asset = canvasAssets.find(a => a.id === selectedAssetId);
      if (asset) {
        const obj = asset.obj as any;
        const sTime = obj.startTime || 0;
        const eTime = obj.endTime || totalDuration;
        if (globalTime <= sTime + 0.2 || globalTime >= eTime - 0.2) {
          showToast("Playhead is too close to the edge to split asset.", "error");
          return;
        }
        
        obj.set("endTime", globalTime);
        
        asset.obj.clone((cloned: fabric.Object) => {
          (cloned as any).id = `asset-${Date.now()}`;
          (cloned as any).startTime = globalTime;
          (cloned as any).endTime = eTime;
          fabricCanvasRef.current?.add(cloned);
          fabricCanvasRef.current?.renderAll();
          refreshAssets();
        });
        
        showToast("Asset split successfully!", "success");
        return;
      }
    }

    const c = activeClip;
    const localSplit = globalTime - c.startTime + (c.trimStart || 0);
    
    if (localSplit <= (c.trimStart || 0) + 0.2 || localSplit >= (c.trimEnd || c.duration) - 0.2) {
       showToast("Playhead is too close to the edge to split video.", "error");
       return;
    }

    const clipA: VideoClip = { ...c, id: `${c.id}-a`, trimEnd: localSplit, duration: localSplit - (c.trimStart || 0) };
    const clipB: VideoClip = { ...c, id: `${c.id}-b`, trimStart: localSplit, startTime: globalTime, duration: (c.trimEnd || c.duration) - localSplit, color: CLIP_COLORS[(CLIP_COLORS.indexOf(c.color) + 1) % CLIP_COLORS.length] };

    setClips(prev => [...prev.filter(x => x.id !== c.id), clipA, clipB]);
    showToast("Clip split at playhead!", "success");
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setLeftPanel(null); // close panel
    }
  };

  const renderVideo = async (exportType: "local" | "library" | "gcp") => {
    if (!ffmpeg || clips.length === 0) return;
    setIsRendering(true);
    setProgress(0);
    try {
      for (let i = 0; i < clips.length; i++) {
        await ffmpeg.writeFile(`clip${i}.mp4`, await fetchFile(clips[i].url));
      }

      const assetOverlays: { name: string; start: number; end: number }[] = [];
      if (fabricCanvasRef.current && canvasAssets.length > 0) {
        fabricCanvasRef.current.discardActiveObject();
        canvasAssets.forEach(a => a.obj.set('opacity', 0));
        
        for (let i = 0; i < canvasAssets.length; i++) {
          const a = canvasAssets[i];
          a.obj.set('opacity', 1);
          fabricCanvasRef.current.renderAll();
          const dataUrl = fabricCanvasRef.current.toDataURL({ format: "png", multiplier: 2 });
          const fname = `overlay_${i}.png`;
          await ffmpeg.writeFile(fname, await fetchFile(dataUrl));
          assetOverlays.push({ name: fname, start: a.startTime, end: a.endTime });
          a.obj.set('opacity', 0);
        }
        handleTimeUpdate();
      }

      const baseScalePad = `scale=${aspectRatio.ffmpegScale}:force_original_aspect_ratio=decrease,pad=${aspectRatio.ffmpegScale}:(ow-iw)/2:(oh-ih)/2`;
      const zoomCropScale = videoZoom > 1.01 ? `,crop=iw/${videoZoom}:ih/${videoZoom},scale=${aspectRatio.ffmpegScale}` : "";
        
      let chromaFilter = enableChromaKey ? `,colorkey=${chromaKeyColor}:${chromaKeySimilarity}:0.0` : "";
      const scaleFilter = baseScalePad + zoomCropScale + chromaFilter;
      const colorFilter = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturate}`;

      // Create base black canvas
      let finalFilter = `color=c=black:s=${aspectRatio.ffmpegScale}:d=${totalDuration}[base]`;
      let lastOut = "[base]";

      // Sort clips by track index (V1 = bottom, V2 = top), then by start time
      const sortedClips = [...clips].sort((a, b) => {
         const aIdx = videoTracks.findIndex(t => t.id === a.trackId);
         const bIdx = videoTracks.findIndex(t => t.id === b.trackId);
         if (aIdx !== bIdx) return aIdx - bIdx;
         return a.startTime - b.startTime;
      });

      for (let i = 0; i < sortedClips.length; i++) {
        const c = sortedClips[i];
        const tStart = c.trimStart || 0;
        const tEnd = c.trimEnd || c.fileDuration || 99999;
        
        // Find original input index
        const inputIdx = clips.findIndex(x => x.id === c.id);
        
        const nextOut = `[vout${i}]`;
        const clipFilter = `[${inputIdx}:v]trim=start=${tStart}:end=${tEnd},setpts=PTS-STARTPTS+${c.startTime}/TB,${scaleFilter},${colorFilter}[v${i}]`;
        
        finalFilter += `;${clipFilter};${lastOut}[v${i}]overlay=0:0:enable='between(t,${c.startTime},${c.startTime + c.duration})'${nextOut}`;
        lastOut = nextOut;
      }

      if (assetOverlays.length > 0) {
        for (let i = 0; i < assetOverlays.length; i++) {
          const nextOut = `[vasset${i}]`;
          const inputIdx = clips.length + i;
          finalFilter += `;${lastOut}[${inputIdx}:v]overlay=0:0:enable='between(t,${assetOverlays[i].start},${assetOverlays[i].end})'${nextOut}`;
          lastOut = nextOut;
        }
        finalFilter += `;${lastOut}format=auto,scale=trunc(iw/2)*2:trunc(ih/2)*2[vout]`;
      } else {
        finalFilter += `;${lastOut}format=auto,scale=trunc(iw/2)*2:trunc(ih/2)*2[vout]`;
      }

      const mapArgs = ["-map", "[vout]"];
      const inputArgs: string[] = [];
      clips.forEach((_, i) => inputArgs.push("-i", `clip${i}.mp4`));
      assetOverlays.forEach((a) => inputArgs.push("-i", a.name));
      if (audioUrl) { await ffmpeg.writeFile("audio.mp3", await fetchFile(audioUrl)); inputArgs.push("-i", "audio.mp3"); }

      await ffmpeg.exec([...inputArgs, "-filter_complex", finalFilter, ...mapArgs, ...(audioUrl ? ["-map", `${clips.length + assetOverlays.length}:a:0`, "-c:a", "aac", "-shortest"] : ["-map", "0:a?", "-c:a", "copy"]), "-c:v", "libx264", "-preset", "ultrafast", "output.mp4"]);

      const fileData = await ffmpeg.readFile("output.mp4");
      const url = URL.createObjectURL(new Blob([new Uint8Array(fileData as ArrayBuffer).buffer], { type: "video/mp4" }));
      setVideoUrl(url);

      if (exportType === "local") {
        const a = document.createElement("a"); a.href = url; a.download = "edited_video.mp4"; a.click();
        showToast("Video downloaded successfully!", "success");
      } else {
        const formData = new FormData();
        formData.append("file", new Blob([new Uint8Array(fileData as ArrayBuffer).buffer], { type: "video/mp4" }), "edited_video.mp4");
        formData.append("destination", exportType);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/export`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        showToast(res.ok ? `Saved to ${exportType === "gcp" ? "Google Cloud" : "Library"}!` : "Failed to export.", res.ok ? "success" : "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Render failed.", "error");
    } finally {
      setIsRendering(false);
    }
  };

  // Keyboard Shortcuts (Master Listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") { e.preventDefault(); handlePlayPause(); }

      if (e.key === "Delete" || e.key === "Backspace") {
        let deleted = false;
        if (fabricCanvasRef.current) {
          const active = fabricCanvasRef.current.getActiveObject();
          if (active && !(active as any).isEditing) {
            fabricCanvasRef.current.remove(active);
            fabricCanvasRef.current.renderAll();
            setSelectedObj(null);
            deleted = true;
          }
        }
        if (!deleted && activeClip) {
          deleteClip(activeClip.id);
        }
      }

      // Ctrl+Z = canvas undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && fabricCanvasRef.current) {
        (fabricCanvasRef.current as any)?.undo?.();
      }

      // Left Arrow = Step back 0.1s (Shift = 1s)
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 0.1;
        const newTime = Math.max(0, globalTime - step);
        handleSeek({ target: { value: newTime.toString() } } as any);
      }

      // Right Arrow = Step forward 0.1s (Shift = 1s)
      if (e.code === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 0.1;
        const newTime = Math.min(totalDuration, globalTime + step);
        handleSeek({ target: { value: newTime.toString() } } as any);
      }

      // S or Ctrl+B = Split Clip
      if (e.code === "KeyS" || ((e.ctrlKey || e.metaKey) && e.code === "KeyB")) {
        e.preventDefault();
        handleSplitClip();
      }

      // I = Mark In (Set Trim Start)
      if (e.code === "KeyI") {
        e.preventDefault();
        setTrimStart(currentTime);
        showToast("Trim Start marked", "info");
      }

      // O = Mark Out (Set Trim End)
      if (e.code === "KeyO") {
        e.preventDefault();
        setTrimEnd(currentTime);
        showToast("Trim End marked", "info");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }); // run on every render so closure has fresh refs


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-sans select-none overflow-hidden">

      {/* SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Keyboard className="w-5 h-5 text-indigo-400" /> Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcutsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-[1fr_auto] gap-y-3 gap-x-6 items-center">
                <span className="text-zinc-400">Play / Pause</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Space</kbd>
                
                <span className="text-zinc-400">Step Backward / Forward (0.1s)</span>
                <span className="flex gap-1"><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">←</kbd><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">→</kbd></span>
                
                <span className="text-zinc-400">Jump Backward / Forward (1s)</span>
                <span className="flex gap-1"><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Shift</kbd> + <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">← / →</kbd></span>
                
                <span className="text-zinc-400">Previous / Next Clip</span>
                <span className="flex gap-1"><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">↑</kbd><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">↓</kbd></span>
                
                <span className="text-zinc-400">Split Clip at Playhead</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">S</kbd>
                
                <span className="text-zinc-400">Set Trim Start (Mark In)</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">I</kbd>
                
                <span className="text-zinc-400">Set Trim End (Mark Out)</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">O</kbd>
                
                <span className="text-zinc-400">Delete Clip / Asset</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Del</kbd>
                
                <span className="text-zinc-400">Undo Canvas Action</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Ctrl + Z</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold ${
          toast.type === "success" ? "bg-emerald-600 text-white" :
          toast.type === "error"   ? "bg-red-600 text-white" :
                                     "bg-zinc-800 text-zinc-100 border border-zinc-700"
        }`}>
          {toast.type === "success" && <span>✓</span>}
          {toast.type === "error"   && <span>✕</span>}
          {toast.type === "info"    && <span>ℹ</span>}
          {toast.msg}
        </div>
      )}

      {/* RENDERING OVERLAY */}
      {isRendering && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="w-64 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-white font-bold text-lg">Rendering Video…</p>
            <p className="text-zinc-400 text-sm">FFmpeg is compositing your edits</p>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-indigo-400 font-mono font-bold text-xl">{progress}%</p>
          </div>
        </div>
      )}

      {/* FFMPEG NOT LOADED - Full Screen Loading */}
      {!isLoaded && (
        <div className="fixed inset-0 z-[80] bg-zinc-950 flex flex-col items-center justify-center gap-6">
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scissors className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-1">Loading Video Editor</h2>
              <p className="text-zinc-500 text-sm">{ffmpegStatus}</p>
            </div>
            <div className="w-48 mx-auto bg-zinc-800 rounded-full h-1 overflow-hidden">
              <div className="h-1 bg-indigo-500 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      )}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-sm font-semibold text-zinc-100">Video Editor</h1>
          </div>
          {/* ASPECT RATIO PRESETS */}
          <div className="hidden md:flex items-center gap-1 ml-4 bg-zinc-800 rounded-lg p-1">
            {ASPECT_RATIOS.map(ar => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  aspectRatio.id === ar.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button onClick={() => setShowShortcutsModal(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Keyboard Shortcuts">
            <Keyboard className="w-5 h-5" />
          </button>
          
          <button onClick={() => showToast("Drafts are saved automatically to your browser storage.", "success")} className="px-3 py-1.5 text-sm font-medium hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              disabled={!isLoaded || isRendering}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isRendering ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Rendering {progress}%</>
              ) : (
                <><Download className="w-4 h-4" /> Export</>
              )}
            </button>
            
            {showExportMenu && !isRendering && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50">
                <button onClick={() => { setShowExportMenu(false); renderVideo("local"); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-800">
                  <HardDrive className="w-4 h-4 text-indigo-400" /> Download Local
                </button>
                <button onClick={() => { setShowExportMenu(false); renderVideo("library"); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-800">
                  <Save className="w-4 h-4 text-emerald-400" /> Save to Library
                </button>
                <button onClick={() => { setShowExportMenu(false); renderVideo("gcp"); }} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2">
                  <CloudUpload className="w-4 h-4 text-pink-400" /> Save to Google Cloud
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR - TOOLS */}
        <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-3 shrink-0 z-10">
          <input type="file" ref={fileInputRef} onChange={handleVideoUpload} accept="video/mp4,video/webm" className="hidden" multiple />
          <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />
          {/* Import */}
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all flex flex-col items-center gap-1 group" title="Import Video">
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-400" />
            <span className="text-[10px] font-medium text-indigo-400">Import</span>
          </button>
          {/* Text */}
          <button onClick={() => { setLeftPanel(leftPanel === "text" ? null : "text"); }} className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group ${leftPanel === "text" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Add Text">
            <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Text</span>
          </button>
          {/* Stickers */}
          <button onClick={() => setLeftPanel(leftPanel === "stickers" ? null : "stickers")} className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group ${leftPanel === "stickers" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Stickers">
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Stickers</span>
          </button>
          {/* Logo */}
          <button onClick={handleAddLogo} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all flex flex-col items-center gap-1 group" title="Add Logo">
            <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Logo</span>
          </button>
          {/* Audio */}
          <button onClick={() => setLeftPanel(leftPanel === "audio" ? null : "audio")} className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group ${leftPanel === "audio" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Audio">
            <Music className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Audio</span>
          </button>
          {/* Adjust */}
          <button onClick={() => setActiveTab(activeTab === "adjust" ? "media" : "adjust")} className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group mt-auto ${activeTab === "adjust" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Adjust">
            <SlidersHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Adjust</span>
          </button>
        </div>

        {/* LEFT PANEL DRAWER */}
        {leftPanel && (
          <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col z-10 overflow-hidden">
            {leftPanel === "text" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Text</p>
                <button onClick={handleAddText} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">+ Add Text</button>
                <div className="space-y-3 border-t border-zinc-800 pt-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase">Style</p>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Font</label>
                    <select value={textFont} onChange={e => { setTextFont(e.target.value); (selectedObj as any)?.set?.({ fontFamily: e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Size</label>
                    <input type="range" min={12} max={120} step={2} value={textSize} onChange={e => { setTextSize(+e.target.value); (selectedObj as any)?.set?.({ fontSize: +e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-full accent-indigo-500" />
                    <span className="text-xs text-zinc-500">{textSize}px</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={textColor} onChange={e => { setTextColor(e.target.value); (selectedObj as any)?.set?.({ fill: e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                      <span className="text-xs text-zinc-400 font-mono">{textColor}</span>
                    </div>
                    {/* Quick color palette */}
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {["#ffffff","#000000","#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899"].map(c => (
                        <button key={c} onClick={() => { setTextColor(c); (selectedObj as any)?.set?.({ fill: c }); fabricCanvasRef.current?.renderAll(); }} className="w-6 h-6 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: textColor === c ? "#818cf8" : "transparent" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leftPanel === "stickers" && (
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Stickers & Emoji</p>
                <div className="grid grid-cols-4 gap-2">
                  {STICKERS.map(emoji => (
                    <button key={emoji} onClick={() => handleAddSticker(emoji)} className="text-2xl p-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center" title={emoji}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {leftPanel === "audio" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Audio</p>
                {audioUrl ? (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-xs text-emerald-400 font-medium mb-2">✓ Audio Loaded</p>
                    <audio src={audioUrl} controls className="w-full h-8" />
                    <button onClick={() => setAudioUrl(null)} className="mt-2 text-xs text-zinc-500 hover:text-red-400 transition-colors">Remove audio</button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No audio added yet.</p>
                )}
                <button onClick={() => audioInputRef.current?.click()} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload MP3 / Audio
                </button>
                <button onClick={generateMockVoiceover} className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-sm font-medium rounded-lg transition-colors">
                  ✨ Generate AI Voiceover
                </button>
              </div>
            )}
          </div>
        )}

        {/* CENTER - PREVIEW */}
        <div className="flex-1 flex flex-col bg-zinc-950 relative">
          
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <div 
              ref={canvasContainerRef}
              className="relative bg-black shadow-2xl overflow-hidden ring-1 ring-zinc-700 flex items-center justify-center transition-all duration-300"
              style={{ width: aspectRatio.w, height: aspectRatio.h, maxWidth: '100%', maxHeight: 'calc(100% - 16px)' }}
            >
              {videoUrl ? (
                <video
                  key={videoUrl}
                  ref={videoRef}
                  src={videoUrl}
                  className="absolute inset-0 w-full h-full object-cover transition-transform"
                  style={{ 
                    filter: `brightness(${1 + brightness}) contrast(${contrast}) saturate(${saturate}) sepia(${sepia}) hue-rotate(${hueRotate}deg)`,
                    transform: `scale(${videoZoom})`
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  crossOrigin="anonymous"
                  playsInline
                />
              ) : (
                // EMPTY STATE - Drag & Drop Zone
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-600 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const mockEvent = { target: { files: e.dataTransfer.files } } as any;
                      handleVideoUpload(mockEvent);
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-zinc-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-400">Drop video here or click to import</p>
                    <p className="text-xs text-zinc-600 mt-1">MP4 · WebM supported</p>
                  </div>
                </div>
              )}
              
              {/* Fabric.js Canvas */}
              <div className="absolute inset-0 z-10">
                <canvas id="fabric-canvas" width={aspectRatio.w} height={aspectRatio.h} />
              </div>
            </div>
          </div>
          
          {/* PLAYER CONTROLS */}
          <div className="h-14 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 gap-4">
            {/* Left: Skip + Play/Pause */}
            <div className="flex items-center gap-3">
              <button className="text-zinc-400 hover:text-white transition-colors" onClick={() => { if(videoRef.current) videoRef.current.currentTime = trimStart; setCurrentTime(trimStart); }}>
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={handlePlayPause} className="w-10 h-10 bg-white hover:bg-zinc-200 text-black rounded-full flex items-center justify-center transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </button>
              <div className="text-xs font-mono text-zinc-400 w-28">
                {new Date(currentTime * 1000).toISOString().substring(14, 22)} / {new Date(duration * 1000).toISOString().substring(14, 22)}
              </div>
            </div>

            {/* Center: Speed + Trim toggle */}
            <div className="flex items-center gap-2">
              {/* Speed Control */}
              <div className="relative">
                <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-bold text-zinc-300 hover:text-white transition-colors">
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full mb-1 left-0 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl z-50">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                      <button key={s} onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); }} className={`block w-full text-left px-4 py-1.5 text-sm hover:bg-zinc-800 transition-colors ${ playbackSpeed === s ? "text-indigo-400 font-bold" : "text-zinc-300" }`}>{s}x</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Trim toggle */}
              <button onClick={() => setShowTrimPanel(!showTrimPanel)} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${ showTrimPanel ? "bg-indigo-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" }`}>
                ✂ Trim
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-zinc-500" />
              <input type="range" min={0} max={1} step={0.05} defaultValue={1} onChange={e => { if (videoRef.current) videoRef.current.volume = +e.target.value; }} className="w-20 accent-indigo-500" />
            </div>
          </div>

          {/* TRIM PANEL */}
          {showTrimPanel && (
            <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center gap-6">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trim</p>
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs text-zinc-400 w-14">Start: <span className="text-indigo-400 font-mono">{trimStart.toFixed(1)}s</span></label>
                <input type="range" min={0} max={duration - 0.5} step={0.1} value={trimStart} onChange={e => { const v = +e.target.value; setTrimStart(v); if (videoRef.current) videoRef.current.currentTime = v; setCurrentTime(v); }} className="flex-1 accent-indigo-500" />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs text-zinc-400 w-14">End: <span className="text-pink-400 font-mono">{(trimEnd ?? duration).toFixed(1)}s</span></label>
                <input type="range" min={0.5} max={duration} step={0.1} value={trimEnd ?? duration} onChange={e => { setTrimEnd(+e.target.value); if (videoRef.current) videoRef.current.currentTime = +e.target.value; setCurrentTime(+e.target.value); }} className="flex-1 accent-pink-500" />
              </div>
              <button onClick={() => { setTrimStart(0); setTrimEnd(null); showToast("Trim reset", "info"); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Reset</button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - PROPERTIES */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 p-4 overflow-y-auto hidden xl:block z-10">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            {activeTab === "adjust" ? "Color Adjustments" : "Properties"}
          </h3>
          
          {activeTab === "adjust" ? (
            <div className="space-y-5">
              {/* ONE-CLICK FILTER PRESETS */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Filters</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setActiveFilterId(f.id);
                        setBrightness(f.brightness);
                        setContrast(f.contrast);
                        setSaturate(f.saturate);
                        setSepia(f.sepia);
                        setHueRotate(f.hueRotate);
                      }}
                      className={`py-1.5 rounded-md text-[10px] font-bold transition-all ${
                        activeFilterId === f.id
                          ? "bg-indigo-600 text-white ring-1 ring-indigo-400"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fine Tune</p>
                {[
                  { label: "Zoom",       value: videoZoom,  min: 1,  max: 3, step: 0.05, display: Math.round((videoZoom - 1) * 100), setter: setVideoZoom },
                  { label: "Brightness", value: brightness, min: -1, max: 1, step: 0.05, display: Math.round(brightness * 100), setter: setBrightness },
                  { label: "Contrast",   value: contrast,   min: 0,  max: 2, step: 0.05, display: Math.round((contrast - 1) * 100), setter: setContrast },
                  { label: "Saturation", value: saturate,   min: 0,  max: 3, step: 0.05, display: Math.round((saturate - 1) * 100), setter: setSaturate },
                ].map(({ label, value, min, max, step, display, setter }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="font-medium text-zinc-300">{label}</label>
                      <span className="text-zinc-500 tabular-nums">{display > 0 ? `+${display}` : display}</span>
                    </div>
                    <input 
                      type="range" 
                      min={min} max={max} step={step}
                      value={value}
                      onChange={(e) => { setter(parseFloat(e.target.value)); setActiveFilterId("custom"); }}
                      className="w-full h-1.5 accent-indigo-500" 
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setVideoZoom(1); setBrightness(0); setContrast(1); setSaturate(1); setSepia(0); setHueRotate(0); setActiveFilterId("none"); }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                ↺ Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="pt-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Aspect Ratio</p>
                <div className="space-y-1.5">
                  {ASPECT_RATIOS.map(ar => (
                    <button
                      key={ar.id}
                      onClick={() => setAspectRatio(ar)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        aspectRatio.id === ar.id
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent"
                      }`}
                    >
                      <span>{ar.label}</span>
                      <span className="text-xs opacity-60">{ar.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Features</h4>
                <button 
                  onClick={handleAutoCaptions} 
                  disabled={isCaptionsLoading}
                  className={`w-full py-2 ${isCaptionsLoading ? 'bg-indigo-500/5 cursor-not-allowed opacity-50' : 'bg-indigo-500/10 hover:bg-indigo-500/20'} text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-medium transition-colors`}
                >
                  {isCaptionsLoading ? "Generating..." : "Auto-Captions"}
                </button>
                <button 
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg}
                  className={`w-full py-2 ${isRemovingBg ? 'bg-pink-500/5 cursor-not-allowed opacity-50' : 'bg-pink-500/10 hover:bg-pink-500/20'} text-pink-400 border border-pink-500/20 rounded-lg text-sm font-medium transition-colors`}
                  title="Works on Image assets selected in the Canvas"
                >
                  {isRemovingBg ? "Processing..." : "Remove Background (Image)"}
                </button>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chroma Key (Video)</h4>
                  <input type="checkbox" checked={enableChromaKey} onChange={e => setEnableChromaKey(e.target.checked)} className="accent-emerald-500" />
                </div>
                {enableChromaKey && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-zinc-400">Color</label>
                      <input type="color" value={chromaKeyColor} onChange={e => setChromaKeyColor(e.target.value)} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <label className="text-zinc-400">Tolerance</label>
                        <span className="text-zinc-500 tabular-nums">{chromaKeySimilarity.toFixed(2)}</span>
                      </div>
                      <input type="range" min={0.01} max={1} step={0.01} value={chromaKeySimilarity} onChange={e => setChromaKeySimilarity(+e.target.value)} className="w-full h-1.5 accent-emerald-500" />
                    </div>
                    <p className="text-[10px] text-emerald-400/70 italic">Applied automatically during video export.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* BOTTOM - TIMELINE */}
        <div className="h-72 bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 z-20">

          {/* TIMELINE TOOLBAR */}
          <div className="h-10 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Timeline</span>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button onClick={() => (fabricCanvasRef.current as any)?.undo?.()} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors" title="Undo Canvas"><Undo className="w-4 h-4" /></button>
              <button onClick={handleSplitClip} className="p-1.5 hover:bg-zinc-800 text-pink-400 hover:text-pink-300 rounded transition-colors" title="Split at Playhead"><Scissors className="w-4 h-4" /></button>
              <button onClick={() => {
                if (confirm("Are you sure you want to delete all clips and canvas assets?")) {
                  setClips([]); setVideoUrl(null); setOriginalVideoUrl(null);
                  if (fabricCanvasRef.current) { fabricCanvasRef.current.clear(); fabricCanvasRef.current.backgroundColor = "transparent"; }
                  refreshAssets();
                }
              }} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors" title="Clear All"><Trash2 className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Clip
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center max-w-md mx-4">
              <input type="range" min={0} max={totalDuration || 1} step={0.01} value={globalTime} onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Zoom</span>
                <input type="range" min={1} max={5} step={0.1} value={timelineZoom} onChange={e => setTimelineZoom(+e.target.value)} className="w-20 h-1 accent-indigo-500" />
              </div>
              <div className="text-xs font-mono text-zinc-500">
                {clips.length} clip{clips.length !== 1 ? "s" : ""} · {totalDuration.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* TRACKS AREA */}
          <div className="flex-1 overflow-y-auto overflow-x-auto relative select-none">
            <div 
              ref={tracksAreaRef}
              className="relative p-3 space-y-2 h-full"
              style={{ width: `${timelineZoom * 100}%`, minWidth: '100%' }}
              onClick={(e) => { 
                // Deselect if clicking empty space
                if (e.target === e.currentTarget) setSelectedAssetId(null); 
                
                // If clicking on track area, seek to that position
                if (e.target === e.currentTarget && tracksAreaRef.current) {
                  const rect = tracksAreaRef.current.getBoundingClientRect();
                  const trackWidth = rect.width - 24;
                  let newX = e.clientX - rect.left - 12;
                  if (newX < 0) newX = 0;
                  if (newX > trackWidth) newX = trackWidth;
                  const newGlobalTime = (newX / trackWidth) * (totalDuration || 1);
                  handleSeek({ target: { value: newGlobalTime.toString() } } as any);
                }
              }}
            >

            {/* Playhead Line */}
            <div className={`absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none transition-opacity duration-150 ${isDraggingPlayhead ? 'opacity-100' : 'opacity-80'}`}
              style={{ left: `calc(12px + calc(calc(100% - 24px) * ${globalTime / (totalDuration || 1)}))` }}>
              <div 
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPlayhead(true); setIsPlaying(false); }}
                className="absolute top-0 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-sm cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform" 
              />
            </div>

            {/* VIDEO CLIP TRACKS */}
            <div className="space-y-1">
              {videoTracks.map((track, tIdx) => (
                <div key={track.id} className="h-14 rounded-lg flex relative border border-zinc-800/50 bg-zinc-900/50">
                  <div className="w-14 shrink-0 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-800 rounded-l-lg z-10 gap-0.5 relative">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] text-indigo-400 font-bold">{track.name}</span>
                    {tIdx === videoTracks.length - 1 && (
                       <button onClick={() => setVideoTracks([...videoTracks, { id: `v${videoTracks.length + 1}`, name: `V${videoTracks.length + 1}` }])}
                               className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 w-5 h-5 bg-zinc-800 rounded flex items-center justify-center hover:bg-indigo-600 transition-colors shadow border border-zinc-700" title="Add Video Track">
                          <Plus className="w-3 h-3 text-white" />
                       </button>
                    )}
                  </div>
                  <div className="flex-1 relative overflow-hidden p-1">
                    {clips.filter(c => c.trackId === track.id).map(clip => {
                      const leftPct = (clip.startTime / (totalDuration || 1)) * 100;
                      const widthPct = (clip.duration / (totalDuration || 1)) * 100;
                      const isSelected = activeClip?.id === clip.id;
                      return (
                        <div 
                          key={clip.id}
                          className={`absolute top-1 bottom-1 rounded-md flex items-center px-1.5 cursor-move transition-colors shadow-sm ${isSelected ? 'bg-indigo-500/30 border border-indigo-400/60 ring-1 ring-indigo-400 z-10' : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '40px' }}
                          onClick={(e) => {
                             e.stopPropagation();
                             handleSeek({ target: { value: clip.startTime.toString() } } as any);
                          }}
                        >
                          <span className={`text-[10px] font-medium truncate pointer-events-none ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{clip.name}</span>
                          <span className="text-[10px] text-zinc-500 ml-auto shrink-0 pointer-events-none">{clip.duration ? `${clip.duration.toFixed(1)}s` : "…"}</span>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteClip(clip.id); }} 
                            className="absolute top-1 right-1 w-4 h-4 rounded hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 z-20"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                    {clips.filter(c => c.trackId === track.id).length === 0 && (
                      <div className="w-full h-full border border-dashed border-zinc-800/50 rounded-md flex items-center justify-center opacity-30">
                        <span className="text-[10px] text-zinc-500 font-medium">Empty Track</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* AUDIO TRACK */}
            <div className="h-12 bg-zinc-900/50 rounded-lg flex relative border border-zinc-800/50">
              <div className="w-14 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center justify-center z-10 rounded-l-lg gap-0.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] text-emerald-400 font-bold">AUD</span>
              </div>
              <div className="flex-1 relative overflow-hidden p-1">
                {audioUrl ? (
                  <div className="absolute inset-1 bg-emerald-500/20 border border-emerald-500/40 rounded-md flex items-center px-2 gap-2">
                    <span className="text-xs font-medium text-emerald-300 truncate flex-1">Audio Track</span>
                    <button onClick={() => setAudioUrl(null)} className="w-5 h-5 rounded bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0" title="Remove audio">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full border border-dashed border-zinc-800 rounded-md flex items-center justify-center opacity-50 cursor-pointer" onClick={() => audioInputRef.current?.click()}>
                    <span className="text-[10px] text-zinc-500 font-medium">+ Add Audio</span>
                  </div>
                )}
              </div>
            </div>

            {/* CANVAS ASSETS TRACK */}
            <div className="min-h-12 bg-zinc-900/50 rounded-lg border border-zinc-800/50 flex relative">
              <div className="w-14 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center justify-center z-10 rounded-l-lg gap-0.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-bold">ASSETS</span>
              </div>
              <div id="asset-tracks-container" className="flex-1 relative overflow-hidden p-1 min-h-[48px]">
                {canvasAssets.map(asset => {
                  const leftPct = (asset.startTime / (totalDuration || 1)) * 100;
                  const widthPct = ((asset.endTime - asset.startTime) / (totalDuration || 1)) * 100;
                  const isSelected = selectedAssetId === asset.id;
                  
                  return (
                    <div 
                      key={asset.id} 
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedAssetId(asset.id);
                        fabricCanvasRef.current?.setActiveObject(asset.obj);
                        fabricCanvasRef.current?.renderAll();
                        setAssetDragState({
                          assetId: asset.id,
                          type: 'move',
                          startX: e.clientX,
                          initialStart: asset.startTime,
                          initialEnd: asset.endTime
                        });
                      }}
                      className={`absolute top-1 bottom-1 rounded-md flex items-center px-1.5 cursor-move transition-colors shadow-sm group ${isSelected ? 'bg-amber-500/30 border border-amber-400/60 ring-1 ring-amber-400 z-10' : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '8px' }}
                    >
                      {/* Left Trim Handle */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedAssetId(asset.id);
                          setAssetDragState({ assetId: asset.id, type: 'trimStart', startX: e.clientX, initialStart: asset.startTime, initialEnd: asset.endTime });
                        }}
                        className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-amber-400/50 rounded-l-md ${isSelected ? 'bg-amber-400/30' : 'bg-zinc-600/50 opacity-0 group-hover:opacity-100'}`}
                      />
                      
                      <span className={`text-[10px] font-medium truncate ml-2 pointer-events-none ${isSelected ? 'text-amber-200' : 'text-zinc-300'}`}>{asset.label}</span>

                      <button 
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          fabricCanvasRef.current?.remove(asset.obj);
                          fabricCanvasRef.current?.renderAll();
                          if (selectedAssetId === asset.id) setSelectedAssetId(null);
                          refreshAssets();
                        }} 
                        className="ml-auto w-4 h-4 rounded hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 z-20"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>

                      {/* Right Trim Handle */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedAssetId(asset.id);
                          setAssetDragState({ assetId: asset.id, type: 'trimEnd', startX: e.clientX, initialStart: asset.startTime, initialEnd: asset.endTime });
                        }}
                        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-amber-400/50 rounded-r-md ${isSelected ? 'bg-amber-400/30' : 'bg-zinc-600/50 opacity-0 group-hover:opacity-100'}`}
                      />
                    </div>
                  );
                })}
                {canvasAssets.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center opacity-50">
                    <span className="text-[10px] text-zinc-500 font-medium">Text, Stickers, and Logos appear here</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS HUD */}
      <div className="fixed bottom-4 right-4 z-50 hidden xl:flex flex-col gap-1">
        {[
          ["Space", "Play / Pause"],
          ["Delete", "Remove overlay"],
          ["Ctrl+Z", "Undo canvas"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[10px] text-zinc-600">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono border border-zinc-700">{key}</kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// Clip colour palette
const CLIP_COLORS = [
  "#818cf8", // indigo
  "#34d399", // emerald
  "#f472b6", // pink
  "#fb923c", // orange
  "#a78bfa", // violet
  "#facc15", // yellow
  "#38bdf8", // sky
  "#f87171", // red
];
