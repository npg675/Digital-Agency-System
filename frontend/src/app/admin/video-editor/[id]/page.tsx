"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { fabric } from "fabric";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Play, Pause, SkipBack, Scissors, Type, Music, Image as ImageIcon,
  Download, Loader2, ArrowLeft, Volume2, Save, Undo, Redo, Plus, Trash2,
  SlidersHorizontal, CloudUpload, HardDrive, Upload, Sparkles, X, Layers,
  Keyboard, Magnet, Undo2, Redo2, Eye, EyeOff, VolumeX, Link2, Rewind, FastForward, Wand2, PenTool, Shapes, Square, Circle, Triangle, Eraser, Printer, Maximize, Maximize2, MousePointer2, Crop as CropIcon, Settings,
  Folder, FolderOpen, ChevronUp, ChevronRight, Film, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine
} from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function useHistory<T>(initialState: T, maxHistory: number = 20) {
  const [state, setState] = useState({ history: [initialState], currentIndex: 0 });

  const setWithHistory = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const currentState = prev.history[prev.currentIndex];
      const stateToSave = typeof newState === 'function' ? (newState as Function)(currentState) : newState;
      
      if (currentState === stateToSave) return prev;

      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(stateToSave);
      
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      return { history: newHistory, currentIndex: newHistory.length - 1 };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState(prev => ({ ...prev, currentIndex: Math.max(prev.currentIndex - 1, 0) }));
  }, []);

  const redo = useCallback(() => {
    setState(prev => ({ ...prev, currentIndex: Math.min(prev.currentIndex + 1, prev.history.length - 1) }));
  }, []);

  const setWithoutHistory = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const currentState = prev.history[prev.currentIndex];
      const stateToSave = typeof newState === 'function' ? (newState as Function)(currentState) : newState;
      if (currentState === stateToSave) return prev;
      const newHistory = [...prev.history];
      newHistory[prev.currentIndex] = stateToSave;
      return { ...prev, history: newHistory };
    });
  }, []);

  const current = state.history[state.currentIndex];
  
  const historyControls = useMemo(() => ({
    undo,
    redo,
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.history.length - 1,
    setWithoutHistory
  }), [undo, redo, state.currentIndex, state.history.length, setWithoutHistory]);

  return [current !== undefined ? current : initialState, setWithHistory, historyControls] as const;
}

// --- VideoClip type ---
type VideoClip = {
  id: string;
  type?: "video" | "image" | "ticker";
  name: string;
  url: string;
  fileDuration: number; // Total original file length
  duration: number;     // Effective visible length
  trimStart: number;    // Where to start playing the underlying file
  trimEnd: number;      // Where to stop playing the underlying file
  startTime: number;    // Global position on the timeline
  trackId: string;      // Which video track this clip belongs to
  color: string;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  x: number;
  y: number;
  videoZoom: number;
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  hueRotate: number;
  enableChromaKey: boolean;
  chromaKeyColor: string;
  chromaKeySimilarity: number;
  playbackRate: number; // For Speed Ramping
  volume: number;       // For Per-Clip Volume (0-1)
  opacity?: number;     // For transparent overlays
  isForeground?: boolean; // If true, renders above all Fabric text/stickers
  // Ticker Properties
  tickerText?: string;
  tickerBgColor?: string;
  tickerTextColor?: string;
  tickerFontSize?: number;
  tickerSpeed?: number; // pixels per second
  tickerFontFamily?: string;
  tickerLoop?: boolean;
  // Dual-Text Ticker Properties
  enableSecondaryTicker?: boolean;
  tickerText2?: string;
  tickerTextColor2?: string;
  tickerFontSize2?: number;
  tickerSpeed2?: number;
  tickerFontFamily2?: string;
  // Animation System
  animationType?: "none" | "pulse" | "wiggle" | "float" | "spin" | "spin-cw" | "spin-ccw" | "blink" | "slide-in-left" | "slide-in-right" | "slide-in-bottom" | "slide-in-top";
  animationSpeed?: number; // 0.1 to 5.0 (multiplier)
  animationIntensity?: number; // 0.1 to 5.0 (multiplier)
};

type VideoTrack = {
  id: string;
  name: string;
  isHidden?: boolean;
  isMuted?: boolean;
};

// --- Aspect Ratio Presets ---
const ASPECT_RATIOS = [
  { id: "16:9",  label: "YouTube (16:9)",    icon: "Monitor",    w: 640, h: 360,  ffmpegScale: "1920:1080", category: "Social"  },
  { id: "9:16",  label: "TikTok / Reels",     icon: "Smartphone", w: 360, h: 640,  ffmpegScale: "1080:1920", category: "Social"  },
  { id: "1:1",   label: "Instagram Square",  icon: "Square",     w: 480, h: 480,  ffmpegScale: "1080:1080", category: "Social" },
  { id: "4:5",   label: "Instagram Portrait",       icon: "Square",     w: 432, h: 540,  ffmpegScale: "1080:1350", category: "Social" },
  { id: "twitter",label: "X / Twitter Post", icon: "Hash",       w: 640, h: 360,  ffmpegScale: "1200:675", category: "Social" },
  { id: "linkedin",label: "LinkedIn Banner", icon: "Image",      w: 640, h: 160,  ffmpegScale: "1584:396", category: "Social" },
  { id: "a4",    label: "A4 Print",   icon: "Printer",    w: 450, h: 637,  ffmpegScale: "2480:3508", category: "Print" },
  { id: "a3",    label: "A3 Print",   icon: "Printer",    w: 455, h: 644, ffmpegScale: "3508:4960", category: "Print" },
  { id: "a5",    label: "A5 Print",   icon: "Printer",    w: 460, h: 652,  ffmpegScale: "1748:2480", category: "Print" },
  { id: "letter",label: "US Letter",  icon: "Printer",    w: 500, h: 647, ffmpegScale: "2550:3300", category: "Print" },
  { id: "legal", label: "US Legal",   icon: "Printer",    w: 392, h: 646, ffmpegScale: "2550:4200", category: "Print" },
  { id: "4x6",   label: "4x6 Photo",  icon: "Printer",    w: 428, h: 642, ffmpegScale: "1200:1800", category: "Print" },
  { id: "6x4",   label: "6x4 Photo",  icon: "Printer",    w: 642, h: 428, ffmpegScale: "1800:1200", category: "Print" },
  { id: "bizcard",label: "Business Card", icon: "CreditCard", w: 640, h: 365, ffmpegScale: "1050:600", category: "Print" },
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

// --- Pro Suite: Elements Library ---
const PRO_ELEMENTS = [
  {
    category: "Cinematic Overlays",
    items: [
      { id: "light-leak-1", name: "Warm Film Burn", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "overlay", opacity: 0.5, icon: "✨" },
      { id: "light-leak-2", name: "Lens Flare", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", type: "overlay", opacity: 0.6, icon: "🌟" },
      { id: "glitch-1", name: "Digital Glitch", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "overlay", opacity: 0.7, icon: "⚡" },
    ]
  },
  {
    category: "Green Screen Motion Graphics",
    items: [
      { id: "gs-subscribe", name: "Subscribe Button", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "greenscreen", color: "#00ff00", icon: "🔔" },
      { id: "gs-lower-third", name: "News Lower Third", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", type: "greenscreen", color: "#00ff00", icon: "📰" },
      { id: "gs-swipe-up", name: "Swipe Up Gesture", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "greenscreen", color: "#00ff00", icon: "👆" },
    ]
  },
  {
    category: "Action Transitions",
    items: [
      { id: "trans-whip", name: "Whip Pan Left", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "overlay", opacity: 0.8, icon: "💨" },
      { id: "trans-glitch", name: "Cyber Glitch Transition", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "overlay", opacity: 0.9, icon: "👾" },
      { id: "trans-burn", name: "Film Burn Flash", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "overlay", opacity: 0.6, icon: "🔥" },
    ]
  },
  {
    category: "VFX & Assets",
    items: [
      { id: "vfx-sparks", name: "Falling Sparks", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", type: "greenscreen", color: "#000000", icon: "🎇" },
      { id: "vfx-smoke", name: "Atmospheric Smoke", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "overlay", opacity: 0.4, icon: "🌫️" },
      { id: "vfx-confetti", name: "Celebration Confetti", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "greenscreen", color: "#00ff00", icon: "🎊" }
    ]
  }
];

const PRO_TEXT_STYLES = [
  { id: "cyberpunk", name: "Neon Cyberpunk", fill: "#ffffff", fontFamily: "Arial", fontWeight: "900", shadow: { color: "#ec4899", blur: 20, offsetX: 0, offsetY: 0 }, stroke: "#ec4899", strokeWidth: 2 },
  { id: "cinematic", name: "Cinematic", fill: "#e5e5e5", fontFamily: "Georgia", fontWeight: "normal", shadow: { color: "rgba(0,0,0,0.9)", blur: 15, offsetX: 4, offsetY: 4 } },
  { id: "retro", name: "Retro Outline", fill: "transparent", fontFamily: "Impact", fontWeight: "bold", stroke: "#f59e0b", strokeWidth: 3, shadow: { color: "#000", blur: 5, offsetX: 2, offsetY: 2 } },
  { id: "news", name: "News Banner", fill: "#ffffff", fontFamily: "Helvetica", fontWeight: "bold", backgroundColor: "#ef4444", fontSize: 40 },
  { id: "gold", name: "Luxury Gold", fill: "#FFD700", fontFamily: "Georgia", fontWeight: "bold", stroke: "#B8860B", strokeWidth: 1, shadow: { color: "rgba(0,0,0,0.6)", blur: 10, offsetX: 3, offsetY: 3 } },
  { id: "vlog", name: "Vlog Title", fill: "#000000", fontFamily: "Outfit", fontWeight: "900", backgroundColor: "#fbbf24", fontSize: 48 },
  { id: "hollow", name: "Hollow Bold", fill: "transparent", fontFamily: "Inter", fontWeight: "900", stroke: "#ffffff", strokeWidth: 3 },
  { id: "action", name: "Action Blockbuster", fill: "#dc2626", fontFamily: "Impact", fontWeight: "bold", stroke: "#000000", strokeWidth: 3, shadow: { color: "rgba(0,0,0,1)", blur: 0, offsetX: 4, offsetY: 4 } },
  { id: "modern", name: "Modern Minimal", fill: "#ffffff", fontFamily: "Inter", fontWeight: "300", shadow: { color: "rgba(0,0,0,0.3)", blur: 4, offsetX: 1, offsetY: 1 } },
  { id: "glitch", name: "Digital Glitch", fill: "#ffffff", fontFamily: "Courier New", fontWeight: "bold", shadow: { color: "#00ffcc", blur: 0, offsetX: 2, offsetY: 0 }, stroke: "#ff003c", strokeWidth: 1 },
];

const DEFAULT_AUDIOS = [
  { id: "default-1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", name: "Crowd Clapping", artist: "Google", genre: "Sound Effect", description: "Loud crowd applause and cheering" },
  { id: "default-2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", name: "Laughing Track", artist: "Google", genre: "Comedy", description: "Generic group laughing" },
  { id: "default-3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", name: "Baby Crying", artist: "Google", genre: "Drama", description: "Baby crying sound" },
  { id: "default-4", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", name: "Drum Roll", artist: "Google", genre: "Suspense", description: "Drum roll building up to a reveal" },
  { id: "default-5", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", name: "Cartoon Boing", artist: "Google", genre: "Comedy", description: "Funny bouncing boing sound" },
  { id: "default-6", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", name: "Crickets", artist: "Google", genre: "Nature", description: "Awkward silence crickets chirping" },
  { id: "default-7", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", name: "Fast Whoosh", artist: "Google", genre: "Transition", description: "Quick whoosh for scene changes" },
  { id: "default-8", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", name: "Corporate Upbeat", artist: "SoundHelix", genre: "Background", description: "Pro upbeat electronic background track" },
  { id: "default-9", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", name: "Cinematic Tension", artist: "SoundHelix", genre: "Cinematic", description: "Suspenseful electronic music" },
  { id: "default-10", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", name: "UI Blip", artist: "Google", genre: "Sound Effect", description: "Clean digital blip for UI animations" },
  { id: "default-11", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", name: "Short Beep", artist: "Google", genre: "Sound Effect", description: "Simple censorship or alert beep" },
  { id: "default-12", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", name: "Water Drop (Pop)", artist: "Google", genre: "Sound Effect", description: "Clean water drop sound, great for pop-ups" },
  { id: "default-13", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", name: "Cinematic Boom", artist: "Google", genre: "Cinematic", description: "Deep dramatic thunder impact" }
];

// --- Emoji / Sticker presets ---
const STICKERS = [
  "🔥","⚡","🎯","🚀","💥","✨","🎉","💡","❤️","👑","🏆","💰","📢","⭐","🎬","💪",
];

// --- Font families ---
const FONTS = ["Arial","Georgia","Impact","Courier New","Verdana","Trebuchet MS", "Outfit", "Russo One", "Inter", "Poppins", "Mukta", "Yatra One", "Khand", "Teko", "Kalam", "Preeti", "Kruti Dev 010"];

// --- True Audio Waveform Renderer ---
const WaveformRenderer = ({ url, duration, trimStart, fileDuration }: { url: string, duration: number, trimStart: number, fileDuration: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    if (!url) return;
    const cacheKey = `waveform_${url}`;
    if ((window as any)[cacheKey]) {
       setPeaks((window as any)[cacheKey]);
       return;
    }

    let isMounted = true;
    const loadAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (decodeErr) {
          console.warn("Could not decode audio data (file may have no audio track).", decodeErr);
          if (isMounted) setPeaks(new Array(200).fill(0));
          return;
        }
        
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(channelData.length / samples);
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        const normalizedData = filteredData.map(n => n * multiplier);
        
        if (isMounted) {
           setPeaks(normalizedData);
           (window as any)[cacheKey] = normalizedData;
        }
      } catch (err) {
        console.warn("Error loading waveform:", err);
      }
    };
    loadAudio();
    return () => { isMounted = false; };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const startPct = trimStart / fileDuration;
    const durationPct = duration / fileDuration;
    
    const totalWidth = canvas.offsetWidth / durationPct;
    const offsetX = -startPct * totalWidth;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    const barWidth = 2;
    const numBars = peaks.length;
    
    for (let i = 0; i < numBars; i++) {
       const x = offsetX + (i / numBars) * totalWidth;
       if (x + barWidth < 0 || x > canvas.offsetWidth) continue;
       
       const h = Math.max(2, peaks[i] * canvas.offsetHeight * 0.8);
       const y = canvas.offsetHeight / 2 - h / 2;
       ctx.fillRect(x, y, barWidth, h);
    }
  }, [peaks, duration, trimStart, fileDuration]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop
): Promise<string> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL("image/png");
}

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
  const [globalTime, setGlobalTime] = useState(0);
  const [duration, setDuration] = useState(1); // avoid / 0
  const [masterVolume, setMasterVolume] = useState(1);
  
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Selection State
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const [activeFilterId, setActiveFilterId] = useState("none");
  const [activeTab, setActiveTab] = useState("media");
  const [leftPanel, setLeftPanel] = useState<"text" | "stickers" | "filters" | "elements" | "draw" | "shapes" | "logo" | "media" | null>(null);
  const [mediaTab, setMediaTab] = useState<"library" | "clips" | "audio">("library");
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [isCaptionsLoading, setIsCaptionsLoading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Custom Logos State
  const [customLogos, setCustomLogos] = useState<{id: string, url: string, name?: string}[]>([]);
  const [logoSearch, setLogoSearch] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("custom_video_logos");
      if (saved) setCustomLogos(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const [customClips, setCustomClips] = useState<{id: string, name: string, url: string, trimStart?: number, trimEnd?: number, description?: string}[]>([]);
  const [clipSearch, setClipSearch] = useState("");
  const [editingCustomClipId, setEditingCustomClipId] = useState<string | null>(null);
  const [editingCustomClipName, setEditingCustomClipName] = useState("");
  const [editingClipDetailsId, setEditingClipDetailsId] = useState<string | null>(null);
  const [editingClipDetails, setEditingClipDetails] = useState({ name: "", description: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("custom_video_clips");
      if (saved) setCustomClips(JSON.parse(saved));
    } catch(e) {}
  }, []);

  // Media Library State
  type MediaItem = { id: string; name: string; url: string; duration: number; thumbnail: string; size: number };
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const mediaLibInputRef = useRef<HTMLInputElement>(null);

  const generateThumbnail = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const vid = document.createElement("video");
      vid.src = url;
      vid.crossOrigin = "anonymous";
      vid.muted = true;
      vid.currentTime = 1;
      vid.addEventListener("seeked", () => {
        const c = document.createElement("canvas");
        c.width = 320; c.height = 180;
        c.getContext("2d")?.drawImage(vid, 0, 0, 320, 180);
        resolve(c.toDataURL("image/jpeg", 0.9));
      }, { once: true });
      vid.addEventListener("error", () => resolve(""), { once: true });
      vid.load();
    });
  };

  const handleMediaLibraryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: MediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("video/")) continue;
      
      showToast(`Uploading ${file.name}...`, "info");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        
        if (!data.success) {
          showToast(`Failed to upload ${file.name}`, "error");
          continue;
        }
        
        const persistentUrl = data.url;
        const tmpUrl = URL.createObjectURL(file);
        
        const duration = await new Promise<number>((res) => {
          const v = document.createElement("video");
          v.src = tmpUrl;
          v.onloadedmetadata = () => res(v.duration);
          v.onerror = () => res(0);
        });
        const thumbnail = await generateThumbnail(tmpUrl);
        URL.revokeObjectURL(tmpUrl);
        
        newItems.push({ id: crypto.randomUUID(), name: file.name, url: persistentUrl, duration, thumbnail, size: file.size });
      } catch (err) {
        console.error(err);
        showToast(`Error uploading ${file.name}`, "error");
      }
    }
    if (newItems.length > 0) {
      setMediaLibrary(prev => [...prev, ...newItems]);
      showToast(`${newItems.length} clip${newItems.length !== 1 ? 's' : ''} added to Media Library`, "success");
    }
  };

  const addMediaToTimeline = (item: MediaItem) => {
    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      type: "video",
      name: item.name.replace(/\.[^.]+$/, ""),
      url: item.url,
      fileDuration: item.duration,
      duration: item.duration,
      trimStart: 0,
      trimEnd: item.duration,
      startTime: globalTime,
      trackId: videoTracks[0]?.id || "v1",
      color: `hsl(${Math.floor(Math.random()*360)}, 70%, 55%)`,
      x: 0, y: 0, videoZoom: 1,
      brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0,
      enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.3,
      playbackRate: 1, volume: 1, opacity: 1,
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    showToast(`"${newClip.name}" added to timeline`, "success");
  };

  // Custom Audios State
  const [customAudios, setCustomAudios] = useState<{id: string, url: string, name?: string, artist?: string, genre?: string, description?: string}[]>([]);
  const [audioSearch, setAudioSearch] = useState("");
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [editingAudioDetails, setEditingAudioDetails] = useState({ name: "", artist: "", genre: "", description: "" });

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewAudioId, setPreviewAudioId] = useState<string | null>(null);

  const togglePreviewAudio = (audioId: string, url: string) => {
    if (previewAudioId === audioId) {
      previewAudioRef.current?.pause();
      setPreviewAudioId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const newAudio = new window.Audio(url);
      
      const playPromise = newAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error);
          // @ts-ignore - Assuming showToast is available in the global scope or will be caught
          if (typeof window !== "undefined") {
            const isNotSupported = error.name === "NotSupportedError";
            const msg = isNotSupported ? "Browser does not support this audio format" : "Failed to play audio preview";
            // Next.js might bubble this up, but we prevent the crash.
            alert(msg); // fallback alert if showToast isn't directly in scope here
          }
          setPreviewAudioId(null);
        });
      }

      newAudio.onended = () => setPreviewAudioId(null);
      previewAudioRef.current = newAudio;
      setPreviewAudioId(audioId);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("custom_video_audios");
      if (saved) setCustomAudios(JSON.parse(saved));
    } catch(e) {}
  }, []);

  // Drafts State
  type VideoDraft = {
    id: string;
    name: string;
    savedAt: number; // timestamp
    clips: VideoClip[];
    videoUrl: string | null;
    originalVideoUrl: string | null;
    audioUrl: string | null;
    canvasJson: object | null;
  };
  const [drafts, setDrafts] = useState<VideoDraft[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftNameInput, setDraftNameInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("video_editor_drafts");
      if (saved) setDrafts(JSON.parse(saved));
    } catch(e) {}
  }, []);

  // Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropTargetObj, setCropTargetObj] = useState<fabric.Image | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Storage Settings Modal State
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  const [storageSettingsLoading, setStorageSettingsLoading] = useState(false);
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageForm, setStorageForm] = useState({
    video_storage_provider: "local",
    video_upload_local_path: "public/uploads",
    video_export_path: "uploads/videos",
    google_drive_folder_id: "",
    google_drive_credentials: "",
  });

  const loadStorageSettings = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    if (!token) return;
    setStorageSettingsLoading(true);
    try {
      const res = await fetch(`${API}/settings/video-storage`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStorageForm(f => ({
          ...f,
          video_storage_provider: data.video_storage_provider || "local",
          video_upload_local_path: data.video_upload_local_path || "public/uploads",
          video_export_path: data.video_export_path || "uploads/videos",
          google_drive_folder_id: data.google_drive_folder_id || "",
        }));
      }
    } catch {}
    setStorageSettingsLoading(false);
  };

  const saveStorageSettings = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    if (!token) return;
    setStorageSaving(true);
    try {
      const body: Record<string, string> = {
        video_storage_provider: storageForm.video_storage_provider,
        video_upload_local_path: storageForm.video_upload_local_path,
        video_export_path: storageForm.video_export_path,
        google_drive_folder_id: storageForm.google_drive_folder_id,
      };
      if (storageForm.google_drive_credentials.trim()) {
        body.google_drive_credentials = storageForm.google_drive_credentials;
      }
      const res = await fetch(`${API}/settings/video-storage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast("Storage settings saved!", "success");
        setShowStorageSettings(false);
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch {
      showToast("Network error saving settings", "error");
    }
    setStorageSaving(false);
  };

  // Folder Browser State
  type FolderBrowserField = "upload" | "export" | null;
  const [folderBrowserField, setFolderBrowserField] = useState<FolderBrowserField>(null);
  const [folderBrowserLoading, setFolderBrowserLoading] = useState(false);
  const [folderBrowserData, setFolderBrowserData] = useState<{
    root: string; current: string; parent: string | null;
    entries: { name: string; path: string }[];
  } | null>(null);
  const [folderBrowserError, setFolderBrowserError] = useState<string | null>(null);
  const [customPathInput, setCustomPathInput] = useState("");

  const browseDir = async (root: "backend" | "frontend", path: string = ".") => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    if (!token) return;
    setFolderBrowserLoading(true);
    setFolderBrowserError(null);
    try {
      const res = await fetch(
        `${API}/settings/browse-directories?root=${root}&path=${encodeURIComponent(path)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setFolderBrowserData(await res.json());
      } else {
        const errorText = await res.text();
        console.error("Failed to load directory:", res.status, errorText);
        setFolderBrowserError(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.error("Network error loading directory", err);
      setFolderBrowserError(`Network error: ${err.message || String(err)}`);
    }
    setFolderBrowserLoading(false);
  };

  const openFolderBrowser = (field: FolderBrowserField) => {
    const isExport = field === "export";
    // Upload path is frontend (public/), export path is backend (uploads/)
    const root = isExport ? "backend" : "frontend";
    setFolderBrowserField(field);
    setFolderBrowserData(null);
    setFolderBrowserError(null);
    browseDir(root, ".");
  };

  const selectFolder = (path: string) => {
    if (!folderBrowserField) return;
    if (folderBrowserField === "upload") {
      setStorageForm(f => ({ ...f, video_upload_local_path: path }));
    } else {
      setStorageForm(f => ({ ...f, video_export_path: path }));
    }
    setFolderBrowserField(null);
    setFolderBrowserData(null);
  };

  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [exportQuality, setExportQuality] = useState<"high" | "medium" | "low">("high");
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customUnit, setCustomUnit] = useState<"px" | "in" | "cm" | "mm">("px");
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [timecodeInput, setTimecodeInput] = useState("");

  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const tracksAreaRef = useRef<HTMLDivElement>(null);

  // Text controls state
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState("Arial");
  const [textSize, setTextSize] = useState(40);
  const [textBold, setTextBold] = useState(true);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  
  // Draw / Shape controls state
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [shapeColor, ShapeColor] = useState("#indigo-500");
  
  // Multi-clip state
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([{ id: "v1", name: "V1" }]);
  const [clips, setClips, historyState] = useHistory<VideoClip[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);   // currently playing clip URL
  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null); // kept for single-clip compat
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // Canvas assets list (for Assets panel)
  const [canvasAssets, setCanvasAssets] = useState<{ id: string; label: string; obj: fabric.Object; startTime: number; endTime: number; animationType?: string; animationSpeed?: number; animationIntensity?: number }[]>([]);
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
      animationType: (o as any).animationType || "none",
      animationSpeed: (o as any).animationSpeed || 1.0,
      animationIntensity: (o as any).animationIntensity || 1.0,
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

  const [clipDragState, setClipDragState] = useState<{
    clipId: string;
    type: 'move' | 'trimStart' | 'trimEnd';
    startX: number;
    initialStart: number;
    initialDuration: number;
    initialTrimStart: number;
    initialTrimEnd: number;
    fileDuration: number;
  } | null>(null);

  const [fadeDragState, setFadeDragState] = useState<{
    clipId: string;
    type: 'fadeIn' | 'fadeOut';
    startX: number;
    initialFade: number;
  } | null>(null);
  
  // Drag to reorder clips
  const [draggedClipIdx, setDraggedClipIdx] = useState<number | null>(null);

  // Trim & Speed State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null); // null = end of video
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTrimPanel, setShowTrimPanel] = useState(false);
  
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const isSnappingEnabledRef = useRef(true);
  useEffect(() => { isSnappingEnabledRef.current = isSnappingEnabled; }, [isSnappingEnabled]);

  const [isRippleEnabled, setIsRippleEnabled] = useState(false);
  const isRippleEnabledRef = useRef(false);
  useEffect(() => { isRippleEnabledRef.current = isRippleEnabled; }, [isRippleEnabled]);
  
  const globalTimeRef = useRef(0);
  useEffect(() => { globalTimeRef.current = globalTime; }, [globalTime]);

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // FFmpeg loading status
  const [ffmpegStatus, setFfmpegStatus] = useState("Initialising engine…");
  
  // Auto-switch text color based on theme to prevent invisible text
  useEffect(() => {
    if (isLightTheme && textColor === "#ffffff") setTextColor("#111827");
    if (!isLightTheme && textColor === "#111827") setTextColor("#ffffff");
  }, [isLightTheme]);

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
    const video = Array.isArray(data) ? data.find((v: any) => String(v.id) === videoId) : data;
    if (video && video.video_url) {
      const clip: VideoClip = { id: "remote-0", name: video.title || "Video", url: video.video_url, fileDuration: 0, duration: 0, trimStart: 0, trimEnd: 0, color: "#3b82f6", startTime: 0, trackId: "v1", x: 0, y: 0, videoZoom: 1, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0, enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.1, playbackRate: 1 };
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
        width: aspectRatio.w,
        height: aspectRatio.h,
        backgroundColor: "transparent",
        preserveObjectStacking: true,
      });
      // Track selected object for text controls
      initCanvas.on("selection:created", (e) => { 
        setSelectedObj(e.selected?.[0] ?? null); 
        refreshAssets(); 
        if (e.selected && e.selected.length > 0 && e.selected[0].id !== 'video-proxy') {
           setActiveTab("adjust");
           const id = e.selected[0].id || "";
           if (id.startsWith("txt-")) setLeftPanel("text");
           else if (id.startsWith("stk-")) setLeftPanel("stickers");
           else if (id.startsWith("shp-")) setLeftPanel("shapes");
        }
      });
      initCanvas.on("selection:updated", (e) => { 
        setSelectedObj(e.selected?.[0] ?? null); 
        refreshAssets(); 
        if (e.selected && e.selected.length > 0 && e.selected[0].id !== 'video-proxy') {
           setActiveTab("adjust");
           const id = e.selected[0].id || "";
           if (id.startsWith("txt-")) setLeftPanel("text");
           else if (id.startsWith("stk-")) setLeftPanel("stickers");
           else if (id.startsWith("shp-")) setLeftPanel("shapes");
        }
      });
      initCanvas.on("selection:cleared", () => { setSelectedObj(null); refreshAssets(); });
      
      const trackBaseState = (o: any) => {
         if (!o || o.id === 'video-proxy') return;
         if (o.scaleX !== undefined) o._baseScaleX = o.scaleX;
         if (o.scaleY !== undefined) o._baseScaleY = o.scaleY;
         if (o.angle !== undefined) o._baseAngle = o.angle;
         if (o.left !== undefined) o._baseLeft = o.left;
         if (o.top !== undefined) o._baseTop = o.top;
         if (o.opacity !== undefined) o._baseOpacity = o.opacity;
      };

      initCanvas.on("object:added", (e) => {
         trackBaseState(e.target);
         refreshAssets();
      });
      initCanvas.on("object:modified", (e) => trackBaseState(e.target));
      initCanvas.on("object:moving", (e) => trackBaseState(e.target));
      initCanvas.on("object:scaling", (e) => trackBaseState(e.target));
      initCanvas.on("object:rotating", (e) => trackBaseState(e.target));
      initCanvas.on("object:removed", () => refreshAssets());
      initCanvas.on("path:created",   () => refreshAssets());
      
      initCanvas.on("mouse:down", () => {
         (initCanvas as any).__isDragging = true;
         const activeObj = initCanvas.getActiveObject();
         if (activeObj && (activeObj as any)._baseScaleX !== undefined) {
             activeObj.set({
                 scaleX: (activeObj as any)._baseScaleX,
                 scaleY: (activeObj as any)._baseScaleY,
                 angle: (activeObj as any)._baseAngle,
                 left: (activeObj as any)._baseLeft,
                 top: (activeObj as any)._baseTop,
                 opacity: (activeObj as any)._baseOpacity
             });
             activeObj.setCoords();
         }
      });
      initCanvas.on("mouse:up", () => {
         (initCanvas as any).__isDragging = false;
      });
      
      fabricCanvasRef.current = initCanvas;

      const handleKeydown = (e: KeyboardEvent) => {
        const activeObj = initCanvas.getActiveObject();
        if ((e.ctrlKey || e.metaKey) && activeObj) {
          if (e.key === ']') {
            initCanvas.bringForward(activeObj);
            initCanvas.renderAll();
            e.preventDefault();
          } else if (e.key === '[') {
            initCanvas.sendBackwards(activeObj);
            initCanvas.renderAll();
            e.preventDefault();
          }
        } else if (activeObj && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          // Keyboard nudge controls (Arrow keys)
          const moveStep = e.shiftKey ? 10 : 1;
          let moved = false;
          if (e.key === 'ArrowUp') { activeObj.top = (activeObj.top || 0) - moveStep; moved = true; }
          else if (e.key === 'ArrowDown') { activeObj.top = (activeObj.top || 0) + moveStep; moved = true; }
          else if (e.key === 'ArrowLeft') { activeObj.left = (activeObj.left || 0) - moveStep; moved = true; }
          else if (e.key === 'ArrowRight') { activeObj.left = (activeObj.left || 0) + moveStep; moved = true; }
          
          if (moved) {
            e.preventDefault();
            activeObj.setCoords();
            trackBaseState(activeObj); // Ensure animation loop doesn't override this new position
            initCanvas.renderAll();
          }
        }
      };
      window.addEventListener('keydown', handleKeydown);

      return () => {
        window.removeEventListener('keydown', handleKeydown);
        initCanvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Sync Fabric Canvas dimensions when Aspect Ratio changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({
        width: aspectRatio.w,
        height: aspectRatio.h
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [aspectRatio]);

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

  // --- Multi-Track Engine: Determine active clips for current globalTime ---
  const getActiveClipsAtTime = useCallback((time: number) => {
    return clips.filter(c => time >= c.startTime && time < c.startTime + c.duration)
                .filter(c => {
                   const t = videoTracks.find(track => track.id === c.trackId);
                   return t ? !t.isHidden : true;
                })
                .sort((a, b) => {
                    return videoTracks.findIndex(t => t.id === a.trackId) - videoTracks.findIndex(t => t.id === b.trackId);
                });
  }, [clips, videoTracks]);

  const activeClips = getActiveClipsAtTime(globalTime);
  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  // Clip total duration (sum)
  const totalDuration = clips.length > 0 
    ? Math.max(...clips.map(c => c.startTime + c.duration), 1)
    : 1;

  const updateSelectedClip = useCallback((updates: Partial<VideoClip>) => {
    if (!selectedClipId) return;
    setClips(prev => prev.map(c => {
      if (c.id === selectedClipId) {
        const merged = { ...c, ...updates };
        if (updates.trimStart !== undefined || updates.trimEnd !== undefined || updates.playbackRate !== undefined) {
           const tStart = merged.trimStart || 0;
           const tEnd = merged.trimEnd || merged.fileDuration;
           const pRate = merged.playbackRate || 1;
           merged.duration = (tEnd - tStart) / pRate;
        }
        return merged;
      }
      return c;
    }));
  }, [selectedClipId, setClips]);

  // --- Master Sync Engine ---
  // globalTime drives everything. videos sync to it.
  useEffect(() => {
    let frameId: number;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      if (isPlaying) {
        setGlobalTime(prev => {
           const next = prev + delta * playbackSpeed;
           if (next >= totalDuration) { setIsPlaying(false); return totalDuration; }
           return next;
        });
      }
      
      // Continuous Fabric Animation Sync
      if (fabricCanvasRef.current) {
        let needsRender = false;
        const activeObj = fabricCanvasRef.current.getActiveObject();
        const objects = fabricCanvasRef.current.getObjects();
        const gTime = globalTimeRef.current;
        const nowSec = performance.now() / 1000;
        
        objects.forEach((o: any) => {
            if (o.id === 'video-proxy') return;
            
            const startTime = o.startTime || 0;
            const endTime = o.endTime || 9999;
            const animType = o.animationType || 'none';
            const isActive = activeObj === o;
            
            if (gTime >= startTime && gTime <= endTime) {
                if (o._baseScaleX === undefined) {
                   o._baseScaleX = o.scaleX;
                   o._baseScaleY = o.scaleY;
                   o._baseAngle = o.angle;
                   o._baseLeft = o.left;
                   o._baseTop = o.top;
                   o._baseOpacity = o.opacity ?? 1;
                }

                const isDragging = (fabricCanvasRef.current as any)?.__isDragging;

                if (animType !== 'none' && (!isActive || !isDragging)) {
                    const speed = o.animationSpeed || 1.0;
                    const intensity = o.animationIntensity || 1.0;
                    const localTime = gTime - startTime;
                    
                    let scale = 1;
                    let rotate = 0;
                    let xOffset = 0;
                    let yOffset = 0;
                    let alpha = 1;
                    
                    // Selected object uses real-time for instant preview, else follows timeline
                    const animTime = isActive ? nowSec : localTime;

                    switch(animType) {
                       case 'pulse': scale = 1 + Math.sin(animTime * Math.PI * 2 * speed) * 0.1 * intensity; break;
                       case 'wiggle': rotate = Math.sin(animTime * Math.PI * 2 * speed) * 15 * intensity; break;
                       case 'float': yOffset = Math.sin(animTime * Math.PI * 2 * speed) * 10 * intensity; break;
                       case 'spin':
                       case 'spin-cw': rotate = animTime * 360 * speed; break;
                       case 'spin-ccw': rotate = -animTime * 360 * speed; break;
                       case 'blink': alpha = (Math.floor(animTime * 4 * speed) % 2 === 0) ? Math.max(0, 1 - 0.5 * intensity) : 1; break;
                       case 'slide-in-left': if (localTime < 1/speed) xOffset = -200 + (localTime * speed * 200); break;
                       case 'slide-in-right': if (localTime < 1/speed) xOffset = 200 - (localTime * speed * 200); break;
                       case 'slide-in-bottom': if (localTime < 1/speed) yOffset = 200 - (localTime * speed * 200); break;
                       case 'slide-in-top': if (localTime < 1/speed) yOffset = -200 + (localTime * speed * 200); break;
                    }
                    
                    o.set({
                        scaleX: o._baseScaleX * scale,
                        scaleY: o._baseScaleY * scale,
                        angle: o._baseAngle + rotate,
                        left: o._baseLeft + xOffset,
                        top: o._baseTop + yOffset,
                        opacity: (o._baseOpacity ?? 1) * alpha,
                        visible: true
                    });
                    needsRender = true;
                } else if (!isActive || isDragging) {
                    if (o._baseScaleX !== undefined && (o.scaleX !== o._baseScaleX || o.angle !== o._baseAngle || o.left !== o._baseLeft || o.top !== o._baseTop || o.opacity !== o._baseOpacity)) {
                        o.set({
                            scaleX: o._baseScaleX,
                            scaleY: o._baseScaleY,
                            angle: o._baseAngle,
                            left: o._baseLeft,
                            top: o._baseTop,
                            opacity: o._baseOpacity,
                            visible: true
                        });
                        needsRender = true;
                    } else if (!o.visible) {
                        o.set({ visible: true });
                        needsRender = true;
                    }
                }
            } else {
                if (o.visible) {
                    o.set({ visible: false });
                    needsRender = true;
                }
            }
        });
        
        if (needsRender) {
            fabricCanvasRef.current.renderAll();
        }
      }

      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Sync active videos to globalTime
  useEffect(() => {
    activeClips.forEach(clip => {
       const vid = videoRefs.current[clip.id];
       if (!vid) return;
       const localTime = (globalTime - clip.startTime) + (clip.trimStart || 0);
       
       if (vid instanceof HTMLVideoElement) {
         if (Math.abs(vid.currentTime - localTime) > 0.15) {
            vid.currentTime = localTime;
         }
         
         if (isPlaying && vid.paused) {
            vid.play().catch(e => console.log(e));
         } else if (!isPlaying && !vid.paused) {
            vid.pause();
         }
         
         vid.playbackRate = (clip.playbackRate || 1) * playbackSpeed;
         vid.volume = (clip.volume !== undefined ? clip.volume : 1) * masterVolume;
         const t = videoTracks.find(tr => tr.id === clip.trackId);
         vid.muted = t ? !!t.isMuted : false;
       }
    });

    // Global background audio sync
    if (audioRef.current) {
      if (Math.abs(audioRef.current.currentTime - globalTime) > 0.15) {
        audioRef.current.currentTime = globalTime;
      }
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log(e));
      } else if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = masterVolume;
    }
  }, [globalTime, isPlaying, activeClips, playbackSpeed, videoTracks, masterVolume]);

  // Auto-scroll timeline during playback
  useEffect(() => {
    if (!isPlaying || !tracksAreaRef.current) return;
    const container = tracksAreaRef.current.parentElement;
    if (!container) return;
    
    const trackWidth = tracksAreaRef.current.scrollWidth - 80; // W - 24 - 56
    const playheadPx = 68 + (globalTime / (totalDuration || 1)) * trackWidth;
    
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    
    // If playhead goes beyond 80% of the visible container, scroll it
    const thresholdRight = scrollLeft + clientWidth * 0.8;
    const thresholdLeft = scrollLeft + clientWidth * 0.2;
    
    if (playheadPx > thresholdRight) {
      container.scrollLeft = playheadPx - clientWidth * 0.8;
    } else if (playheadPx < thresholdLeft && scrollLeft > 0) {
      container.scrollLeft = Math.max(0, playheadPx - clientWidth * 0.2);
    }
  }, [globalTime, isPlaying, totalDuration]);

  // Canvas Resize Sync
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setWidth(aspectRatio.w);
      fabricCanvasRef.current.setHeight(aspectRatio.h);
      fabricCanvasRef.current.renderAll();
    }
  }, [aspectRatio]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const time = Number(e.target.value);
    setGlobalTime(time);
  };

  // Playhead dragging
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksAreaRef.current) return;
      const rect = tracksAreaRef.current.getBoundingClientRect();
      const paddingLeft = 68; // px-3 (12) + w-14 track header (56)
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
    };

    const handleMouseUp = () => setAssetDragState(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [assetDragState, totalDuration, canvasAssets, refreshAssets]);

  // Clip Drag & Trim Logic
  useEffect(() => {
    if (!clipDragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksAreaRef.current) return;
      const rect = tracksAreaRef.current.getBoundingClientRect();
      const trackWidth = rect.width - 80; 
      const deltaPx = e.clientX - clipDragState.startX;
      const deltaTime = (deltaPx / trackWidth) * (totalDuration || 1);

      let hoverTrackId: string | undefined;
      if (clipDragState.type === 'move') {
         const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
         const trackEl = target?.closest('[data-track-id]');
         if (trackEl) hoverTrackId = trackEl.getAttribute('data-track-id') || undefined;
      }

      setClips(prev => {
        let snapPoints = [0, globalTimeRef.current];
        prev.forEach(c => {
           if (c.id !== clipDragState.clipId) {
             snapPoints.push(c.startTime);
             snapPoints.push(c.startTime + c.duration);
           }
        });
        const SNAP_THRESHOLD = (8 / trackWidth) * (totalDuration || 1); // 8px threshold

        return prev.map(c => {
          if (c.id !== clipDragState.clipId) return c;

          if (clipDragState.type === 'move') {
            let newStart = Math.max(0, clipDragState.initialStart + deltaTime);
            let newEnd = newStart + clipDragState.initialDuration;
            
            if (isSnappingEnabledRef.current) {
               let closestStartSnap = snapPoints.find(p => Math.abs(p - newStart) < SNAP_THRESHOLD);
               let closestEndSnap = snapPoints.find(p => Math.abs(p - newEnd) < SNAP_THRESHOLD);
               if (closestStartSnap !== undefined) newStart = closestStartSnap;
               else if (closestEndSnap !== undefined) newStart = closestEndSnap - clipDragState.initialDuration;
            }
            
            return { ...c, startTime: newStart, trackId: hoverTrackId || c.trackId };
          } else if (clipDragState.type === 'trimStart') {
            let newStartTime = clipDragState.initialStart + deltaTime;
            let currentDeltaTime = deltaTime;
            
            if (isSnappingEnabledRef.current) {
               let closestStartSnap = snapPoints.find(p => Math.abs(p - newStartTime) < SNAP_THRESHOLD);
               if (closestStartSnap !== undefined) {
                  currentDeltaTime = closestStartSnap - clipDragState.initialStart;
                  newStartTime = closestStartSnap;
               }
            }
            
            let newTrimStart = clipDragState.initialTrimStart + currentDeltaTime;
            
            if (newTrimStart < 0) {
               const over = -newTrimStart;
               newTrimStart = 0;
               newStartTime += over;
            }
            if (newTrimStart >= clipDragState.initialTrimEnd - 0.2) {
               newTrimStart = clipDragState.initialTrimEnd - 0.2;
               newStartTime = clipDragState.initialStart + (newTrimStart - clipDragState.initialTrimStart);
            }
            
            return {
               ...c,
               startTime: newStartTime,
               trimStart: newTrimStart,
               duration: clipDragState.initialTrimEnd - newTrimStart
            };

          } else if (clipDragState.type === 'trimEnd') {
            let currentDeltaTime = deltaTime;
            let newEndTime = clipDragState.initialStart + clipDragState.initialDuration + currentDeltaTime;
            
            if (isSnappingEnabledRef.current) {
               let closestEndSnap = snapPoints.find(p => Math.abs(p - newEndTime) < SNAP_THRESHOLD);
               if (closestEndSnap !== undefined) {
                  currentDeltaTime = closestEndSnap - (clipDragState.initialStart + clipDragState.initialDuration);
               }
            }
            
            let newTrimEnd = clipDragState.initialTrimEnd + currentDeltaTime;
            if (c.type !== "ticker" && c.type !== "image" && newTrimEnd > clipDragState.fileDuration) {
               newTrimEnd = clipDragState.fileDuration;
            }
            if (newTrimEnd <= clipDragState.initialTrimStart + 0.2) {
               newTrimEnd = clipDragState.initialTrimStart + 0.2;
            }
            return {
               ...c,
               trimEnd: newTrimEnd,
               duration: newTrimEnd - clipDragState.initialTrimStart
            };
          }
          return c;
        });
      });
    };

    const handleMouseUp = () => setClipDragState(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clipDragState, totalDuration]);

  // Fade Drag Logic
  useEffect(() => {
    if (!fadeDragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksAreaRef.current) return;
      const rect = tracksAreaRef.current.getBoundingClientRect();
      const trackWidth = rect.width - 80; 
      const deltaPx = e.clientX - fadeDragState.startX;
      const deltaTime = (deltaPx / trackWidth) * (totalDuration || 1);

      setClips(prev => prev.map(c => {
        if (c.id !== fadeDragState.clipId) return c;

        if (fadeDragState.type === 'fadeIn') {
           let newFade = Math.max(0, fadeDragState.initialFade + deltaTime);
           newFade = Math.min(newFade, c.duration / 2); // Cap at half duration
           return { ...c, fadeInDuration: newFade };
        } else if (fadeDragState.type === 'fadeOut') {
           let newFade = Math.max(0, fadeDragState.initialFade - deltaTime);
           newFade = Math.min(newFade, c.duration / 2); // Cap at half duration
           return { ...c, fadeOutDuration: newFade };
        }
        return c;
      }));
    };

    const handleMouseUp = () => setFadeDragState(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [fadeDragState, totalDuration]);
  // Fabric.js Video Proxy for direct manipulation
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    let existingProxy = fabricCanvasRef.current.getObjects().find(o => (o as any).id === 'video-proxy');
    
    if (!selectedClipId) {
      if (existingProxy) {
        fabricCanvasRef.current.remove(existingProxy);
        fabricCanvasRef.current.renderAll();
      }
      return;
    }

    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    const canvasWidth = aspectRatio.w;
    const canvasHeight = aspectRatio.h;
    const expectedLeft = canvasWidth / 2 + (clip.x / 100) * canvasWidth;
    const expectedTop = canvasHeight / 2 + (clip.y / 100) * canvasHeight;
    const expectedScale = clip.videoZoom;
    
    if (!existingProxy) {
      existingProxy = new fabric.Rect({
        width: canvasWidth - 10,
        height: canvasHeight - 10,
        originX: 'center',
        originY: 'center',
        left: expectedLeft,
        top: expectedTop,
        scaleX: expectedScale,
        scaleY: expectedScale,
        fill: 'rgba(0,0,0,0.01)', // Almost invisible but allows clicking the interior
        stroke: '#818cf8',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#818cf8',
        cornerStrokeColor: '#ffffff',
        cornerSize: 10,
        transparentCorners: false,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
      });
      (existingProxy as any).id = 'video-proxy';
      fabricCanvasRef.current.add(existingProxy);
      fabricCanvasRef.current.setActiveObject(existingProxy);
      fabricCanvasRef.current.renderAll();
    } else {
       if (Math.abs(existingProxy.left! - expectedLeft) > 0.1 || 
           Math.abs(existingProxy.top! - expectedTop) > 0.1 ||
           Math.abs((existingProxy.scaleX || 1) - expectedScale) > 0.001) {
           existingProxy.set({
              left: expectedLeft,
              top: expectedTop,
              scaleX: expectedScale,
              scaleY: expectedScale
           });
           existingProxy.setCoords();
           fabricCanvasRef.current.renderAll();
       }
    }

    const syncClipToProxy = (useHistoryState: boolean) => {
      if (!existingProxy) return;
      const x = ((existingProxy.left! - canvasWidth / 2) / canvasWidth) * 100;
      const y = ((existingProxy.top! - canvasHeight / 2) / canvasHeight) * 100;
      const zoom = existingProxy.scaleX || 1;
      
      const updateFn = (prev: VideoClip[]) => prev.map(c => 
        c.id === selectedClipId ? { ...c, x, y, videoZoom: zoom } : c
      );
      
      if (useHistoryState) {
        setClips(updateFn);
      } else {
        historyState.setWithoutHistory(updateFn);
      }
    };

    existingProxy.off('moving');
    existingProxy.off('scaling');
    existingProxy.off('modified');

    existingProxy.on('moving', () => syncClipToProxy(false));
    existingProxy.on('scaling', () => {
      if (existingProxy!.scaleX !== existingProxy!.scaleY) {
         existingProxy!.set({ scaleY: existingProxy!.scaleX });
      }
      syncClipToProxy(false);
    });
    existingProxy.on('modified', () => syncClipToProxy(true));

    const handleSelectionCleared = (e: any) => {
      if (!e.deselected) return;
      const deselectedProxy = e.deselected.find((o: any) => o.id === 'video-proxy');
      if (deselectedProxy) {
        setSelectedClipId(null);
      }
    };
    
    fabricCanvasRef.current.off('selection:cleared');
    fabricCanvasRef.current.on('selection:cleared', handleSelectionCleared);
  }, [selectedClipId, clips, aspectRatio, setClips, historyState]);

  // Direct Player Selection via Hit Testing and Text Tool Mode
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const handleMouseDown = (e: fabric.IEvent) => {
      if (e.target) return; // If clicked an existing fabric asset, just return

      const pointer = fabricCanvasRef.current?.getPointer(e.e);
      if (!pointer) return;

      // Find all clips visible at the current time
      const currentActiveClips = clips.filter(
        (clip) => globalTime >= clip.startTime && globalTime <= clip.startTime + clip.duration
      );

      // Iterate in reverse (highest z-index first) to hit topmost clip
      for (let i = currentActiveClips.length - 1; i >= 0; i--) {
        const clip = currentActiveClips[i];
        
        const cx = aspectRatio.w / 2 + (clip.x / 100) * aspectRatio.w;
        const cy = aspectRatio.h / 2 + (clip.y / 100) * aspectRatio.h;
        const w = aspectRatio.w * clip.videoZoom;
        const h = aspectRatio.h * clip.videoZoom;
        
        const left = cx - w / 2;
        const right = cx + w / 2;
        const top = cy - h / 2;
        const bottom = cy + h / 2;
        
        if (pointer.x >= left && pointer.x <= right && pointer.y >= top && pointer.y <= bottom) {
          setSelectedClipId(clip.id);
          setSelectedAssetId(null);
          fabricCanvasRef.current?.discardActiveObject();
          fabricCanvasRef.current?.renderAll();
          return;
        }
      }
      
      // If no clip was hit, user clicked empty background.
      setSelectedClipId(null);
    };

    fabricCanvasRef.current.on('mouse:down', handleMouseDown);
    return () => {
      fabricCanvasRef.current?.off('mouse:down', handleMouseDown);
    };
  }, [clips, globalTime, aspectRatio, leftPanel, textFont, textColor, textSize, textBold, textItalic, textUnderline, totalDuration]);

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;
    const text = new fabric.IText("Click to edit", {
      left: 80,
      top: 80,
      fontFamily: textFont,
      fill: textColor,
      fontSize: textSize,
      fontWeight: textBold ? "bold" : "normal",
      fontStyle: textItalic ? "italic" : "normal",
      underline: textUnderline,
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.8)", blur: 4, offsetX: 2, offsetY: 2 })
    });
    (text as any).id = `txt-${Date.now()}`;
    (text as any).startTime = globalTime;
    (text as any).endTime = Math.min(globalTime + 3, totalDuration); // default 3s duration
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    fabricCanvasRef.current.renderAll();
    setSelectedObj(text);
  };

  const handleAddTicker = () => {
    const newTrackId = `v${Date.now()}`;
    setVideoTracks(prev => [...prev, { id: newTrackId, name: `T${prev.length + 1}` }]);
    
    const defaultText = "BREAKING NEWS: Type your scrolling text here...";
    const defaultFontSize = 32;
    const calculatedHeightPx = (1 * defaultFontSize * 1.2) + (defaultFontSize * 0.8);
    const heightPct = (calculatedHeightPx / aspectRatio.h) * 100;
    const autoBottomY = Math.max(0, 100 - heightPct);

    const tickerClip: VideoClip = {
      id: `ticker-${Date.now()}`,
      type: "ticker",
      name: "News Ticker",
      url: "", // Not used
      fileDuration: 10,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      startTime: globalTime,
      trackId: newTrackId,
      color: "#ff3b30",
      x: 0,
      y: autoBottomY, // Auto-fit seamlessly to the bottom
      videoZoom: 1, // Determines height multiplier
      brightness: 0,
      contrast: 1,
      saturate: 1,
      sepia: 0,
      hueRotate: 0,
      enableChromaKey: false,
      chromaKeyColor: "#00ff00",
      chromaKeySimilarity: 0.1,
      playbackRate: 1,
      volume: 1,
      isForeground: true, // Always foreground by default
      tickerText: defaultText,
      tickerBgColor: "#cc0000",
      tickerTextColor: "#ffffff",
      tickerFontSize: 32,
      tickerSpeed: 150, // px per sec
      tickerFontFamily: "Arial",
      tickerLoop: true,
    };

    setClips(prev => [...prev, tickerClip]);
    setSelectedClipId(tickerClip.id);
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

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;
    
    try {
      showToast("Uploading logo...", "success");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) {
        showToast("Failed to upload logo", "error");
        return;
      }

      const fileUrl = data.url;

      // Save to library
      const newLogo = { id: Date.now().toString(), url: fileUrl, name: file.name.replace(/\.[^/.]+$/, "") };
      const newLogos = [...customLogos, newLogo];
      setCustomLogos(newLogos);
      try { localStorage.setItem("custom_video_logos", JSON.stringify(newLogos)); } catch(e) {}

      // Add to canvas
      fabric.Image.fromURL(fileUrl, (img) => {
        const maxW = 200;
        if (img.width && img.width > maxW) {
           img.scaleToWidth(maxW);
        } else {
           img.scale(0.5);
        }
        img.set({ left: 40, top: 40 });
        (img as any).id = `img-${Date.now()}`;
        (img as any).startTime = globalTime;
        (img as any).endTime = Math.min(globalTime + 5, totalDuration);
        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.renderAll();
      }, { crossOrigin: 'anonymous' });
      
      showToast("Logo added successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Error uploading logo", "error");
    }

    e.target.value = '';
  };

  const handleRemoveCustomLogo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newLogos = customLogos.filter(l => l.id !== id);
    setCustomLogos(newLogos);
    try { localStorage.setItem("custom_video_logos", JSON.stringify(newLogos)); } catch(e) {}
  };

  const handleRenameCustomLogo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const logo = customLogos.find(l => l.id === id);
    if (!logo) return;
    const newName = prompt("Enter new name for logo:", logo.name || "Untitled");
    if (newName && newName.trim() !== "") {
      const newLogos = customLogos.map(l => l.id === id ? { ...l, name: newName.trim() } : l);
      setCustomLogos(newLogos);
      try { localStorage.setItem("custom_video_logos", JSON.stringify(newLogos)); } catch(e) {}
    }
  };

  const handleAddDefaultLogo = (url: string) => {
    if (!fabricCanvasRef.current) return;
    fabric.Image.fromURL(url, (img) => {
      img.scale(0.2);
      img.set({ left: 40, top: 40 });
      (img as any).id = `img-${Date.now()}`;
      (img as any).startTime = globalTime;
      (img as any).endTime = Math.min(globalTime + 5, totalDuration);
      fabricCanvasRef.current?.add(img);
      fabricCanvasRef.current?.setActiveObject(img);
      fabricCanvasRef.current?.renderAll();
    }, { crossOrigin: 'anonymous' });
  };

  const handleApplyCrop = async () => {
    try {
      if (imgRef.current && completedCrop?.width && completedCrop?.height) {
        const croppedImageBase64 = await getCroppedImg(imgRef.current, completedCrop);
        if (cropTargetObj && fabricCanvasRef.current) {
          fabric.Image.fromURL(croppedImageBase64, (img) => {
            // copy properties
            img.set({
              left: cropTargetObj.left,
              top: cropTargetObj.top,
              scaleX: cropTargetObj.scaleX,
              scaleY: cropTargetObj.scaleY,
              angle: cropTargetObj.angle,
            });
            (img as any).id = (cropTargetObj as any).id;
            (img as any).startTime = (cropTargetObj as any).startTime;
            (img as any).endTime = (cropTargetObj as any).endTime;
            
            fabricCanvasRef.current?.remove(cropTargetObj);
            fabricCanvasRef.current?.add(img);
            fabricCanvasRef.current?.setActiveObject(img);
            fabricCanvasRef.current?.renderAll();
            setSelectedObj(img);
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsCropModalOpen(false);
  };

  const handleAddShape = (type: "rect" | "circle" | "triangle") => {
    if (!fabricCanvasRef.current) return;
    let shape: fabric.Object;
    const commonProps = {
      left: 100 + Math.random() * 50,
      top: 100 + Math.random() * 50,
      fill: shapeColor,
      stroke: brushColor,
      strokeWidth: 0,
    };
    
    if (type === "rect") shape = new fabric.Rect({ ...commonProps, width: 100, height: 100 });
    else if (type === "circle") shape = new fabric.Circle({ ...commonProps, radius: 50 });
    else shape = new fabric.Triangle({ ...commonProps, width: 100, height: 100 });

    (shape as any).id = `shp-${Date.now()}`;
    (shape as any).startTime = globalTime;
    (shape as any).endTime = Math.min(globalTime + 3, totalDuration);

    fabricCanvasRef.current.add(shape);
    fabricCanvasRef.current.setActiveObject(shape);
    fabricCanvasRef.current.renderAll();
  };

  const handleAddProElement = (element: any) => {
    let targetTrackId = "v2";
    if (!videoTracks.find(t => t.id === "v2")) {
      setVideoTracks(prev => [...prev, { id: "v2", name: "V2" }]);
    }
    
    const newClip: VideoClip = {
      id: `el_${Date.now()}`,
      url: element.url,
      startTime: globalTime,
      duration: 5,
      fileDuration: 5,
      trackId: targetTrackId,
      videoZoom: 1,
      x: 0,
      y: 0,
      brightness: 0,
      contrast: 1,
      saturate: 1,
      sepia: 0,
      hueRotate: 0,
      playbackRate: 1,
      volume: 1,
      name: element.name,
      enableChromaKey: element.type === "greenscreen",
      chromaKeyColor: element.color || "#000000",
      chromaKeySimilarity: 0.3,
      opacity: element.opacity,
      color: CLIP_COLORS[Math.floor(Math.random() * CLIP_COLORS.length)]
    };
    
    setClips(prev => [...prev, newClip]);
    showToast(`Added ${element.name} to V2`, "success");
  };

  const handleAddProText = (preset: any) => {
    if (!fabricCanvasRef.current) return;
    const text = new fabric.IText(preset.name, {
      left: 100,
      top: 100,
      fontFamily: preset.fontFamily || "Inter",
      fill: preset.fill || "#ffffff",
      fontSize: preset.fontSize || 60,
      fontWeight: preset.fontWeight || "bold",
      shadow: preset.shadow ? new fabric.Shadow(preset.shadow) : undefined,
      stroke: preset.stroke,
      strokeWidth: preset.strokeWidth,
      backgroundColor: preset.backgroundColor
    });
    (text as any).id = `txt-${Date.now()}`;
    (text as any).startTime = globalTime;
    (text as any).endTime = Math.min(globalTime + 3, totalDuration); 
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    setSelectedObj(text);
    setLeftPanel("text");
  };

  // Append imported video as a new clip
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      
      showToast(`Uploading ${file.name}...`, "info");
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        
        if (!data.success) {
          showToast(`Failed to upload ${file.name}`, "error");
          continue;
        }
        
        const persistentUrl = data.url;

        const addClip = (duration: number) => {
          const defaultTrack = videoTracks[0].id;
          const maxStartTimeOnTrack = clips
            .filter(c => c.trackId === defaultTrack)
            .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
            
          const newClip: VideoClip = {
            id: `c${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: isImage ? "image" : "video",
            name: file.name,
            url: persistentUrl,
            fileDuration: duration,
            duration: duration,
            trimStart: 0,
            trimEnd: duration,
            startTime: maxStartTimeOnTrack,
            trackId: defaultTrack,
            color: CLIP_COLORS[clips.length % CLIP_COLORS.length],
            x: 0, y: 0, videoZoom: 1, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0,
            enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.1,
            playbackRate: 1
          };
          setClips(prev => [...prev, newClip]);
          showToast(`${file.name} added to timeline!`, "success");
        };

        if (isImage) {
          addClip(5);
        } else {
          const tmpUrl = URL.createObjectURL(file);
          const tmp = document.createElement("video");
          tmp.src = tmpUrl;
          tmp.onloadedmetadata = () => {
            addClip(tmp.duration);
            tmp.remove();
            URL.revokeObjectURL(tmpUrl);
          };
        }
      } catch (err) {
        console.error(err);
        showToast(`Error uploading ${file.name}`, "error");
      }
    }
    e.target.value = "";
  };

  const deleteClip = (id: string) => {
    setClips(prev => {
      const deletedClip = prev.find(c => c.id === id);
      if (!deletedClip) return prev;
      
      const filtered = prev.filter(c => c.id !== id);
      
      if (isRippleEnabledRef.current) {
         return filtered.map(c => {
           if (c.trackId === deletedClip.trackId && c.startTime >= deletedClip.startTime) {
             return { ...c, startTime: Math.max(0, c.startTime - deletedClip.duration) };
           }
           return c;
         });
      }
      return filtered;
    });
    if (selectedClipId === id) setSelectedClipId(null);
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
    if (!selectedClipId && !selectedAssetId) return;
    
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

    const c = selectedClip;
    if (!c) return;
    const localSplit = globalTime - c.startTime + (c.trimStart || 0);
    
    if (localSplit <= (c.trimStart || 0) + 0.2 || localSplit >= (c.trimEnd || c.duration) - 0.2) {
       showToast("Playhead is too close to the edge to split video.", "error");
       return;
    }

    const pRate = c.playbackRate || 1;
    const clipA: VideoClip = { ...c, id: `${c.id}-a`, trimEnd: localSplit, duration: (localSplit - (c.trimStart || 0)) / pRate };
    const clipB: VideoClip = { ...c, id: `${c.id}-b`, trimStart: localSplit, startTime: globalTime, duration: ((c.trimEnd || c.fileDuration) - localSplit) / pRate, color: CLIP_COLORS[(CLIP_COLORS.indexOf(c.color) + 1) % CLIP_COLORS.length] };

    setClips(prev => [...prev.filter(x => x.id !== c.id), clipA, clipB]);
    showToast("Clip split at playhead!", "success");
  };

  const handleDuplicateClip = useCallback(() => {
    if (!selectedClipId) return;
    const c = clips.find(x => x.id === selectedClipId);
    if (!c) return;
    
    const newStartTime = c.startTime + c.duration;
    const duplicated: VideoClip = { 
       ...c, 
       id: `c${Date.now()}`, 
       startTime: newStartTime 
    };
    setClips(prev => [...prev, duplicated]);
    showToast("Clip duplicated!", "success");
  }, [clips, selectedClipId, setClips]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("Uploading audio...", "success");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) {
        showToast("Failed to upload audio", "error");
        return;
      }

      const fileUrl = data.url;
      setAudioUrl(fileUrl); // Set as current audio

      const newAudio = { id: `audio-${Date.now()}`, url: fileUrl, name: file.name.replace(/\.[^/.]+$/, "") };
      const newAudios = [newAudio, ...customAudios];
      setCustomAudios(newAudios);
      try { 
        localStorage.setItem("custom_video_audios", JSON.stringify(newAudios)); 
      } catch(err) {}
      showToast("Audio added to library!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error uploading audio", "error");
    }

    e.target.value = '';
  };

  const handleRemoveCustomAudio = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newAudios = customAudios.filter(a => a.id !== id);
    setCustomAudios(newAudios);
    try { localStorage.setItem("custom_video_audios", JSON.stringify(newAudios)); } catch(e) {}
  };

  const handleEditAudioDetails = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const audio = customAudios.find(a => a.id === id);
    if (!audio) return;
    setEditingAudioDetails({ 
      name: audio.name || "", 
      artist: audio.artist || "", 
      genre: audio.genre || "", 
      description: audio.description || "" 
    });
    setEditingAudioId(id);
  };

  const handleSaveAudioDetails = () => {
    if (!editingAudioId) return;
    const newAudios = customAudios.map(a => a.id === editingAudioId ? { ...a, ...editingAudioDetails } : a);
    setCustomAudios(newAudios);
    try { localStorage.setItem("custom_video_audios", JSON.stringify(newAudios)); } catch(e) {}
    setEditingAudioId(null);
  };

  const handleEditClipDetails = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const clip = customClips.find(c => c.id === id);
    if (!clip) return;
    setEditingClipDetails({ 
      name: clip.name || "", 
      description: clip.description || "" 
    });
    setEditingClipDetailsId(id);
  };

  const handleSaveClipDetails = () => {
    if (!editingClipDetailsId) return;
    const newClips = customClips.map(c => c.id === editingClipDetailsId ? { ...c, ...editingClipDetails } : c);
    setCustomClips(newClips);
    try { localStorage.setItem("custom_video_clips", JSON.stringify(newClips)); } catch(e) {}
    setEditingClipDetailsId(null);
  };

  const saveDraft = (name?: string) => {
    const draftName = name || draftNameInput.trim() || `Draft – ${new Date().toLocaleString()}`;
    let canvasJson: object | null = null;
    try {
      if (fabricCanvasRef.current) {
        const json = fabricCanvasRef.current.toJSON([
          'id', 'startTime', 'endTime', 'label', 
          'animationType', 'animationSpeed', 'animationIntensity', 
          'originalSrc', 'isLogo', 'isShape', 'shapeType',
          '_baseScaleX', '_baseScaleY', '_baseAngle', '_baseLeft', '_baseTop', '_baseOpacity'
        ]);
        
        json.objects?.forEach((o: any) => {
          if (o._baseScaleX !== undefined) {
            o.scaleX = o._baseScaleX;
            o.scaleY = o._baseScaleY;
            o.angle = o._baseAngle;
            o.left = o._baseLeft;
            o.top = o._baseTop;
            if (o._baseOpacity !== undefined) o.opacity = o._baseOpacity;
          }
        });
        canvasJson = json;
      }
    } catch(e) {}
    const draft: VideoDraft = {
      id: crypto.randomUUID(),
      name: draftName,
      savedAt: Date.now(),
      clips,
      videoUrl,
      originalVideoUrl,
      audioUrl,
      canvasJson,
    };
    const updated = [draft, ...drafts];
    setDrafts(updated);
    setDraftNameInput("");
    try { localStorage.setItem("video_editor_drafts", JSON.stringify(updated)); } catch(e) {}
    setHasUnsavedChanges(false);
    showToast(`Draft "${draftName}" saved!`, "success");
  };

  const loadDraft = (draft: VideoDraft) => {
    setClips(draft.clips || []);
    if (draft.videoUrl !== undefined) setVideoUrl(draft.videoUrl);
    if (draft.originalVideoUrl !== undefined) setOriginalVideoUrl(draft.originalVideoUrl);
    if (draft.audioUrl !== undefined) setAudioUrl(draft.audioUrl);
    if (draft.canvasJson && fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.loadFromJSON(draft.canvasJson, () => {
          fabricCanvasRef.current?.renderAll();
          refreshAssets();
        }, (o: any, obj: any) => {
          if (o.id) obj.id = o.id;
          if (o.startTime !== undefined) obj.startTime = o.startTime;
          if (o.endTime !== undefined) obj.endTime = o.endTime;
          if (o.label) obj.label = o.label;
          if (o.animationType) obj.animationType = o.animationType;
          if (o.animationSpeed !== undefined) obj.animationSpeed = o.animationSpeed;
          if (o.animationIntensity !== undefined) obj.animationIntensity = o.animationIntensity;
          if (o.originalSrc) obj.originalSrc = o.originalSrc;
          if (o.isLogo !== undefined) obj.isLogo = o.isLogo;
          if (o.isShape !== undefined) obj.isShape = o.isShape;
          if (o.shapeType) obj.shapeType = o.shapeType;
          if (o._baseScaleX !== undefined) obj._baseScaleX = o._baseScaleX;
          if (o._baseScaleY !== undefined) obj._baseScaleY = o._baseScaleY;
          if (o._baseAngle !== undefined) obj._baseAngle = o._baseAngle;
          if (o._baseLeft !== undefined) obj._baseLeft = o._baseLeft;
          if (o._baseTop !== undefined) obj._baseTop = o._baseTop;
          if (o._baseOpacity !== undefined) obj._baseOpacity = o._baseOpacity;
        });
      } catch(e) {}
    }
    setShowDraftsModal(false);
    showToast(`Loaded draft "${draft.name}"`, "success");
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    try { localStorage.setItem("video_editor_drafts", JSON.stringify(updated)); } catch(e) {}
    showToast("Draft deleted", "info");
  };

  const newProject = () => {
    setClips([]);
    setVideoUrl(null);
    setOriginalVideoUrl(null);
    setAudioUrl(null);
    setVideoTracks([{ id: "v1", name: "V1" }]);
    setGlobalTime(0);
    setSelectedClipId(null);
    setSelectedObj(null);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = "transparent";
      fabricCanvasRef.current.renderAll();
    }
    refreshAssets();
    setHasUnsavedChanges(false);
    setShowNewProjectConfirm(false);
    showToast("New project started", "success");
  };

  const generateMockVoiceover = () => {
    showToast("Generating AI Voiceover...", "info");
    setTimeout(() => {
      setAudioUrl("https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a");
      showToast("Voiceover generated successfully!", "success");
    }, 1500);
  };

  const generateExportCanvas = async () => {
    const w = aspectRatio.w;
    const h = aspectRatio.h;
    const [exportW, exportH] = aspectRatio.ffmpegScale.split(":").map(Number);
    const scaleFactorX = exportW / w;
    const scaleFactorY = exportH / h;
    
    const canvas = document.createElement("canvas");
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scaleFactorX, scaleFactorY);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);

    const currentActiveClips = [...activeClips].sort((a, b) => {
      const aIdx = videoTracks.findIndex(t => t.id === a.trackId);
      const bIdx = videoTracks.findIndex(t => t.id === b.trackId);
      return aIdx - bIdx;
    });

    const drawClip = (clip: VideoClip) => {
      const localTime = globalTime - clip.startTime;
      let baseOpacity = clip.opacity !== undefined ? clip.opacity : 1;
      let previewOpacity = baseOpacity;
      if (clip.fadeInDuration && localTime < clip.fadeInDuration) {
         previewOpacity = baseOpacity * (localTime / clip.fadeInDuration);
      } else if (clip.fadeOutDuration && localTime > clip.duration - clip.fadeOutDuration) {
         previewOpacity = baseOpacity * ((clip.duration - localTime) / clip.fadeOutDuration);
      }

      let animScale = 1;
      let animRotate = 0;
      let animX = 0;
      let animY = 0;

      if (clip.animationType && clip.animationType !== "none") {
        const speed = clip.animationSpeed || 1.0;
        const intensity = clip.animationIntensity || 1.0;
        
        switch(clip.animationType) {
          case "pulse":
            animScale = 1 + Math.sin(localTime * Math.PI * 2 * speed) * 0.1 * intensity;
            break;
          case "wiggle":
            animRotate = Math.sin(localTime * Math.PI * 2 * speed) * 15 * intensity;
            break;
          case "float":
            animY = Math.sin(localTime * Math.PI * 2 * speed) * 10 * intensity;
            break;
          case "spin":
          case "spin-cw":
            animRotate = localTime * 360 * speed;
            break;
          case "spin-ccw":
            animRotate = -localTime * 360 * speed;
            break;
          case "blink":
            previewOpacity *= (Math.floor(localTime * 4 * speed) % 2 === 0) ? Math.max(0, 1 - 0.5 * intensity) : 1;
            break;
          case "slide-in-left":
            if (localTime < 1 / speed) animX = -100 + (localTime * speed * 100);
            break;
          case "slide-in-right":
            if (localTime < 1 / speed) animX = 100 - (localTime * speed * 100);
            break;
          case "slide-in-bottom":
            if (localTime < 1 / speed) animY = 100 - (localTime * speed * 100);
            break;
          case "slide-in-top":
            if (localTime < 1 / speed) animY = -100 + (localTime * speed * 100);
            break;
        }
      }

      if (clip.type === "ticker") {
        ctx.save();
        ctx.globalAlpha = previewOpacity;

        ctx.translate(w / 2, h / 2);
        ctx.translate((animX / 100) * w, (animY / 100) * h);
        ctx.scale(animScale, animScale);
        ctx.rotate((animRotate * Math.PI) / 180);
        ctx.translate(-w / 2, -h / 2);
        
        const isLooping = clip.tickerLoop ?? true;
        const lines1 = (clip.tickerText || "").split("\n");
        const fontSize1 = clip.tickerFontSize || 32;
        const h1Px = lines1.length * fontSize1 * 1.2;
        
        let lines2: string[] = [];
        let fontSize2 = clip.tickerFontSize2 || 24;
        let h2Px = 0;
        
        if (clip.enableSecondaryTicker) {
          lines2 = (clip.tickerText2 || "").split("\n");
          h2Px = lines2.length * fontSize2 * 1.2;
        }

        const paddingPx = Math.max(fontSize1, fontSize2) * 0.8;
        const calculatedHeightPx = h1Px + h2Px + paddingPx;

        // Background
        ctx.fillStyle = clip.tickerBgColor || "#cc0000";
        const tickerY = (clip.y || 90) / 100 * h;
        const tickerH = calculatedHeightPx;
        ctx.fillRect(0, tickerY, w, tickerH);

        // Text Offsets
        const y1Px = clip.enableSecondaryTicker ? (tickerY + paddingPx / 2 + h1Px / 2) : (tickerY + calculatedHeightPx / 2);
        const y2Px = tickerY + paddingPx / 2 + h1Px + h2Px / 2;

        ctx.beginPath();
        ctx.rect(0, tickerY, w, tickerH);
        ctx.clip();

        ctx.textBaseline = "middle";

        // Draw Line 1
        let scrollOffset1 = localTime * (clip.tickerSpeed || 150);
        const estimatedTextWidth1 = (clip.tickerText?.length || 0) * fontSize1 * 0.6;
        const totalScrollDistance1 = w + estimatedTextWidth1;
        if (isLooping && totalScrollDistance1 > 0) scrollOffset1 = scrollOffset1 % totalScrollDistance1;

        ctx.fillStyle = clip.tickerTextColor || "#ffffff";
        ctx.font = `bold ${fontSize1}px ${clip.tickerFontFamily || 'Arial'}`;
        lines1.forEach((line, idx) => {
          const dy = (idx * 1.2 - (lines1.length - 1) * 0.6) * fontSize1;
          ctx.fillText(line, w - scrollOffset1, y1Px + dy);
        });

        // Draw Line 2
        if (clip.enableSecondaryTicker) {
          let scrollOffset2 = localTime * (clip.tickerSpeed2 || 100);
          const estimatedTextWidth2 = (clip.tickerText2?.length || 0) * fontSize2 * 0.6;
          const totalScrollDistance2 = w + estimatedTextWidth2;
          if (isLooping && totalScrollDistance2 > 0) scrollOffset2 = scrollOffset2 % totalScrollDistance2;

          ctx.fillStyle = clip.tickerTextColor2 || "#ffffff";
          ctx.font = `bold ${fontSize2}px ${clip.tickerFontFamily2 || 'Arial'}`;
          lines2.forEach((line, idx) => {
            const dy = (idx * 1.2 - (lines2.length - 1) * 0.6) * fontSize2;
            ctx.fillText(line, w - scrollOffset2, y2Px + dy);
          });
        }
        
        ctx.restore();
        return;
      }

      const mediaEl = videoRefs.current[clip.id] as HTMLImageElement | HTMLVideoElement;
      if (!mediaEl) return;

      ctx.save();
      ctx.filter = `brightness(${1 + clip.brightness}) contrast(${clip.contrast}) saturate(${clip.saturate}) sepia(${clip.sepia}) hue-rotate(${clip.hueRotate}deg)`;
      
      ctx.globalAlpha = previewOpacity;
      if (clip.opacity !== undefined && clip.opacity < 1) {
        ctx.globalCompositeOperation = "screen";
      }

      ctx.translate(w / 2, h / 2);
      ctx.translate(((clip.x + animX) / 100) * w, ((clip.y + animY) / 100) * h);
      ctx.scale(clip.videoZoom * animScale, clip.videoZoom * animScale);
      ctx.rotate((animRotate * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);

      let mediaW = (mediaEl as HTMLVideoElement).videoWidth || (mediaEl as HTMLImageElement).naturalWidth;
      let mediaH = (mediaEl as HTMLVideoElement).videoHeight || (mediaEl as HTMLImageElement).naturalHeight;
      if (mediaW && mediaH) {
        const scale = Math.max(w / mediaW, h / mediaH);
        const drawW = mediaW * scale;
        const drawH = mediaH * scale;
        const dx = (w - drawW) / 2;
        const dy = (h - drawH) / 2;
        try {
          ctx.drawImage(mediaEl, dx, dy, drawW, drawH);
        } catch (e) {}
      }

      ctx.restore();
    };

    // Draw background clips first
    currentActiveClips.filter(c => !c.isForeground).forEach(drawClip);

    if (fabricCanvasRef.current) {
       fabricCanvasRef.current.discardActiveObject();
       fabricCanvasRef.current.renderAll();
       const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: Math.max(scaleFactorX, scaleFactorY) });
       const img = new Image();
       img.src = dataUrl;
       await new Promise(r => img.onload = r);
       ctx.save();
       ctx.drawImage(img, 0, 0, w, h);
       ctx.restore();
    }

    // Draw foreground clips last (over the canvas assets)
    currentActiveClips.filter(c => c.isForeground).forEach(drawClip);

    return canvas;
  };

  const printImage = async () => {
    const canvas = await generateExportCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const windowContent = `<!DOCTYPE html><html><head><title>Print Image</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#27272a;"><img src="${dataUrl}" style="max-width:100%;max-height:100vh;box-shadow:0 0 20px rgba(0,0,0,0.5);"></body></html>`;
    const printWin = window.open('','_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.onload = function() {
          printWin.focus();
          printWin.print();
      };
    }
    setShowExportMenu(false);
  };

  const exportThumbnail = async () => {
    const canvas = await generateExportCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `thumbnail_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast("Thumbnail exported successfully!", "success");
    setShowExportMenu(false);
  };

  const renderVideo = async (exportType: "local" | "library" | "gcp") => {
    if (clips.length === 0) return;
    setIsRendering(true);
    setProgress(50); // Show intermediate progress since backend doesn't stream progress yet
    try {
      const validVideoClips = clips.filter(c => c.type !== "ticker" && c.url);

      let [exportW, exportH] = aspectRatio.ffmpegScale.split(":").map(Number);
      
      let crfVal = 20; // Default high quality CRF
      if (exportQuality === "medium") {
        crfVal = 24;
        const factor = 720 / Math.min(exportW, exportH);
        if (factor < 1) {
          exportW = Math.round(exportW * factor);
          exportH = Math.round(exportH * factor);
        }
      } else if (exportQuality === "low") {
        crfVal = 28;
        const factor = 480 / Math.min(exportW, exportH);
        if (factor < 1) {
          exportW = Math.round(exportW * factor);
          exportH = Math.round(exportH * factor);
        }
      }
      // Ensure even dimensions for H.264
      exportW = Math.round(exportW / 2) * 2;
      exportH = Math.round(exportH / 2) * 2;

      console.log(`[EXPORT QUALITY] Chosen: ${exportQuality}, Resolution: ${exportW}x${exportH}, CRF: ${crfVal}`);

      const ffScaleX = exportW / aspectRatio.w;
      const ffScaleY = exportH / aspectRatio.h;
      const exportFps = 60; // 60fps for buttery smooth tickers and animations

      const assetOverlays: { name: string; start: number; end: number, animType: string, animSpeed: number, animIntensity: number, cx: number, cy: number, blob: Blob }[] = [];
      if (fabricCanvasRef.current && canvasAssets.length > 0) {
        fabricCanvasRef.current.discardActiveObject();
        
        const validAssets = canvasAssets.filter(a => a.id !== 'video-proxy');
        for (let i = 0; i < validAssets.length; i++) {
          const a = validAssets[i];
          const o = a.obj as any;
          
          const currentScaleX = o.scaleX;
          const currentScaleY = o.scaleY;
          const currentAngle = o.angle;
          const currentOpacity = o.opacity;
          
          if (o._baseScaleX !== undefined) {
             o.set({ scaleX: o._baseScaleX, scaleY: o._baseScaleY, angle: 0, opacity: 1 });
             o.setCoords();
          } else {
             o.set({ angle: 0, opacity: 1 });
             o.setCoords();
          }
          
          const center = o.getCenterPoint();
          
          const dataUrl = o.toDataURL({ format: "png", multiplier: ffScaleX });
          const fname = `overlay_${i}.png`;
          const blob = await fetch(dataUrl).then(r => r.blob());
          
          assetOverlays.push({ 
             name: fname, 
             start: a.startTime, 
             end: a.endTime,
             animType: o.animationType || "none",
             animSpeed: o.animationSpeed || 1.0,
             animIntensity: o.animationIntensity || 1.0,
             cx: center.x * ffScaleX,
             cy: center.y * ffScaleY,
             blob
          });
          
          o.set({ scaleX: currentScaleX, scaleY: currentScaleY, angle: currentAngle, opacity: currentOpacity });
          o.setCoords();
        }
        fabricCanvasRef.current.renderAll();
      }

      const tickers = clips.filter(c => c.type === "ticker");

      // Helper: escape text for FFmpeg drawtext filter (text wrapped in single quotes)
      // Inside 'text=...' single quotes: \ must be \\, ' must be \', : must be \:, newline → pipe
      const escapeDrawtext = (text: string) =>
        text
          .replace(/\\/g, '\\\\')   // backslash first
          .replace(/'/g, "\\'")     // single quote
          .replace(/:/g, '\\:')     // colon (drawtext special char)
          .replace(/\[/g, '\\[')   // brackets
          .replace(/]/g, '\\]')
          .replace(/\n/g, ' | ');   // newlines → pipe separator

      // Helper: hex color string → FFmpeg 0xRRGGBB format
      const toFfmpegColor = (color: string) => {
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) {
          const hex = [m[1],m[2],m[3]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('');
          return { hex: `0x${hex}`, alpha: m[4] || '1.0' };
        }
        const clean = color.startsWith('#') ? color.slice(1) : 'cc0000';
        return { hex: `0x${clean}`, alpha: '1.0' };
      };

      // Create base black canvas at constant CFR to avoid frame-drop/duplicate jitter on output
      const sizeStr = `${exportW}x${exportH}`;
      let finalFilter = `color=c=black:s=${sizeStr}:d=${totalDuration}:r=${exportFps}[base]`;
      let lastOut = "[base]";

      // Sort clips by track index (V1 = bottom, V2 = top), then by start time
      const visibleClips = validVideoClips.filter(c => {
         const t = videoTracks.find(track => track.id === c.trackId);
         return t ? !t.isHidden : true;
      });
      const sortedClips = [...visibleClips].sort((a, b) => {
         const aIdx = videoTracks.findIndex(t => t.id === a.trackId);
         const bIdx = videoTracks.findIndex(t => t.id === b.trackId);
         if (aIdx !== bIdx) return aIdx - bIdx;
         return a.startTime - b.startTime;
      });

      for (let i = 0; i < sortedClips.length; i++) {
        const c = sortedClips[i];
        const tStart = c.trimStart || 0;
        const tEnd = c.trimEnd || c.fileDuration || 99999;
        
        const inputIdx = validVideoClips.findIndex(x => x.id === c.id);
        const nextOut = `[vout${i}]`;
        
        // Build per-clip filters: perfectly match CSS object-contain + transform scale
        const fitScale = `scale=${exportW}:${exportH}:force_original_aspect_ratio=decrease`;
        const zoomScale = c.videoZoom !== 1.0 ? `,scale=trunc(iw*${c.videoZoom}):trunc(ih*${c.videoZoom})` : "";
        
        const chromaFilter = c.enableChromaKey ? `,colorkey=${c.chromaKeyColor}:${c.chromaKeySimilarity}:0.0` : "";
        const colorFilter = `eq=brightness=${c.brightness}:contrast=${c.contrast}:saturation=${c.saturate}`;

        let fadeFilters = "";
        if (c.fadeInDuration && c.fadeInDuration > 0) {
           fadeFilters += `,fade=t=in:st=${c.startTime}:d=${c.fadeInDuration}:alpha=1`;
        }
        if (c.fadeOutDuration && c.fadeOutDuration > 0) {
           fadeFilters += `,fade=t=out:st=${c.startTime + c.duration - c.fadeOutDuration}:d=${c.fadeOutDuration}:alpha=1`;
        }

        const scaleFilter = fitScale + zoomScale + chromaFilter;
        
        const pRate = c.playbackRate || 1;
        const setptsFilter = pRate !== 1 ? `setpts=(PTS-STARTPTS)/${pRate}+${c.startTime}/TB` : `setpts=PTS-STARTPTS+${c.startTime}/TB`;

        let opacityFilter = "";
        if (c.opacity !== undefined && c.opacity < 1) {
          opacityFilter = `,format=rgba,colorchannelmixer=aa=${c.opacity}`;
        }

        // Force input clip to CFR to sync perfectly with canvas and avoid jitter
        const clipFilter = `[${inputIdx}:v]fps=fps=${exportFps},trim=start=${tStart}:end=${tEnd},${setptsFilter},${scaleFilter},${colorFilter}${fadeFilters}${opacityFilter}[v${i}]`;
        
        // Handle Picture-in-Picture positioning (X,Y offsets based on width/height percentages)
        const overlayX = `(W-w)/2 + W*(${c.x}/100)`;
        const overlayY = `(H-h)/2 + H*(${c.y}/100)`;

        finalFilter += `;${clipFilter};${lastOut}[v${i}]overlay=${overlayX}:${overlayY}:enable='between(t,${c.startTime},${c.startTime + c.duration})'${nextOut}`;
        lastOut = nextOut;
      }

      if (assetOverlays.length > 0) {
        for (let i = 0; i < assetOverlays.length; i++) {
          const a = assetOverlays[i];
          const inputIdx = validVideoClips.length + i;
          
          let assetFilter = `[${inputIdx}:v]format=rgba,setpts=PTS-STARTPTS`;
          let ox = `${a.cx} - w/2`;
          let oy = `${a.cy} - h/2`;
          const T = `(t-${a.start})`;
          
          switch(a.animType) {
            case "pulse":
              assetFilter += `,scale=w='iw*(1+sin(${T}*PI*2*${a.animSpeed})*0.1*${a.animIntensity})':h='ih*(1+sin(${T}*PI*2*${a.animSpeed})*0.1*${a.animIntensity})':eval=frame`;
              break;
            case "wiggle":
              assetFilter += `,rotate=a='sin(${T}*PI*2*${a.animSpeed})*PI/12*${a.animIntensity}':ow='hypot(iw,ih)':oh='hypot(iw,ih)':c=none`;
              break;
            case "spin-cw":
            case "spin":
              assetFilter += `,rotate=a='${T}*2*PI*${a.animSpeed}':ow='hypot(iw,ih)':oh='hypot(iw,ih)':c=none`;
              break;
            case "spin-ccw":
              assetFilter += `,rotate=a='-${T}*2*PI*${a.animSpeed}':ow='hypot(iw,ih)':oh='hypot(iw,ih)':c=none`;
              break;
            case "blink":
              assetFilter += `,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='a(X,Y)*if(eq(mod(floor(${T}*4*${a.animSpeed}),2),0),max(0,1-0.5*${a.animIntensity}),1)'`;
              break;
            case "slide-in-left":
              ox = `${a.cx} - w/2 + w * min(0, -1 + ${T}*${a.animSpeed})`;
              break;
            case "slide-in-right":
              ox = `${a.cx} - w/2 + w * max(0, 1 - ${T}*${a.animSpeed})`;
              break;
            case "slide-in-top":
              oy = `${a.cy} - h/2 + h * min(0, -1 + ${T}*${a.animSpeed})`;
              break;
            case "slide-in-bottom":
              oy = `${a.cy} - h/2 + h * max(0, 1 - ${T}*${a.animSpeed})`;
              break;
          }
          
          const nextOut = `[vasset${i}]`;
          finalFilter += `;${assetFilter}[prep_asset${i}];${lastOut}[prep_asset${i}]overlay=x='${ox}':y='${oy}':enable='between(t,${a.start},${a.end})'${nextOut}`;
          lastOut = nextOut;
        }
      }

      // Native drawtext+drawbox ticker — no PNG files, no overlay timing jitter
      if (tickers.length > 0) {
        // Canvas for measuring text width at export scale
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d')!;

        for (let i = 0; i < tickers.length; i++) {
          const tck = tickers[i];
          const fontSize1px = Math.round((tck.tickerFontSize || 32) * ffScaleY);
          const lines1 = (tck.tickerText || 'TICKER').split('\n');
          const h1Px = lines1.length * fontSize1px * 1.2;

          const fontSize2px = Math.round((tck.tickerFontSize2 || 24) * ffScaleY);
          const lines2 = tck.enableSecondaryTicker ? (tck.tickerText2 || '').split('\n') : [];
          const h2Px = tck.enableSecondaryTicker ? lines2.length * fontSize2px * 1.2 : 0;

          const paddingPx = Math.max(fontSize1px, tck.enableSecondaryTicker ? fontSize2px : 0) * 0.8;
          const totalH = Math.round(h1Px + h2Px + paddingPx);
          const yPx = Math.round(((tck.y !== undefined ? tck.y : 90) / 100) * exportH);
          const enableExpr = `between(t,${tck.startTime},${tck.startTime + tck.duration})`;
          const { hex: bgHex, alpha: bgAlpha } = toFfmpegColor(tck.tickerBgColor || '#cc0000');

          // 1. Draw background bar
          finalFilter += `;[${lastOut.slice(1,-1)}]drawbox=y=${yPx}:x=0:w=iw:h=${totalH}:color=${bgHex}@${bgAlpha}:t=fill:enable='${enableExpr}'[vtck_bg${i}]`;
          lastOut = `[vtck_bg${i}]`;

          // 2. Measure primary text width with canvas, use as fixed number in expression
          const text1Raw = lines1.join(' | ');
          measureCtx.font = `bold ${fontSize1px}px ${tck.tickerFontFamily || 'Arial'}`;
          const textW1 = Math.ceil(measureCtx.measureText(text1Raw).width) + 50;
          const loopW1 = exportW + textW1; // total scroll loop distance in pixels

          const text1 = escapeDrawtext(text1Raw);
          const speed1 = Math.round((tck.tickerSpeed || 150) * ffScaleX);
          const { hex: color1 } = toFfmpegColor(tck.tickerTextColor || '#ffffff');
          const y1Px = tck.enableSecondaryTicker
            ? yPx + Math.round(paddingPx / 4 + fontSize1px * 0.75)
            : yPx + Math.round(totalH / 2 - fontSize1px * 0.2);

          const startFrame = Math.round(tck.startTime * exportFps);
          const speedPerFrame1 = speed1 / exportFps;

          // Single-quoted x expression using frame-based variable 'n' for mathematical precision and zero timing jitter.
          finalFilter += `;[${lastOut.slice(1,-1)}]drawtext=text='${text1}':fontsize=${fontSize1px}:fontcolor=${color1}:x='trunc(w-mod((n-${startFrame})*${speedPerFrame1},${loopW1}))':y=${y1Px}:enable='${enableExpr}'[vtck_t1_${i}]`;
          lastOut = `[vtck_t1_${i}]`;

          // 3. Secondary text (if enabled)
          if (tck.enableSecondaryTicker && lines2.length > 0) {
            const text2Raw = lines2.join(' | ');
            measureCtx.font = `bold ${fontSize2px}px ${tck.tickerFontFamily2 || 'Arial'}`;
            const textW2 = Math.ceil(measureCtx.measureText(text2Raw).width) + 50;
            const loopW2 = exportW + textW2;

            const text2 = escapeDrawtext(text2Raw);
            const speed2 = Math.round((tck.tickerSpeed2 || 100) * ffScaleX);
            const speedPerFrame2 = speed2 / exportFps;
            const { hex: color2 } = toFfmpegColor(tck.tickerTextColor2 || '#ffffff');
            const y2Px = yPx + Math.round(paddingPx / 4 + h1Px + fontSize2px * 0.75);

            // Single-quoted x expression using frame-based variable 'n' for mathematical precision and zero timing jitter.
            finalFilter += `;[${lastOut.slice(1,-1)}]drawtext=text='${text2}':fontsize=${fontSize2px}:fontcolor=${color2}:x='trunc(w-mod((n-${startFrame})*${speedPerFrame2},${loopW2}))':y=${y2Px}:enable='${enableExpr}'[vtck_t2_${i}]`;
            lastOut = `[vtck_t2_${i}]`;
          }
        }
      }

      finalFilter += `;${lastOut}format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2[vout]`;

      const mapArgs = ["-map", "[vout]"];
      const inputArgs: string[] = [];
      validVideoClips.forEach((_, i) => inputArgs.push("-i", `clip${i}.mp4`));
      assetOverlays.forEach((a) => inputArgs.push("-loop", "1", "-framerate", exportFps.toString(), "-i", a.name));
      // Tickers now use native drawtext — no PNG inputs needed
      
      if (audioUrl) { inputArgs.push("-i", "audio.mp3"); }

      const manifest = {
        inputArgs,
        filter_complex: finalFilter,
        mapArgs,
        totalDuration: totalDuration.toString(),
        audioUrl: !!audioUrl,
        fps: exportFps,
        crf: crfVal,
        validVideoClipsCount: validVideoClips.length,
        assetOverlaysCount: assetOverlays.length,
        tickerAssetsCount: 0  // Tickers use inline drawtext — no PNG files
      };

      const formData = new FormData();
      formData.append("manifest", JSON.stringify(manifest));

      // Append video clips
      for (let i = 0; i < validVideoClips.length; i++) {
        const fileBlob = await fetch(validVideoClips[i].url).then(r => r.blob());
        formData.append("files", fileBlob, `clip${i}.mp4`);
      }
      
      // Append generated overlays
      for (let i = 0; i < assetOverlays.length; i++) {
        formData.append("files", assetOverlays[i].blob, assetOverlays[i].name);
      }
      // Note: Tickers use native drawtext — no PNG files to append
      
      // Append audio
      if (audioUrl) {
        const audioBlob = await fetch(audioUrl).then(r => r.blob());
        formData.append("files", audioBlob, "audio.mp3");
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const renderRes = await fetch(`${backendUrl}/video-editor/render`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!renderRes.ok) {
        const errText = await renderRes.text();
        console.error("Backend render failed:", errText);
        throw new Error("Backend rendering failed.");
      }

      const fileData = await renderRes.blob();
      console.log("Render response blob size:", fileData.size, "type:", fileData.type);
      
      if (fileData.size === 0) {
        throw new Error("Received empty video file from server.");
      }

      const url = URL.createObjectURL(fileData);
      setVideoUrl(url);

      if (exportType === "local") {
        // Must append to DOM so all browsers allow the programmatic click
        const a = document.createElement("a");
        a.href = url;
        a.download = "edited_video.mp4";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        // Small delay before removing to ensure download starts
        setTimeout(() => { document.body.removeChild(a); }, 200);
        showToast("Video downloaded successfully!", "success");
      } else {
        const exportFormData = new FormData();
        exportFormData.append("file", fileData, "edited_video.mp4");
        exportFormData.append("destination", exportType);
        const res = await fetch(`${backendUrl}/marketing-assets/export`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: exportFormData });
        showToast(res.ok ? `Saved to ${exportType === "gcp" ? "Google Cloud" : "Library"}!` : "Failed to export.", res.ok ? "success" : "error");
      }
    } catch (e) {
      console.error("renderVideo error:", e);
      showToast(String(e) || "Render failed.", "error");
    } finally {
      setIsRendering(false);
    }
  };

  // Keyboard Shortcuts (Master Listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") { e.preventDefault(); setIsPlaying(prev => !prev); }

      if (e.key === "Delete" || e.key === "Backspace") {
        let deleted = false;
        if (fabricCanvasRef.current) {
          const active = fabricCanvasRef.current.getActiveObject();
          if (active && !(active as any).isEditing) {
            if ((active as any).id === 'video-proxy') {
              // The proxy is selected, meaning a video clip is active
              if (selectedClipId) {
                deleteClip(selectedClipId);
                deleted = true;
              }
            } else {
              // A regular Fabric asset (text/image/sticker) is selected
              fabricCanvasRef.current.remove(active);
              fabricCanvasRef.current.renderAll();
              setSelectedObj(null);
              deleted = true;
            }
          }
        }
        if (!deleted && selectedClipId) {
          deleteClip(selectedClipId);
        }
      }

      // Ctrl+Z / Cmd+Z = Timeline Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        historyState.undo();
      }

      // Ctrl+Y / Cmd+Shift+Z = Timeline Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        historyState.redo();
      }

      // Left Arrow = Step back 0.1s (Shift = 1s)
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 0.1;
        setGlobalTime(Math.max(0, globalTime - step));
      }

      // Right Arrow = Step forward 0.1s (Shift = 1s)
      if (e.code === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 0.1;
        setGlobalTime(Math.min(totalDuration, globalTime + step));
      }

      // S or Ctrl+B = Split Clip
      if (e.code === "KeyS" || ((e.ctrlKey || e.metaKey) && e.code === "KeyB")) {
        e.preventDefault();
        handleSplitClip();
      }

      // Ctrl+D or Ctrl+C = Duplicate
      if ((e.ctrlKey || e.metaKey) && (e.code === "KeyD" || e.code === "KeyC")) {
        e.preventDefault();
        handleDuplicateClip();
      }

      // I = Mark In (Set Trim Start)
      if (e.code === "KeyI" && selectedClip) {
        e.preventDefault();
        const local = globalTime - selectedClip.startTime + (selectedClip.trimStart || 0);
        updateSelectedClip({ trimStart: local });
      }

      // O = Mark Out (Set Trim End)
      if (e.code === "KeyO" && selectedClip) {
        e.preventDefault();
        const local = globalTime - selectedClip.startTime + (selectedClip.trimStart || 0);
        updateSelectedClip({ trimEnd: local });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }); // run on every render so closure has fresh refs

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [clips, canvasAssets, videoTracks, audioUrl]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  return (
    <div className="h-[calc(100dvh-64px)] md:h-[100dvh] w-full bg-zinc-950 text-zinc-300 flex flex-col font-sans select-none overflow-hidden">

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">Unsaved Changes</h3>
            <p className="text-sm text-zinc-400 mb-6">You have unsaved changes in your project. Do you want to save a draft before leaving?</p>
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => { 
                  setShowExitConfirm(false); 
                  setHasUnsavedChanges(false);
                  setTimeout(() => router.back(), 0); 
                }} 
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)} 
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  saveDraft(); 
                  setShowExitConfirm(false); 
                  setTimeout(() => router.back(), 0); 
                }} 
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT CONFIRMATION MODAL */}
      {showNewProjectConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Start New Project?</h2>
                <p className="text-sm text-zinc-400 mt-0.5">All current work will be cleared.</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-zinc-400">Do you want to save the current project as a draft before starting a new one?</p>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowNewProjectConfirm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                <button onClick={newProject} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Discard & New</button>
                <button
                  onClick={() => { saveDraft(); newProject(); }}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save & New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Clear Entire Project?</h2>
                <p className="text-sm text-zinc-400 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-800/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)} 
                className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setClips([]); 
                  setVideoUrl(null); 
                  setOriginalVideoUrl(null);
                  if (fabricCanvasRef.current) { 
                    fabricCanvasRef.current.clear(); 
                    fabricCanvasRef.current.backgroundColor = "transparent"; 
                  }
                  refreshAssets();
                  setShowClearConfirm(false);
                  showToast("Project cleared", "success");
                }} 
                className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORAGE SETTINGS MODAL */}
      {showStorageSettings && (
        <div className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowStorageSettings(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" /> Storage Settings
              </h2>
              <button onClick={() => setShowStorageSettings(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {storageSettingsLoading ? (
              <div className="p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : (
            <div className="p-6 space-y-5">
              {/* Provider */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Storage Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "local", label: "Local Only", icon: <HardDrive className="w-4 h-4" />, color: "indigo" },
                    { value: "dual", label: "Dual Backup", icon: <CloudUpload className="w-4 h-4" />, color: "emerald" },
                    { value: "gdrive", label: "Google Drive", icon: <Upload className="w-4 h-4" />, color: "pink" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStorageForm(f => ({ ...f, video_storage_provider: opt.value }))}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        storageForm.video_storage_provider === opt.value
                          ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {storageForm.video_storage_provider === "local" && "Files are saved to your local server disk."}
                  {storageForm.video_storage_provider === "dual" && "Files are saved locally AND synced to Google Drive."}
                  {storageForm.video_storage_provider === "gdrive" && "Files are saved locally first, then primary URL served from Drive."}
                </p>
              </div>

              {/* Local Path */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Local Upload Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={storageForm.video_upload_local_path}
                    onChange={e => setStorageForm(f => ({ ...f, video_upload_local_path: e.target.value }))}
                    placeholder="public/uploads"
                    className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors font-mono"
                  />
                  <button
                    onClick={() => folderBrowserField === "upload" ? (setFolderBrowserField(null)) : openFolderBrowser("upload")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${folderBrowserField === "upload" ? "bg-indigo-600 text-white border-indigo-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"}`}
                  >
                    <Folder className="w-3.5 h-3.5" /> Browse
                  </button>
                </div>
                {/* Inline Folder Browser — Upload */}
                {folderBrowserField === "upload" && (
                  <div className="mt-2 bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">
                        {folderBrowserError ? "Error" : folderBrowserData ? `frontend/${folderBrowserData.current === "." ? "" : folderBrowserData.current}` : "Loading..."}
                      </span>
                      {folderBrowserData?.parent !== null && folderBrowserData?.parent !== undefined && (
                        <button onClick={() => browseDir("frontend", folderBrowserData.parent!)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <ChevronUp className="w-3 h-3" /> Up
                        </button>
                      )}
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {folderBrowserLoading ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
                      ) : folderBrowserError ? (
                        <div className="p-3 text-xs text-red-400 bg-red-950/30 font-mono break-all">{folderBrowserError}</div>
                      ) : folderBrowserData?.entries.length === 0 ? (
                        <p className="text-xs text-zinc-500 px-3 py-3">No subdirectories</p>
                      ) : (
                        folderBrowserData?.entries.map(e => (
                          <div key={e.path} className="flex items-center hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0">
                            <button onClick={() => selectFolder(e.path)} className="flex-1 flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-300 text-left hover:text-indigo-400 group">
                              <Folder className="w-4 h-4 text-amber-500 group-hover:text-amber-400 shrink-0" />
                              <span className="font-mono">{e.name}</span>
                            </button>
                            <button onClick={() => browseDir("frontend", e.path)} className="px-4 py-2.5 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-800" title="Browse inside">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {folderBrowserData && (
                      <div className="border-t border-zinc-800">
                        <div className="px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-mono truncate">{folderBrowserData.current === "." ? "(root)" : folderBrowserData.current}</span>
                          <button onClick={() => selectFolder(folderBrowserData.current === "." ? "public" : folderBrowserData.current)} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> Use This Folder
                          </button>
                        </div>
                        <div className="px-3 pb-2 flex gap-2 border-t border-zinc-800/60">
                          <input
                            type="text"
                            value={customPathInput}
                            onChange={e => setCustomPathInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && customPathInput.trim()) { selectFolder(customPathInput.trim()); setCustomPathInput(""); } }}
                            placeholder="Or type any path, e.g. public/my-folder"
                            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded px-2 py-1.5 text-xs text-white font-mono outline-none mt-2"
                          />
                          <button
                            onClick={() => { if (customPathInput.trim()) { selectFolder(customPathInput.trim()); setCustomPathInput(""); } }}
                            disabled={!customPathInput.trim()}
                            className="mt-2 px-2.5 py-1.5 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-1">Must start with <code className="bg-zinc-800 px-1 rounded">public/</code> for Next.js to serve files directly.</p>
              </div>

              {/* Video Export Path */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Video Export Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={storageForm.video_export_path}
                    onChange={e => setStorageForm(f => ({ ...f, video_export_path: e.target.value }))}
                    placeholder="uploads/videos"
                    className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors font-mono"
                  />
                  <button
                    onClick={() => folderBrowserField === "export" ? (setFolderBrowserField(null)) : openFolderBrowser("export")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${folderBrowserField === "export" ? "bg-indigo-600 text-white border-indigo-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"}`}
                  >
                    <Folder className="w-3.5 h-3.5" /> Browse
                  </button>
                </div>
                {/* Inline Folder Browser — Export */}
                {folderBrowserField === "export" && (
                  <div className="mt-2 bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">
                        {folderBrowserError ? "Error" : folderBrowserData ? `backend/${folderBrowserData.current === "." ? "" : folderBrowserData.current}` : "Loading..."}
                      </span>
                      {folderBrowserData?.parent !== null && folderBrowserData?.parent !== undefined && (
                        <button onClick={() => browseDir("backend", folderBrowserData.parent!)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <ChevronUp className="w-3 h-3" /> Up
                        </button>
                      )}
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {folderBrowserLoading ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
                      ) : folderBrowserError ? (
                        <div className="p-3 text-xs text-red-400 bg-red-950/30 font-mono break-all">{folderBrowserError}</div>
                      ) : folderBrowserData?.entries.length === 0 ? (
                        <p className="text-xs text-zinc-500 px-3 py-3">No subdirectories</p>
                      ) : (
                        folderBrowserData?.entries.map(e => (
                          <div key={e.path} className="flex items-center hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0">
                            <button onClick={() => selectFolder(e.path)} className="flex-1 flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-300 text-left hover:text-indigo-400 group">
                              <Folder className="w-4 h-4 text-amber-500 group-hover:text-amber-400 shrink-0" />
                              <span className="font-mono">{e.name}</span>
                            </button>
                            <button onClick={() => browseDir("backend", e.path)} className="px-4 py-2.5 text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-800" title="Browse inside">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {folderBrowserData && (
                      <div className="border-t border-zinc-800">
                        <div className="px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-mono truncate">{folderBrowserData.current === "." ? "(root)" : folderBrowserData.current}</span>
                          <button onClick={() => selectFolder(folderBrowserData.current === "." ? "uploads" : folderBrowserData.current)} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> Use This Folder
                          </button>
                        </div>
                        <div className="px-3 pb-2 flex gap-2 border-t border-zinc-800/60">
                          <input
                            type="text"
                            value={customPathInput}
                            onChange={e => setCustomPathInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && customPathInput.trim()) { selectFolder(customPathInput.trim()); setCustomPathInput(""); } }}
                            placeholder="Or type any path, e.g. uploads/my-videos"
                            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded px-2 py-1.5 text-xs text-white font-mono outline-none mt-2"
                          />
                          <button
                            onClick={() => { if (customPathInput.trim()) { selectFolder(customPathInput.trim()); setCustomPathInput(""); } }}
                            disabled={!customPathInput.trim()}
                            className="mt-2 px-2.5 py-1.5 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-1">Where rendered videos are saved. Use <code className="bg-zinc-800 px-1 rounded">uploads/videos</code> for FastAPI or <code className="bg-zinc-800 px-1 rounded">public/videos</code> for Next.js.</p>
              </div>

              {/* Google Drive — show if not local-only */}
              {storageForm.video_storage_provider !== "local" && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Google Drive Folder ID</label>
                    <input
                      type="text"
                      value={storageForm.google_drive_folder_id}
                      onChange={e => setStorageForm(f => ({ ...f, google_drive_folder_id: e.target.value }))}
                      placeholder="1BxiMV...TnXeiq"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1">The ID from your Google Drive folder URL: <code className="bg-zinc-800 px-1 rounded">/folders/&lt;ID&gt;</code></p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">Service Account Credentials (JSON)</label>
                    <textarea
                      rows={3}
                      value={storageForm.google_drive_credentials}
                      onChange={e => setStorageForm(f => ({ ...f, google_drive_credentials: e.target.value }))}
                      placeholder='{"type":"service_account","project_id":"..."}'
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-xs outline-none transition-colors font-mono resize-none"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Paste the full JSON content of your downloaded service account key. Leave blank to keep the existing credentials.</p>
                  </div>
                </>
              )}
            </div>
            )}
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowStorageSettings(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={saveStorageSettings}
                disabled={storageSaving}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {storageSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                
                <span className="text-zinc-400">Undo / Redo</span>
                <span className="flex gap-1"><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Ctrl Z</kbd> / <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Ctrl Y</kbd></span>
                
                <span className="text-zinc-400">Jump Backward / Forward (1s)</span>
                <span className="flex gap-1"><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">Shift</kbd> + <kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-200 font-mono text-xs border border-zinc-700">← / →</kbd></span>
                
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
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => {
            if (hasUnsavedChanges) {
              setShowExitConfirm(true);
            } else {
              router.back();
            }
          }} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Go Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center shrink-0">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-sm font-semibold text-zinc-100 hidden sm:block">Video Editor</h1>
          </div>
          {/* ASPECT RATIO PRESETS */}
          <div className="hidden lg:flex items-center gap-2 ml-4">
            <select
              value={aspectRatio.id === 'custom' ? 'custom' : aspectRatio.id}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setShowCustomSize(true);
                } else {
                  const ar = ASPECT_RATIOS.find(a => a.id === val);
                  if (ar) setAspectRatio(ar);
                }
              }}
              className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <optgroup label="Social Media">
                {ASPECT_RATIOS.filter(ar => ar.category === 'Social').map(ar => (
                  <option key={ar.id} value={ar.id}>{ar.label}</option>
                ))}
              </optgroup>
              <optgroup label="Print (300 DPI)">
                {ASPECT_RATIOS.filter(ar => ar.category === 'Print').map(ar => (
                  <option key={ar.id} value={ar.id}>{ar.label}</option>
                ))}
              </optgroup>
              <option value="custom">Custom Size...</option>
            </select>

            <div className="relative">
              {showCustomSize && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 z-50">
                  <p className="text-sm font-semibold text-white mb-3">Custom Dimensions</p>
                  
                  <div className="mb-4">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1 block">Unit</label>
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                      {(["px", "in", "cm", "mm"] as const).map(u => (
                        <button
                          key={u}
                          onClick={() => setCustomUnit(u)}
                          className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${customUnit === u ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"}`}
                        >
                          {u.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Width ({customUnit})</label>
                      <input type="number" step="any" value={customW} onChange={e => setCustomW(+e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Height ({customUnit})</label>
                      <input type="number" step="any" value={customH} onChange={e => setCustomH(+e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCustomSize(false)} className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">Cancel</button>
                    <button onClick={() => {
                      let exportW = customW;
                      let exportH = customH;
                      const DPI = 96;
                      if (customUnit === "in") { exportW = Math.round(exportW * DPI); exportH = Math.round(exportH * DPI); }
                      else if (customUnit === "cm") { exportW = Math.round(exportW * (DPI / 2.54)); exportH = Math.round(exportH * (DPI / 2.54)); }
                      else if (customUnit === "mm") { exportW = Math.round(exportW * (DPI / 25.4)); exportH = Math.round(exportH * (DPI / 25.4)); }
                      
                      const maxDim = 640;
                      const ratio = Math.max(exportW, exportH) > maxDim ? maxDim / Math.max(exportW, exportH) : 1;
                      const w = Math.round(exportW * ratio);
                      const h = Math.round(exportH * ratio);

                      setAspectRatio({ id: 'custom', label: `Custom (${customW}${customUnit})`, w, h, ffmpegScale: `${exportW % 2 === 0 ? exportW : exportW + 1}:${exportH % 2 === 0 ? exportH : exportH + 1}` });
                      setShowCustomSize(false);
                    }} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 relative">
          <button onClick={() => setShowShortcutsModal(true)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Keyboard Shortcuts">
            <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setIsLightTheme(prev => !prev)}
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${isLightTheme ? "bg-amber-500/20 text-amber-500" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
            title="Toggle Light/Dark Theme for Editor panels"
          >
            <span className="text-[14px]">{isLightTheme ? "☀️" : "🌙"}</span>
          </button>

          <button
            onClick={() => { setShowStorageSettings(true); loadStorageSettings(); }}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Storage Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button onClick={() => setShowDraftsModal(true)} className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 text-zinc-300" title="Open Project">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden lg:inline">Open Project</span>
            {drafts.length > 0 && <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{drafts.length}</span>}
          </button>
          <button
            onClick={() => {
              if (hasUnsavedChanges) setShowNewProjectConfirm(true);
              else newProject();
            }}
            className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 text-zinc-300"
            title="New Project"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">New</span>
          </button>
          <button onClick={() => saveDraft()} className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 text-zinc-200">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save Draft</span>
          </button>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              disabled={!isLoaded || isRendering}
              className="px-3 py-1 sm:px-4 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isRendering ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Rendering </span>{progress}%</>
              ) : (
                <><Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span></>
              )}
            </button>
            
            {showExportMenu && !isRendering && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 text-left">
                {/* Quality Select Section */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Video Export Quality
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-zinc-900 rounded-lg border border-zinc-850">
                    {(["low", "medium", "high"] as const).map((q) => (
                      <button
                        key={q}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportQuality(q);
                        }}
                        className={`py-1 text-xs font-semibold rounded transition-all ${
                          exportQuality === q
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        {q === "low" ? "480p" : q === "medium" ? "720p" : "1080p"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-1">
                  <button onClick={printImage} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-800">
                    <Printer className="w-4 h-4 text-cyan-400" /> Print Image
                  </button>
                  <button onClick={exportThumbnail} className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-800">
                    <ImageIcon className="w-4 h-4 text-amber-400" /> Export Thumbnail (PNG)
                  </button>
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT SIDEBAR - TOOLS */}
        <div className="w-14 sm:w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 gap-1 overflow-y-auto shrink-0 z-10 custom-scrollbar">
          <input type="file" ref={fileInputRef} onChange={handleVideoUpload} accept="video/mp4,video/webm,image/png,image/jpeg,image/webp" className="hidden" multiple />
          <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />
          
          {/* Selection Tool */}
          <button onClick={() => setLeftPanel(null)} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${!leftPanel ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Selection Tool (V)">
            <MousePointer2 className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${!leftPanel ? "text-indigo-400" : "group-hover:scale-110"}`} />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Select</span>
          </button>
          
          <div className="w-8 h-px bg-zinc-800 my-0.5"></div>

          {/* Import */}
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex flex-col items-center gap-1 group" title="Import Video">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-indigo-400" />
            <span className="text-[9px] sm:text-[10px] font-medium text-indigo-400 hidden sm:block">Import</span>
          </button>
          {/* Text */}
          <button onClick={() => { setLeftPanel(leftPanel === "text" ? null : "text"); }} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "text" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Add Text">
            <Type className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Text</span>
          </button>
          {/* Elements */}
          <button onClick={() => setLeftPanel(leftPanel === "elements" ? null : "elements")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "elements" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Pro Elements">
            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Elements</span>
          </button>
          {/* Stickers */}
          <button onClick={() => setLeftPanel(leftPanel === "stickers" ? null : "stickers")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "stickers" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Stickers">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Stickers</span>
          </button>
          {/* Logo */}
          <button onClick={() => setLeftPanel(leftPanel === "logo" ? null : "logo")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "logo" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Add Logo">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Logo</span>
          </button>
          {/* Draw */}
          <button onClick={() => setLeftPanel(leftPanel === "draw" ? null : "draw")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "draw" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Draw">
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Draw</span>
          </button>
          {/* Shapes */}
          <button onClick={() => setLeftPanel(leftPanel === "shapes" ? null : "shapes")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "shapes" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Shapes">
            <Shapes className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Shapes</span>
          </button>
          {/* Media Library (now includes Clips + Audio tabs) */}
          <button onClick={() => { setLeftPanel(leftPanel === "media" ? null : "media"); }} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group ${leftPanel === "media" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Media, Clips & Audio">
            <Layers className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform ${leftPanel === "media" ? "text-indigo-400" : ""}`} />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Media</span>
          </button>
          {/* Adjust */}
          <button onClick={() => setActiveTab(activeTab === "adjust" ? "media" : "adjust")} className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 group mt-auto ${activeTab === "adjust" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`} title="Adjust">
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:block">Adjust</span>
          </button>
        </div>

        {/* LEFT PANEL DRAWER */}
        {leftPanel && (
          <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col z-10 overflow-hidden">
            {leftPanel === "elements" && (
              <div className="p-4 space-y-6 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pro Elements</p>
                {PRO_ELEMENTS.map(group => (
                  <div key={group.category} className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{group.category}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map(item => (
                        <button 
                          key={item.id}
                          onClick={() => handleAddProElement(item)}
                          className="flex items-center gap-1.5 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors group text-left overflow-hidden"
                          title={`${item.name} (${item.type === "greenscreen" ? "Auto Chroma Key" : "Overlay Blend"})`}
                        >
                          <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center shrink-0 text-xs group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <span className="text-[9px] font-medium text-zinc-300 group-hover:text-white transition-colors truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leftPanel === "media" && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b border-zinc-800 shrink-0">
                  {(["library", "clips", "audio"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setMediaTab(tab)}
                      className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        mediaTab === tab
                          ? "text-indigo-400 border-b-2 border-indigo-500 bg-zinc-800/60"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "library" ? "Library" : tab === "clips" ? "Clips" : "Audio"}
                    </button>
                  ))}
                </div>

                {/* ── TAB: Library ── */}
                {mediaTab === "library" && (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-4 pt-3 pb-3 border-b border-zinc-800 shrink-0">
                      <input ref={mediaLibInputRef} type="file" accept="video/*" multiple className="hidden" onChange={e => handleMediaLibraryUpload(e.target.files)} />
                      <div
                        className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-xl p-3 text-center cursor-pointer transition-colors group"
                        onClick={() => mediaLibInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-500"); }}
                        onDragLeave={e => { e.currentTarget.classList.remove("border-indigo-500"); }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-indigo-500"); handleMediaLibraryUpload(e.dataTransfer.files); }}
                      >
                        <Upload className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 mx-auto mb-1 transition-colors" />
                        <p className="text-[10px] font-semibold text-zinc-400 group-hover:text-indigo-300 transition-colors">Drop videos or click to upload</p>
                        <p className="text-[9px] text-zinc-600 mt-0.5">Multiple files supported</p>
                      </div>
                      {mediaLibrary.length > 0 && (
                        <input type="text" placeholder="Search clips..." value={mediaSearch} onChange={e => setMediaSearch(e.target.value)}
                          className="mt-2 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {mediaLibrary.length === 0 ? (
                        <div className="text-center py-10">
                          <Layers className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500">No clips yet</p>
                          <p className="text-[10px] text-zinc-600 mt-1">Upload videos above to build your library</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {mediaLibrary.filter(item => item.name.toLowerCase().includes(mediaSearch.toLowerCase())).map(item => (
                            <div key={item.id} className="group flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-indigo-500/60 rounded-lg p-2 transition-colors cursor-grab active:cursor-grabbing"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify({ 
                                  type: "timeline_clip_drop", 
                                  payload: {
                                    name: item.name.replace(/\.[^.]+$/, ""),
                                    url: item.url,
                                    fileDuration: item.duration,
                                    duration: item.duration,
                                    trimStart: 0,
                                    trimEnd: item.duration
                                  } 
                                }));
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                            >
                              <div className="w-16 h-10 rounded-md bg-zinc-900 overflow-hidden shrink-0 relative border border-zinc-700 group/vid"
                                onMouseEnter={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.currentTime = 0; v.play().catch(()=>{}); } }}
                                onMouseLeave={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = 0; } }}>
                                <video src={item.url} muted loop className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-0 group-hover/vid:opacity-100 transition-opacity" />
                                {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover/vid:opacity-0 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center group-hover/vid:opacity-0"><Film className="w-4 h-4 text-zinc-600" /></div>}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity z-10 pointer-events-none"><Play className="w-4 h-4 text-white" /></div>
                                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded z-20 pointer-events-none">{Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, "0")}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-zinc-300 truncate" title={item.name}>{item.name.replace(/\.[^.]+$/, "")}</p>
                                <p className="text-[9px] text-zinc-500">{(item.size / 1024 / 1024).toFixed(1)} MB</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => addMediaToTimeline(item)} className="w-6 h-6 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors" title="Add to Timeline"><Plus className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setMediaLibrary(prev => prev.filter(m => m.id !== item.id))} className="w-6 h-6 rounded-md bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Remove"><X className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {mediaLibrary.length > 0 && (
                      <div className="px-4 py-2 border-t border-zinc-800 shrink-0">
                        <p className="text-[9px] text-zinc-500 text-center">{mediaLibrary.length} clip{mediaLibrary.length !== 1 ? "s" : ""} &bull; click <strong>+</strong> to add</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: Clips ── */}
                {mediaTab === "clips" && (
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
                    <div className="space-y-2 pb-3 border-b border-zinc-800">
                      <button 
                        onClick={() => {
                          const sourceUrl = originalVideoUrl || videoUrl;
                          if (!sourceUrl) return showToast("No main video attached", "error");
                          const newClip = { id: crypto.randomUUID(), name: "Main Video", url: sourceUrl };
                          const updated = [...customClips, newClip];
                          setCustomClips(updated);
                          localStorage.setItem("custom_video_clips", JSON.stringify(updated));
                          showToast("Saved main video to clips", "success");
                        }} 
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Save Attached Video
                      </button>
                      <button 
                        onClick={() => {
                          if (!selectedClipId) return showToast("Select a clip on the timeline first", "error");
                          const clip = clips.find(c => c.id === selectedClipId);
                          if (!clip) return;
                          const newClip = { id: crypto.randomUUID(), name: "Trimmed Clip", url: clip.url, trimStart: clip.trimStart, trimEnd: clip.trimEnd };
                          const updated = [...customClips, newClip];
                          setCustomClips(updated);
                          localStorage.setItem("custom_video_clips", JSON.stringify(updated));
                          showToast("Saved trimmed clip", "success");
                        }}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Save Selected Clip
                      </button>
                    </div>
                    <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase flex-1">My Saved Clips</p>
                        {customClips.length > 0 && (
                          <input type="text" placeholder="Search..." value={clipSearch} onChange={e => setClipSearch(e.target.value)}
                            className="w-24 bg-zinc-800 text-zinc-200 text-[10px] rounded px-2 py-1 border border-zinc-700 focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4">
                        {(() => {
                          const filteredClips = customClips.filter(c => {
                            const s = clipSearch.toLowerCase();
                            return (c.name || "").toLowerCase().includes(s) || (c.description || "").toLowerCase().includes(s);
                          });
                          if (filteredClips.length === 0) {
                            return (
                              <p className="text-[10px] text-zinc-500 italic text-center py-6 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">
                                {customClips.length === 0 ? "No saved clips yet. Save a clip above!" : "No clips match your search."}
                              </p>
                            );
                          }
                          return filteredClips.map(clip => (
                            <div key={clip.id} className="relative group bg-zinc-800/50 hover:bg-zinc-800 rounded-lg p-2 border border-transparent hover:border-indigo-500/50 transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify({ 
                                  type: "timeline_clip_drop", 
                                  payload: {
                                    name: clip.name || "Custom Clip",
                                    url: clip.url,
                                    fileDuration: clip.trimEnd || 5,
                                    duration: clip.trimEnd ? clip.trimEnd - (clip.trimStart || 0) : 5,
                                    trimStart: clip.trimStart || 0,
                                    trimEnd: clip.trimEnd || 5
                                  } 
                                }));
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                            >
                              <div className="w-16 h-10 rounded-md bg-zinc-900 overflow-hidden shrink-0 relative border border-zinc-700 group/vid"
                                onMouseEnter={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.currentTime = clip.trimStart || 0; v.play().catch(()=>{}); } }}
                                onMouseLeave={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = clip.trimStart || 0; } }}>
                                <video src={`${clip.url}#t=${clip.trimStart || 0}`} muted loop className="w-full h-full object-cover pointer-events-none" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity"><Play className="w-4 h-4 text-white" /></div>
                                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">{clip.trimEnd && clip.trimStart !== undefined ? (clip.trimEnd - clip.trimStart).toFixed(1) + 's' : ''}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingCustomClipId === clip.id ? (
                                  <input autoFocus value={editingCustomClipName} onChange={e => setEditingCustomClipName(e.target.value)}
                                    onBlur={() => { const updated = customClips.map(c => c.id === clip.id ? { ...c, name: editingCustomClipName || "Untitled" } : c); setCustomClips(updated); localStorage.setItem("custom_video_clips", JSON.stringify(updated)); setEditingCustomClipId(null); }}
                                    onKeyDown={e => { if (e.key === "Enter") { const updated = customClips.map(c => c.id === clip.id ? { ...c, name: editingCustomClipName || "Untitled" } : c); setCustomClips(updated); localStorage.setItem("custom_video_clips", JSON.stringify(updated)); setEditingCustomClipId(null); } }}
                                    className="w-full bg-zinc-900 text-white text-xs px-1 py-0.5 rounded outline-none border border-indigo-500" />
                                ) : (
                                  <p onDoubleClick={() => { setEditingCustomClipId(clip.id); setEditingCustomClipName(clip.name); }} className="text-xs font-medium text-zinc-300 truncate cursor-text" title="Double click to rename">{clip.name}</p>
                                )}
                                <p className="text-[9px] text-zinc-500 truncate">{clip.trimStart !== undefined ? `Trimmed (${clip.trimStart}s - ${clip.trimEnd}s)` : 'Full Video'}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { const duration = clip.trimEnd ? clip.trimEnd - (clip.trimStart || 0) : 5; const newClipObj: VideoClip = { id: crypto.randomUUID(), type: "video", name: clip.name || "Custom Clip", url: clip.url, startTime: globalTime, fileDuration: clip.trimEnd || 5, duration, trimStart: clip.trimStart || 0, trimEnd: clip.trimEnd || 5, trackId: videoTracks[0]?.id || "v1", color: `hsl(${Math.floor(Math.random()*360)}, 70%, 55%)`, x: 0, y: 0, videoZoom: 1, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0, enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.3, playbackRate: 1, volume: 1, opacity: 1 }; setClips(prev => [...prev, newClipObj]); setSelectedClipId(newClipObj.id); showToast("Clip added to timeline", "success"); }} className="w-6 h-6 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded flex items-center justify-center transition-colors" title="Add to Timeline"><Plus className="w-3 h-3" /></button>
                                <button onClick={e => handleEditClipDetails(e, clip.id)} className="w-6 h-6 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded flex items-center justify-center transition-colors" title="Edit Details"><PenTool className="w-3 h-3" /></button>
                                <button onClick={() => { const updated = customClips.filter(c => c.id !== clip.id); setCustomClips(updated); localStorage.setItem("custom_video_clips", JSON.stringify(updated)); }} className="w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded flex items-center justify-center transition-colors" title="Delete"><X className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: Audio ── */}
                {mediaTab === "audio" && (
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
                    <div className="flex items-center justify-between shrink-0">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Audio</p>
                      <button onClick={() => audioInputRef.current?.click()} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors flex items-center gap-1 shadow-lg shadow-indigo-500/20">
                        <Plus className="w-3 h-3" /> Upload
                      </button>
                    </div>
                    {audioUrl ? (
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 shrink-0">
                        <p className="text-xs text-emerald-400 font-medium mb-2">✓ Active Audio</p>
                        <audio src={audioUrl} controls className="w-full h-8" />
                        <button onClick={() => setAudioUrl(null)} className="mt-2 text-xs text-zinc-500 hover:text-red-400 transition-colors">Remove audio</button>
                      </div>
                    ) : null}
                    <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase flex-1">My Audio Library</p>
                        <input type="text" placeholder="Search..." value={audioSearch} onChange={e => setAudioSearch(e.target.value)}
                          className="w-24 bg-zinc-800 text-zinc-200 text-[10px] rounded px-2 py-1 border border-zinc-700 focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500" />
                      </div>
                      {(() => {
                        const combined = [...DEFAULT_AUDIOS, ...customAudios].filter(a => {
                          const searchLower = audioSearch.toLowerCase();
                          return (a.name || "Untitled").toLowerCase().includes(searchLower) || (a.artist || "").toLowerCase().includes(searchLower) || (a.genre || "").toLowerCase().includes(searchLower) || (a.description || "").toLowerCase().includes(searchLower);
                        });
                        return (
                          <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4">
                            {combined.length === 0 ? (
                              <p className="text-[10px] text-zinc-500 italic text-center py-6 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">No audio matches your search.</p>
                            ) : (
                              combined.map(audio => (
                                <div key={audio.id} className="relative group bg-zinc-800/50 hover:bg-zinc-800 rounded-lg p-2 border border-transparent hover:border-indigo-500/50 transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("application/json", JSON.stringify({ 
                                      type: "audio_clip_drop", 
                                      payload: { url: audio.url } 
                                    }));
                                    e.dataTransfer.effectAllowed = "copy";
                                  }}
                                >
                                  <button onClick={() => togglePreviewAudio(audio.id.toString(), audio.url)} className={`w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors text-white ${previewAudioId === audio.id.toString() ? 'bg-indigo-600' : 'bg-zinc-700 hover:bg-indigo-500'}`} title={previewAudioId === audio.id.toString() ? "Stop Preview" : "Preview Audio"}>
                                    {previewAudioId === audio.id.toString() ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-300 truncate">{audio.name || "Untitled Audio"}</p>
                                    <p className="text-[9px] text-zinc-500 truncate">{audio.artist ? `by ${audio.artist}` : 'Preview or add to track'}</p>
                                  </div>
                                  <button onClick={() => { setAudioUrl(audio.url); showToast("Audio added to track", "success"); }} className="w-7 h-7 rounded bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center shrink-0 transition-colors opacity-0 group-hover:opacity-100" title="Add to Track"><Plus className="w-4 h-4" /></button>
                                  {!audio.id.toString().startsWith("default-") && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={e => handleEditAudioDetails(e, audio.id)} className="w-6 h-6 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded flex items-center justify-center transition-colors" title="Edit Details"><PenTool className="w-3 h-3" /></button>
                                      <button onClick={e => handleRemoveCustomAudio(e, audio.id)} className="w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded flex items-center justify-center transition-colors" title="Delete"><X className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="pt-3 border-t border-zinc-800 shrink-0">
                      <button onClick={generateMockVoiceover} className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-sm font-medium rounded-lg transition-colors">✨ Generate AI Voiceover</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {leftPanel === "text" && (
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Text</p>
                <div className="flex gap-2">
                  <button onClick={handleAddText} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">+ Add Text</button>
                  <button onClick={handleAddTicker} className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors" title="Add scrolling news ticker">+ Add Ticker</button>
                </div>
                <div className="space-y-2 border-t border-zinc-800 pt-2">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase">Pro Typography</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRO_TEXT_STYLES.map(preset => (
                      <button key={preset.id} onClick={() => handleAddProText(preset)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-[10px] font-medium text-white transition-colors border border-transparent hover:border-indigo-500 text-center truncate" title={preset.name}>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-t border-zinc-800 pt-2">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase">Style</p>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">Font</label>
                    <select value={textFont} onChange={e => { setTextFont(e.target.value); (selectedObj as any)?.set?.({ fontFamily: e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-full bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">Size</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={12} max={120} step={2} value={textSize} onChange={e => { setTextSize(+e.target.value); (selectedObj as any)?.set?.({ fontSize: +e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="flex-1 accent-indigo-500 h-1" />
                      <span className="text-[10px] text-zinc-500 w-6">{textSize}px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={textColor} onChange={e => { setTextColor(e.target.value); (selectedObj as any)?.set?.({ fill: e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0" />
                      <span className="text-[10px] text-zinc-400 font-mono">{textColor}</span>
                    </div>
                    {/* Quick color palette */}
                    <div className="flex gap-1 flex-wrap mt-1">
                      {["#ffffff","#000000","#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899"].map(c => (
                        <button key={c} onClick={() => { setTextColor(c); (selectedObj as any)?.set?.({ fill: c }); fabricCanvasRef.current?.renderAll(); }} className="w-5 h-5 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: textColor === c ? "#818cf8" : "transparent" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {leftPanel === "logo" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Logo & Image</p>
                <input type="file" accept="image/*" onChange={handleCustomLogoUpload} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center cursor-pointer">+ Upload Logo</label>
                
                <div className="space-y-3 border-t border-zinc-800 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">My Logos</p>
                  </div>
                  {customLogos.length > 0 && (
                    <input type="text" placeholder="Search logos..." value={logoSearch} onChange={e => setLogoSearch(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white text-[10px] rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500" />
                  )}
                  {customLogos.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic">No custom logos saved yet. Upload one above!</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {customLogos.filter(l => (l.name || "Untitled").toLowerCase().includes(logoSearch.toLowerCase())).map(logo => (
                        <div key={logo.id} className="relative group flex flex-col gap-1">
                          <button onClick={() => handleAddDefaultLogo(logo.url)} className="w-full p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center gap-1.5 transition-colors border border-transparent hover:border-indigo-500 h-14 justify-center">
                            <img src={logo.url} alt={logo.name || "Custom Logo"} className="max-w-full max-h-full object-contain" />
                          </button>
                          <span className="text-[9px] text-zinc-400 text-center truncate px-1" title={logo.name || "Untitled"}>{logo.name || "Untitled"}</span>
                          <div className="absolute -top-1.5 -right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleRemoveCustomLogo(e, logo.id)} className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg" title="Delete">
                              <X className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => handleRenameCustomLogo(e, logo.id)} className="w-5 h-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg" title="Rename">
                              <PenTool className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {customLogos.filter(l => (l.name || "Untitled").toLowerCase().includes(logoSearch.toLowerCase())).length === 0 && (
                        <p className="text-[10px] text-zinc-500 italic col-span-3 text-center py-2">No logos match your search.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-zinc-800 pt-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase">Default Badges</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "Verified", url: "https://cdn-icons-png.flaticon.com/512/1160/1160358.png" },
                      { name: "Sale", url: "https://cdn-icons-png.flaticon.com/512/3712/3712203.png" },
                      { name: "New", url: "https://cdn-icons-png.flaticon.com/512/4015/4015094.png" },
                      { name: "Hot", url: "https://cdn-icons-png.flaticon.com/512/744/744502.png" },
                      { name: "Cursor", url: "https://cdn-icons-png.flaticon.com/512/1043/1043431.png" },
                      { name: "Target", url: "https://cdn-icons-png.flaticon.com/512/1409/1409014.png" },
                      { name: "Rating", url: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png" },
                      { name: "Trophy", url: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png" },
                      { name: "Megaphone", url: "https://cdn-icons-png.flaticon.com/512/1997/1997928.png" },
                    ].map(badge => (
                      <button key={badge.name} onClick={() => handleAddDefaultLogo(badge.url)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center gap-1.5 transition-colors border border-transparent hover:border-indigo-500" title={badge.name}>
                        <img src={badge.url} alt={badge.name} className="w-6 h-6 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-zinc-800 pt-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase">Social Media</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "Instagram", url: "https://cdn-icons-png.flaticon.com/512/174/174855.png" },
                      { name: "TikTok", url: "https://cdn-icons-png.flaticon.com/512/3046/3046121.png" },
                      { name: "YouTube", url: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" },
                      { name: "X", url: "https://cdn-icons-png.flaticon.com/512/5969/5969020.png" },
                      { name: "LinkedIn", url: "https://cdn-icons-png.flaticon.com/512/174/174857.png" },
                      { name: "Facebook", url: "https://cdn-icons-png.flaticon.com/512/174/174848.png" },
                      { name: "WhatsApp", url: "https://cdn-icons-png.flaticon.com/512/733/733585.png" },
                      { name: "Subscribe", url: "https://cdn-icons-png.flaticon.com/512/3046/3046127.png" },
                    ].map(social => (
                      <button key={social.name} onClick={() => handleAddDefaultLogo(social.url)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors border border-transparent hover:border-indigo-500" title={social.name}>
                        <img src={social.url} alt={social.name} className="w-5 h-5 object-contain" />
                      </button>
                    ))}
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



            {leftPanel === "draw" && (
              <div className="p-4 space-y-5 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Draw Tool</p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Mode</label>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEraser(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${!isEraser ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                      Brush
                    </button>
                    <button onClick={() => setIsEraser(true)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${isEraser ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                      <Eraser className="w-3 h-3" /> Eraser
                    </button>
                  </div>
                </div>

                {!isEraser && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Brush Color</label>
                    <div className="flex flex-wrap gap-2">
                      {["#ffffff", "#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"].map(c => (
                        <button key={c} onClick={() => setBrushColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${brushColor === c ? "scale-110 border-white shadow-lg" : "border-transparent hover:scale-110"}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Size: {brushSize}px</label>
                  <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                </div>
              </div>
            )}

            {leftPanel === "shapes" && (
              <div className="p-4 space-y-5 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shapes</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAddShape("rect")} className="aspect-square bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <Square className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Rectangle</span>
                  </button>
                  <button onClick={() => handleAddShape("circle")} className="aspect-square bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <Circle className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Circle</span>
                  </button>
                  <button onClick={() => handleAddShape("triangle")} className="aspect-square bg-zinc-800 hover:bg-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <Triangle className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Triangle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Default Fill</label>
                  <div className="flex flex-wrap gap-2">
                    {["transparent", "#ffffff", "#000000", "#ef4444", "#3b82f6", "#22c55e"].map(c => (
                      <button key={c} onClick={() => ShapeColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform relative ${shapeColor === c ? "scale-110 border-indigo-400 shadow-lg" : "border-zinc-700 hover:scale-110"}`} style={{ backgroundColor: c === "transparent" ? "#27272a" : c }}>
                        {c === "transparent" && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[2px] bg-red-500 rotate-45" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CENTER - PREVIEW */}
        <div className={`flex-1 flex flex-col relative min-w-0 min-h-0 ${isLightTheme ? 'bg-zinc-100' : 'bg-zinc-950'}`}>
          
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden" style={isLightTheme ? { backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 0)', backgroundSize: '16px 16px' } : { backgroundImage: 'radial-gradient(#27272a 1px, transparent 0)', backgroundSize: '16px 16px' }}>
            <div 
              ref={canvasContainerRef}
              className={`relative shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300 min-w-0 min-h-0 ${isLightTheme ? 'bg-white ring-1 ring-zinc-300' : 'bg-black ring-1 ring-zinc-700'}`}
              style={{ width: aspectRatio.w, height: aspectRatio.h, maxWidth: '100%', maxHeight: 'calc(100% - 16px)' }}
            >
              {clips.length > 0 ? (
                <>
                  {[...activeClips].sort((a, b) => {
                      const aIdx = videoTracks.findIndex(t => t.id === a.trackId);
                      const bIdx = videoTracks.findIndex(t => t.id === b.trackId);
                      return aIdx - bIdx;
                    }).map((clip, i) => {
                    let baseOpacity = clip.opacity !== undefined ? clip.opacity : 1;
                    let previewOpacity = baseOpacity;
                    const localTime = globalTime - clip.startTime;
                    if (clip.fadeInDuration && localTime < clip.fadeInDuration) {
                       previewOpacity = baseOpacity * (localTime / clip.fadeInDuration);
                    } else if (clip.fadeOutDuration && localTime > clip.duration - clip.fadeOutDuration) {
                       previewOpacity = baseOpacity * ((clip.duration - localTime) / clip.fadeOutDuration);
                    }

                    const hasFilter = clip.brightness !== 0 || clip.contrast !== 1 || clip.saturate !== 1 || clip.sepia !== 0 || clip.hueRotate !== 0;
                    const filterStr = hasFilter ? `brightness(${1 + clip.brightness}) contrast(${clip.contrast}) saturate(${clip.saturate}) sepia(${clip.sepia}) hue-rotate(${clip.hueRotate}deg)` : undefined;
                    
                    let animScale = 1;
                    let animRotate = 0;
                    let animX = 0;
                    let animY = 0;

                    if (clip.animationType && clip.animationType !== "none") {
                      const speed = clip.animationSpeed || 1.0;
                      const intensity = clip.animationIntensity || 1.0;
                      
                      switch(clip.animationType) {
                        case "pulse":
                          animScale = 1 + Math.sin(localTime * Math.PI * 2 * speed) * 0.1 * intensity;
                          break;
                        case "wiggle":
                          animRotate = Math.sin(localTime * Math.PI * 2 * speed) * 15 * intensity;
                          break;
                        case "float":
                          animY = Math.sin(localTime * Math.PI * 2 * speed) * 10 * intensity;
                          break;
                        case "spin":
                        case "spin-cw":
                          animRotate = localTime * 360 * speed;
                          break;
                        case "spin-ccw":
                          animRotate = -localTime * 360 * speed;
                          break;
                        case "blink":
                          previewOpacity *= (Math.floor(localTime * 4 * speed) % 2 === 0) ? Math.max(0, 1 - 0.5 * intensity) : 1;
                          break;
                        case "slide-in-left":
                          if (localTime < 1 / speed) animX = -100 + (localTime * speed * 100);
                          break;
                        case "slide-in-right":
                          if (localTime < 1 / speed) animX = 100 - (localTime * speed * 100);
                          break;
                        case "slide-in-bottom":
                          if (localTime < 1 / speed) animY = 100 - (localTime * speed * 100);
                          break;
                        case "slide-in-top":
                          if (localTime < 1 / speed) animY = -100 + (localTime * speed * 100);
                          break;
                      }
                    }

                    const hasTransform = clip.x !== 0 || clip.y !== 0 || clip.videoZoom !== 1 || animScale !== 1 || animRotate !== 0 || animX !== 0 || animY !== 0;
                    const transformStr = hasTransform 
                      ? `translate(${clip.x + animX}%, ${clip.y + animY}%) scale(${clip.videoZoom * animScale}) rotate(${animRotate}deg)` 
                      : undefined;

                    if (clip.type === "ticker") {
                      // Calculate scroll offset based on time and speed
                      const isLooping = clip.tickerLoop ?? true;
                      
                      const lines1 = (clip.tickerText || "").split("\n");
                      const fontSize1 = clip.tickerFontSize || 32;
                      const h1Px = lines1.length * fontSize1 * 1.2;
                      
                      let lines2: string[] = [];
                      let fontSize2 = clip.tickerFontSize2 || 24;
                      let h2Px = 0;
                      
                      if (clip.enableSecondaryTicker) {
                        lines2 = (clip.tickerText2 || "").split("\n");
                        h2Px = lines2.length * fontSize2 * 1.2;
                      }

                      const paddingPx = Math.max(fontSize1, fontSize2) * 0.8;
                      const calculatedHeightPx = h1Px + h2Px + paddingPx;
                      
                      const heightPct = (calculatedHeightPx / aspectRatio.h) * 100;
                      const paddingPct = (paddingPx / aspectRatio.h) * 100;
                      const h1Pct = (h1Px / aspectRatio.h) * 100;
                      const h2Pct = (h2Px / aspectRatio.h) * 100;
                      
                      const topPct = clip.y !== undefined ? clip.y : 90;
                      const y1Pct = clip.enableSecondaryTicker ? (topPct + paddingPct / 2 + h1Pct / 2) : (topPct + heightPct / 2);
                      const y2Pct = topPct + paddingPct / 2 + h1Pct + h2Pct / 2;

                      let scrollOffset1 = localTime * (clip.tickerSpeed || 150);
                      const estimatedTextWidth1 = (clip.tickerText?.length || 0) * fontSize1 * 0.7;
                      const totalScrollDistance1 = aspectRatio.w + estimatedTextWidth1;
                      if (isLooping && totalScrollDistance1 > 0) scrollOffset1 = scrollOffset1 % totalScrollDistance1;

                      let scrollOffset2 = localTime * (clip.tickerSpeed2 || 100);
                      const estimatedTextWidth2 = (clip.tickerText2?.length || 0) * fontSize2 * 0.7;
                      const totalScrollDistance2 = aspectRatio.w + estimatedTextWidth2;
                      if (isLooping && totalScrollDistance2 > 0) scrollOffset2 = scrollOffset2 % totalScrollDistance2;

                      return (
                        <svg
                          key={clip.id}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ zIndex: clip.isForeground ? 20 + i : i, opacity: previewOpacity }}
                          viewBox={`0 0 ${aspectRatio.w} ${aspectRatio.h}`}
                        >
                          <rect x="0" y={`${topPct}%`} width="100%" height={`${heightPct}%`} fill={clip.tickerBgColor || "#cc0000"} />
                          
                          <text
                            x={aspectRatio.w - scrollOffset1}
                            y={`${y1Pct}%`}
                            dominantBaseline="middle"
                            fill={clip.tickerTextColor || "#ffffff"}
                            fontSize={`${fontSize1}px`}
                            fontFamily={clip.tickerFontFamily || 'Arial'}
                            fontWeight="bold"
                          >
                            {lines1.map((line, idx, arr) => (
                              <tspan key={idx} x={aspectRatio.w - scrollOffset1} dy={idx === 0 ? `-${(arr.length - 1) * 0.6}em` : '1.2em'}>{line}</tspan>
                            ))}
                          </text>

                          {clip.enableSecondaryTicker && (
                            <text
                              x={aspectRatio.w - scrollOffset2}
                              y={`${y2Pct}%`}
                              dominantBaseline="middle"
                              fill={clip.tickerTextColor2 || "#ffffff"}
                              fontSize={`${fontSize2}px`}
                              fontFamily={clip.tickerFontFamily2 || 'Arial'}
                              fontWeight="bold"
                            >
                              {lines2.map((line, idx, arr) => (
                                <tspan key={idx} x={aspectRatio.w - scrollOffset2} dy={idx === 0 ? `-${(arr.length - 1) * 0.6}em` : '1.2em'}>{line}</tspan>
                              ))}
                            </text>
                          )}
                        </svg>
                      );
                    }

                    if (clip.type === "image") {
                      return (
                        <img
                          key={clip.id}
                          ref={(el) => { if (el) videoRefs.current[clip.id] = el; else delete videoRefs.current[clip.id]; }}
                          src={clip.url}
                          className="absolute w-full h-full object-contain transition-transform pointer-events-none"
                          style={{ 
                            zIndex: clip.isForeground ? 20 + i : i,
                            filter: filterStr,
                            transform: transformStr,
                            opacity: previewOpacity,
                            mixBlendMode: clip.opacity !== undefined && clip.opacity < 1 ? (isLightTheme ? "multiply" : "screen") : "normal"
                          }}
                          crossOrigin="anonymous"
                        />
                      );
                    }

                    return (
                      <video
                        key={clip.id}
                        ref={(el) => { if (el) videoRefs.current[clip.id] = el; else delete videoRefs.current[clip.id]; }}
                        src={clip.url}
                        className="absolute w-full h-full object-contain transition-transform pointer-events-none"
                        style={{ 
                          zIndex: clip.isForeground ? 20 + i : i,
                          filter: filterStr,
                          transform: transformStr,
                          opacity: previewOpacity,
                          mixBlendMode: clip.opacity !== undefined && clip.opacity < 1 ? (isLightTheme ? "multiply" : "screen") : "normal"
                        }}
                        crossOrigin="anonymous"
                        playsInline
                        muted
                      />
                    );
                  })}
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      className="hidden"
                      crossOrigin="anonymous"
                    />
                  )}
                </>
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
                <canvas id="fabric-canvas" />
              </div>

              {/* Floating Crop Button */}
              {selectedObj && selectedObj.type === "image" && !selectedObj.id?.toString().startsWith('video-') && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                  <button onClick={() => {
                    setCropTargetObj(selectedObj as fabric.Image);
                    setCropImageUrl((selectedObj as fabric.Image).getSrc());
                    setIsCropModalOpen(true);
                  }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-xl flex items-center gap-2 transition-all hover:scale-105 border border-indigo-400/30">
                    <CropIcon className="w-4 h-4" />
                    Crop Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Crop Modal */}
          {isCropModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh]">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><CropIcon className="w-4 h-4 text-indigo-400" /> Crop Image</h3>
                  <button onClick={() => setIsCropModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                  >
                    <img 
                      ref={imgRef} 
                      src={cropImageUrl} 
                      alt="Crop target" 
                      className="max-h-[60vh] object-contain"
                      crossOrigin="anonymous" 
                    />
                  </ReactCrop>
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-4">
                  <p className="text-xs text-zinc-500 mr-auto flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4" /> Click and drag on the image to draw a crop box. You can resize the box using its corners.
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsCropModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={handleApplyCrop} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Apply Crop</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drafts Modal */}
          {showDraftsModal && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full max-w-lg" style={{maxHeight: "80vh"}}>
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" /> My Drafts
                  </h3>
                  <button onClick={() => setShowDraftsModal(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Save new draft row */}
                <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-950/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-2">Save Current Project as Draft</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftNameInput}
                      onChange={e => setDraftNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveDraft(); }}
                      placeholder={`e.g., My Promo Video v${drafts.length + 1}`}
                      className="flex-1 bg-black border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                    />
                    <button
                      onClick={() => saveDraft()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>

                {/* Draft list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {drafts.length === 0 ? (
                    <div className="text-center py-12">
                      <Film className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500 font-medium">No drafts yet</p>
                      <p className="text-[11px] text-zinc-600 mt-1">Save your first draft above to resume editing later.</p>
                    </div>
                  ) : (
                    drafts.map(draft => (
                      <div key={draft.id} className="group flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-indigo-500/50 rounded-lg p-3 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{draft.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {draft.clips?.length || 0} clip{(draft.clips?.length || 0) !== 1 ? "s" : ""} &bull; Saved {new Date(draft.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                            title="Load this draft"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="w-7 h-7 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clip Details Modal */}
          {editingClipDetailsId && (

            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full max-w-md">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Film className="w-4 h-4 text-indigo-400" /> Clip Details</h3>
                  <button onClick={() => setEditingClipDetailsId(null)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Clip Name</label>
                    <input type="text" value={editingClipDetails.name} onChange={e => setEditingClipDetails({...editingClipDetails, name: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Main Intro" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description & Tags</label>
                    <textarea value={editingClipDetails.description} onChange={e => setEditingClipDetails({...editingClipDetails, description: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none" placeholder="Add some notes, tags, or description about this clip..." />
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-3">
                  <button onClick={() => setEditingClipDetailsId(null)} className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button onClick={handleSaveClipDetails} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Save Details</button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Details Modal */}
          {editingAudioId && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col w-full max-w-md">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Music className="w-4 h-4 text-indigo-400" /> Audio Details</h3>
                  <button onClick={() => setEditingAudioId(null)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Track Name</label>
                    <input type="text" value={editingAudioDetails.name} onChange={e => setEditingAudioDetails({...editingAudioDetails, name: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Summer Vibes" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Artist</label>
                    <input type="text" value={editingAudioDetails.artist} onChange={e => setEditingAudioDetails({...editingAudioDetails, artist: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Genre</label>
                    <input type="text" value={editingAudioDetails.genre} onChange={e => setEditingAudioDetails({...editingAudioDetails, genre: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g., Electronic" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                    <textarea value={editingAudioDetails.description} onChange={e => setEditingAudioDetails({...editingAudioDetails, description: e.target.value})} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none" placeholder="Add some notes about this track..." />
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-3">
                  <button onClick={() => setEditingAudioId(null)} className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button onClick={handleSaveAudioDetails} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">Save Details</button>
                </div>
              </div>
            </div>
          )}
          
          {/* PLAYER CONTROLS */}
          <div className="h-14 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 gap-4">
            {/* Left: Skip + Play/Pause */}
            <div className="flex items-center gap-3">
              <button className="text-zinc-400 hover:text-white transition-colors" onClick={() => { setGlobalTime(0); setIsPlaying(false); }}>
                <SkipBack className="w-4 h-4" />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors" onClick={() => { setGlobalTime(Math.max(0, globalTime - 5)); }}>
                <Rewind className="w-4 h-4" />
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2.5 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors" onClick={() => { setGlobalTime(Math.min(totalDuration, globalTime + 5)); }}>
                <FastForward className="w-4 h-4" />
              </button>
              <div className="text-xs font-mono text-zinc-400 w-28">
                {new Date(globalTime * 1000).toISOString().substring(14, 22)} / {new Date(totalDuration * 1000).toISOString().substring(14, 22)}
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
              <input type="range" min={0} max={1} step={0.05} value={masterVolume} onChange={e => {
                setMasterVolume(+e.target.value);
              }} className="w-20 accent-indigo-500" />
            </div>
          </div>

          {/* TRIM PANEL */}
          {showTrimPanel && selectedClip && (
            <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center gap-6">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trim</p>
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs text-zinc-400 w-14">Start: <span className="text-indigo-400 font-mono">{(selectedClip.trimStart || 0).toFixed(1)}s</span></label>
                <input type="range" min={0} max={(selectedClip.duration) - 0.5} step={0.1} value={selectedClip.trimStart || 0} onChange={e => { const v = +e.target.value; updateSelectedClip({ trimStart: v }); setGlobalTime(selectedClip.startTime); }} className="flex-1 accent-indigo-500" />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs text-zinc-400 w-14">End: <span className="text-pink-400 font-mono">{(selectedClip.trimEnd || selectedClip.fileDuration).toFixed(1)}s</span></label>
                <input type="range" min={0.5} max={selectedClip.fileDuration} step={0.1} value={selectedClip.trimEnd || selectedClip.fileDuration} onChange={e => { const v = +e.target.value; updateSelectedClip({ trimEnd: v }); setGlobalTime(selectedClip.startTime + selectedClip.duration); }} className="flex-1 accent-pink-500" />
              </div>
              <button onClick={() => { updateSelectedClip({ trimStart: 0, trimEnd: selectedClip.fileDuration }); showToast("Trim reset", "info"); }} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Reset</button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - PROPERTIES */}
        <div className="w-56 bg-zinc-900 border-l border-zinc-800 p-3 overflow-y-auto hidden xl:block z-10 custom-scrollbar">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            {activeTab === "adjust" ? "Color Adjustments" : "Properties"}
          </h3>
          
          <div className="space-y-4">
            { ((selectedObj && (selectedObj as any).id !== 'video-proxy') || selectedAssetId) ? (() => {
              const activeFabricObj = selectedObj && (selectedObj as any).id !== 'video-proxy' ? selectedObj : (selectedAssetId ? canvasAssets.find(a => a.id === selectedAssetId)?.obj : null);
              if (!activeFabricObj) return null;
              const isText = activeFabricObj.type === 'i-text' || activeFabricObj.type === 'textbox';
              const isShape = activeFabricObj.type === 'rect' || activeFabricObj.type === 'circle' || activeFabricObj.type === 'triangle' || activeFabricObj.type === 'path';
              
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Style Properties</p>
                    <button 
                      onClick={() => {
                        fabricCanvasRef.current?.remove(activeFabricObj);
                        const matchingAsset = canvasAssets.find(a => a.obj === activeFabricObj);
                        if (matchingAsset) {
                          setCanvasAssets(prev => prev.filter(a => a.id !== matchingAsset.id));
                          setSelectedAssetId(null);
                        }
                        setSelectedObj(null);
                        fabricCanvasRef.current?.renderAll();
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isText && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Font Family</label>
                        <select value={(activeFabricObj as any).fontFamily || textFont} onChange={e => { setTextFont(e.target.value); (activeFabricObj as any).set({ fontFamily: e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none">
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      
                      {/* Formatting Toggles */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { 
                            const isBold = (activeFabricObj as any).fontWeight === 'bold'; 
                            (activeFabricObj as any).set({ fontWeight: isBold ? 'normal' : 'bold' }); 
                            fabricCanvasRef.current?.renderAll(); 
                            setCanvasAssets([...canvasAssets]);
                          }}
                          className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${(activeFabricObj as any).fontWeight === 'bold' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                          B
                        </button>
                        <button 
                          onClick={() => { 
                            const isItalic = (activeFabricObj as any).fontStyle === 'italic'; 
                            (activeFabricObj as any).set({ fontStyle: isItalic ? 'normal' : 'italic' }); 
                            fabricCanvasRef.current?.renderAll(); 
                            setCanvasAssets([...canvasAssets]);
                          }}
                          className={`flex-1 py-1.5 rounded text-xs italic transition-colors ${(activeFabricObj as any).fontStyle === 'italic' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                          I
                        </button>
                        <button 
                          onClick={() => { 
                            const isUnderline = (activeFabricObj as any).underline; 
                            (activeFabricObj as any).set({ underline: !isUnderline }); 
                            fabricCanvasRef.current?.renderAll(); 
                            setCanvasAssets([...canvasAssets]);
                          }}
                          className={`flex-1 py-1.5 rounded text-xs underline transition-colors ${(activeFabricObj as any).underline ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                          U
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Font Size: {(activeFabricObj as any).fontSize}px</label>
                        <input type="range" min={12} max={120} step={2} value={(activeFabricObj as any).fontSize || textSize} onChange={e => { setTextSize(+e.target.value); (activeFabricObj as any).set({ fontSize: +e.target.value }); fabricCanvasRef.current?.renderAll(); }} className="w-full accent-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Text Color</label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded border border-zinc-700 overflow-hidden shadow-sm shrink-0">
                            <input 
                              type="color" 
                              value={(activeFabricObj as any).fill || "#ffffff"} 
                              onChange={e => {
                                activeFabricObj.set('fill', e.target.value);
                                fabricCanvasRef.current?.renderAll();
                                setCanvasAssets([...canvasAssets]);
                              }}
                              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                            />
                          </div>
                          <span className="text-xs text-zinc-500 font-mono uppercase">{(activeFabricObj as any).fill || "#ffffff"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isShape && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Fill Color</label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded border border-zinc-700 overflow-hidden shadow-sm shrink-0">
                            <input type="color" value={(activeFabricObj.fill as string) || "#transparent"} onChange={e => { activeFabricObj.set('fill', e.target.value); fabricCanvasRef.current?.renderAll(); setCanvasAssets([...canvasAssets]); }} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" />
                          </div>
                          <span className="text-xs text-zinc-500 font-mono uppercase">{(activeFabricObj.fill as string) || "none"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Stroke Color</label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded border border-zinc-700 overflow-hidden shadow-sm shrink-0">
                            <input type="color" value={(activeFabricObj.stroke as string) || "#ffffff"} onChange={e => { activeFabricObj.set('stroke', e.target.value); fabricCanvasRef.current?.renderAll(); setCanvasAssets([...canvasAssets]); }} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" />
                          </div>
                          <span className="text-xs text-zinc-500 font-mono uppercase">{(activeFabricObj.stroke as string) || "none"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Stroke Width: {activeFabricObj.strokeWidth || 0}px</label>
                        <input type="range" min="0" max="50" value={activeFabricObj.strokeWidth || 0} onChange={e => { activeFabricObj.set('strokeWidth', parseInt(e.target.value)); fabricCanvasRef.current?.renderAll(); setCanvasAssets([...canvasAssets]); }} className="w-full accent-indigo-500" />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Layering</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => { 
                          activeFabricObj.bringForward(); 
                          fabricCanvasRef.current?.renderAll(); 
                          refreshAssets(); 
                        }}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Fwd</span>
                      </button>
                      <button 
                        onClick={() => { 
                          activeFabricObj.sendBackwards(); 
                          const proxy = fabricCanvasRef.current?.getObjects().find(o => (o as any).id === 'video-proxy');
                          if (proxy) proxy.sendToBack();
                          fabricCanvasRef.current?.renderAll(); 
                          refreshAssets(); 
                        }}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Back</span>
                      </button>
                      <button 
                        onClick={() => { 
                          activeFabricObj.bringToFront(); 
                          fabricCanvasRef.current?.renderAll(); 
                          refreshAssets(); 
                        }}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Bring to Front"
                      >
                        <ArrowUpToLine className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Front</span>
                      </button>
                      <button 
                        onClick={() => { 
                          activeFabricObj.sendToBack(); 
                          const proxy = fabricCanvasRef.current?.getObjects().find(o => (o as any).id === 'video-proxy');
                          if (proxy) proxy.sendToBack();
                          fabricCanvasRef.current?.renderAll(); 
                          refreshAssets(); 
                        }}
                        className="flex flex-col items-center justify-center py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Send to Back"
                      >
                        <ArrowDownToLine className="w-4 h-4 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Bottom</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Opacity</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" min="0" max="1" step="0.05"
                        value={activeFabricObj.opacity ?? 1}
                        onChange={e => {
                          activeFabricObj.set('opacity', parseFloat(e.target.value));
                          fabricCanvasRef.current?.renderAll();
                          setCanvasAssets([...canvasAssets]);
                        }}
                        className="w-full h-1.5 accent-indigo-500"
                      />
                      <span className="text-xs text-zinc-500 w-8 text-right">{Math.round((activeFabricObj.opacity ?? 1) * 100)}%</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      fabricCanvasRef.current?.centerObject(activeFabricObj);
                      activeFabricObj.setCoords();
                      fabricCanvasRef.current?.renderAll();
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Center on Screen
                  </button>

                  <button 
                    onClick={() => {
                      (activeFabricObj as any).startTime = 0;
                      (activeFabricObj as any).endTime = totalDuration;
                      fabricCanvasRef.current?.renderAll();
                      refreshAssets();
                      showToast("Asset extended to full duration", "success");
                    }}
                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Show for Entire Video
                  </button>

                  {/* FABRIC ANIMATIONS */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Animations</p>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-300">Animation Style</label>
                      <select 
                        value={(activeFabricObj as any).animationType || "none"} 
                        onChange={e => {
                          (activeFabricObj as any).animationType = e.target.value;
                          fabricCanvasRef.current?.renderAll();
                          refreshAssets();
                        }} 
                        className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none"
                      >
                        <option value="none">None</option>
                        <optgroup label="Continuous">
                          <option value="pulse">Pulse (Scale)</option>
                          <option value="wiggle">Wiggle (Rotate)</option>
                          <option value="float">Float (Up/Down)</option>
                          <option value="spin-cw">Spin Clockwise</option>
                          <option value="spin-ccw">Spin Anti-Clockwise</option>
                          <option value="blink">Blink (Flash)</option>
                        </optgroup>
                        <optgroup label="In / Out (Broadcast)">
                          <option value="slide-in-left">Slide In (Left)</option>
                          <option value="slide-in-right">Slide In (Right)</option>
                          <option value="slide-in-bottom">Slide In (Bottom)</option>
                          <option value="slide-in-top">Slide In (Top)</option>
                        </optgroup>
                      </select>
                    </div>
                    {(activeFabricObj as any).animationType && (activeFabricObj as any).animationType !== "none" && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-indigo-500/5 p-3 rounded-md border border-indigo-500/10">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <label className="font-medium text-zinc-300">Speed</label>
                            <span className="text-zinc-500 tabular-nums">{(activeFabricObj as any).animationSpeed || 1.0}x</span>
                          </div>
                          <input 
                            type="range" min={0.1} max={5.0} step={0.1} 
                            value={(activeFabricObj as any).animationSpeed || 1.0} 
                            onChange={(e) => { (activeFabricObj as any).animationSpeed = +e.target.value; fabricCanvasRef.current?.renderAll(); refreshAssets(); }} 
                            className="w-full h-1.5 accent-indigo-500" 
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <label className="font-medium text-zinc-300">Intensity</label>
                            <span className="text-zinc-500 tabular-nums">{(activeFabricObj as any).animationIntensity || 1.0}x</span>
                          </div>
                          <input 
                            type="range" min={0.1} max={5.0} step={0.1} 
                            value={(activeFabricObj as any).animationIntensity || 1.0} 
                            onChange={(e) => { (activeFabricObj as any).animationIntensity = +e.target.value; fabricCanvasRef.current?.renderAll(); refreshAssets(); }} 
                            className="w-full h-1.5 accent-indigo-500" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })() : (leftPanel === "text" && !selectedClip) ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Text Tool Settings</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Font Family</label>
                    <select value={textFont} onChange={e => setTextFont(e.target.value)} className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none">
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  
                  {/* Formatting Toggles */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTextBold(!textBold)} className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${textBold ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>B</button>
                    <button onClick={() => setTextItalic(!textItalic)} className={`flex-1 py-1.5 rounded text-xs italic transition-colors ${textItalic ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>I</button>
                    <button onClick={() => setTextUnderline(!textUnderline)} className={`flex-1 py-1.5 rounded text-xs underline transition-colors ${textUnderline ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>U</button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Font Size</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={12} max={120} step={2} value={textSize} onChange={e => setTextSize(+e.target.value)} className="flex-1 accent-indigo-500" />
                      <span className="text-xs text-zinc-500 w-8 text-right">{textSize}px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Text Color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded border border-zinc-700 overflow-hidden shadow-sm shrink-0">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer" />
                      </div>
                      <span className="text-xs text-zinc-500 font-mono uppercase">{textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedClip && selectedClip.type === "ticker" ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ticker Properties</p>
                  <button 
                    onClick={() => {
                      setClips(prev => prev.filter(c => c.id !== selectedClip.id));
                      setSelectedClipId(null);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Scrolling Text</label>
                  <textarea 
                    value={selectedClip.tickerText || ""} 
                    onChange={e => updateSelectedClip({ tickerText: e.target.value })} 
                    className="w-full h-24 bg-zinc-800 text-zinc-200 text-sm rounded-md p-2 border border-zinc-700 focus:outline-none focus:border-indigo-500 custom-scrollbar"
                    placeholder="Enter breaking news here..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Font Family</label>
                  <select value={selectedClip.tickerFontFamily || "Arial"} onChange={e => updateSelectedClip({ tickerFontFamily: e.target.value })} className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Font Size: {selectedClip.tickerFontSize || 32}px</label>
                  <input type="range" min={12} max={120} step={1} value={selectedClip.tickerFontSize || 32} onChange={e => updateSelectedClip({ tickerFontSize: +e.target.value })} className="w-full accent-indigo-500" />
                </div>



                <div className="space-y-2 border-b border-zinc-800 pb-4">
                  <label className="text-xs font-medium text-zinc-300">Scroll Speed: {selectedClip.tickerSpeed || 150}px/s</label>
                  <input type="range" min={10} max={1000} step={10} value={selectedClip.tickerSpeed || 150} onChange={e => updateSelectedClip({ tickerSpeed: +e.target.value })} className="w-full accent-indigo-500" />
                </div>

                {/* Secondary Ticker Line */}
                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedClip.enableSecondaryTicker || false}
                      onChange={e => updateSelectedClip({ enableSecondaryTicker: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-zinc-200">Enable Secondary Text Line</span>
                  </label>

                  {selectedClip.enableSecondaryTicker && (
                    <div className="space-y-4 pl-4 border-l-2 border-indigo-500/30">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Secondary Text</label>
                        <textarea 
                          value={selectedClip.tickerText2 || ""} 
                          onChange={e => updateSelectedClip({ tickerText2: e.target.value })} 
                          className="w-full h-16 bg-zinc-800 text-zinc-200 text-sm rounded-md p-2 border border-zinc-700 focus:outline-none focus:border-indigo-500 custom-scrollbar"
                          placeholder="Enter details..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Secondary Font</label>
                        <select value={selectedClip.tickerFontFamily2 || "Arial"} onChange={e => updateSelectedClip({ tickerFontFamily2: e.target.value })} className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none">
                          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Secondary Font Size: {selectedClip.tickerFontSize2 || 24}px</label>
                        <input type="range" min={12} max={120} step={1} value={selectedClip.tickerFontSize2 || 24} onChange={e => updateSelectedClip({ tickerFontSize2: +e.target.value })} className="w-full accent-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">Secondary Speed: {selectedClip.tickerSpeed2 || 100}px/s</label>
                        <input type="range" min={10} max={1000} step={10} value={selectedClip.tickerSpeed2 || 100} onChange={e => updateSelectedClip({ tickerSpeed2: +e.target.value })} className="w-full accent-indigo-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Clip Duration</label>
                    <span className="text-xs text-indigo-400 font-mono">{selectedClip.duration}s</span>
                  </div>
                  <input 
                    type="range" min={1} max={300} step={1} 
                    value={selectedClip.duration} 
                    onChange={e => {
                      const newDur = +e.target.value;
                      updateSelectedClip({ 
                        duration: newDur, 
                        trimEnd: newDur, 
                        fileDuration: newDur 
                      });
                    }} 
                    className="w-full accent-indigo-500" 
                  />
                  <p className="text-[10px] text-indigo-400/70 mt-1 leading-tight">
                    Increase this to make the ticker stay on screen longer.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400">Background</label>
                    <div className="relative w-full h-8 rounded border border-zinc-700 overflow-hidden shadow-sm">
                      <input type="color" value={selectedClip.tickerBgColor || "#cc0000"} onChange={e => updateSelectedClip({ tickerBgColor: e.target.value })} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400">Text Color</label>
                    <div className="relative w-full h-8 rounded border border-zinc-700 overflow-hidden shadow-sm">
                      <input type="color" value={selectedClip.tickerTextColor || "#ffffff"} onChange={e => updateSelectedClip({ tickerTextColor: e.target.value })} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Vertical Position: {Math.round(selectedClip.y !== undefined ? selectedClip.y : 90)}%
                      <span className="ml-1 text-[10px] text-zinc-500">(0=top · 100=bottom)</span>
                    </label>
                    <button
                      onClick={() => {
                        const fontSize1 = selectedClip.tickerFontSize || 32;
                        const h1Px = (selectedClip.tickerText || "").split("\n").length * fontSize1 * 1.2;
                        const h2Px = selectedClip.enableSecondaryTicker
                          ? (selectedClip.tickerText2 || "").split("\n").length * (selectedClip.tickerFontSize2 || 24) * 1.2
                          : 0;
                        const paddingPx = Math.max(fontSize1, selectedClip.tickerFontSize2 || 24) * 0.8;
                        const heightPct = ((h1Px + h2Px + paddingPx) / aspectRatio.h) * 100;
                        updateSelectedClip({ y: Math.max(0, 100 - heightPct) });
                      }}
                      className="text-[10px] px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                    >
                      Snap to Bottom
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 shrink-0">Top</span>
                    <input type="range" min={0} max={100} step={0.5} value={selectedClip.y !== undefined ? selectedClip.y : 90} onChange={e => updateSelectedClip({ y: +e.target.value })} className="w-full accent-indigo-500" />
                    <span className="text-[10px] text-zinc-500 shrink-0">Bot</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                  <span className="text-xs font-medium text-zinc-300">Continuous Loop</span>
                  <button
                    onClick={() => updateSelectedClip({ tickerLoop: !(selectedClip.tickerLoop ?? true) })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${(selectedClip.tickerLoop ?? true) ? 'bg-indigo-500' : 'bg-zinc-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${(selectedClip.tickerLoop ?? true) ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: (selectedClip.tickerLoop ?? true) ? 'translateX(18px)' : 'translateX(4px)' }} />
                  </button>
                </div>

                {/* TRACK LAYERING (Basic) */}
                <div className="border-t border-zinc-800 pt-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Layering (Track)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        const currentTrackIndex = videoTracks.findIndex(t => t.id === selectedClip.trackId);
                        if (currentTrackIndex === -1) return;
                        if (currentTrackIndex === videoTracks.length - 1) {
                            const newTrackId = `v${Date.now()}`;
                            setVideoTracks([...videoTracks, { id: newTrackId, name: `V${videoTracks.length + 1}` }]);
                            updateSelectedClip({ trackId: newTrackId });
                        } else {
                            updateSelectedClip({ trackId: videoTracks[currentTrackIndex + 1].id });
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Bring Fwd</span>
                    </button>
                    <button 
                      onClick={() => {
                        const currentTrackIndex = videoTracks.findIndex(t => t.id === selectedClip.trackId);
                        if (currentTrackIndex <= 0) return;
                        updateSelectedClip({ trackId: videoTracks[currentTrackIndex - 1].id });
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Send Back</span>
                    </button>
                  </div>
                </div>

                {/* TICKER ANIMATIONS */}
                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Animations</p>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Animation Style</label>
                    <select 
                      value={selectedClip.animationType || "none"} 
                      onChange={e => updateSelectedClip({ animationType: e.target.value as any })} 
                      className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none"
                    >
                      <option value="none">None</option>
                      <optgroup label="Continuous">
                        <option value="pulse">Pulse (Scale)</option>
                        <option value="wiggle">Wiggle (Rotate)</option>
                        <option value="float">Float (Up/Down)</option>
                        <option value="spin-cw">Spin Clockwise</option>
                          <option value="spin-ccw">Spin Anti-Clockwise</option>
                        <option value="blink">Blink (Flash)</option>
                      </optgroup>
                      <optgroup label="In / Out (Broadcast)">
                        <option value="slide-in-left">Slide In (Left)</option>
                        <option value="slide-in-right">Slide In (Right)</option>
                        <option value="slide-in-bottom">Slide In (Bottom)</option>
                        <option value="slide-in-top">Slide In (Top)</option>
                      </optgroup>
                    </select>
                  </div>
                  {selectedClip.animationType && selectedClip.animationType !== "none" && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-indigo-500/5 p-3 rounded-md border border-indigo-500/10">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-medium text-zinc-300">Speed</label>
                          <span className="text-zinc-500 tabular-nums">{selectedClip.animationSpeed || 1.0}x</span>
                        </div>
                        <input 
                          type="range" min={0.1} max={5.0} step={0.1} 
                          value={selectedClip.animationSpeed || 1.0} 
                          onChange={(e) => updateSelectedClip({ animationSpeed: +e.target.value })} 
                          className="w-full h-1.5 accent-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-medium text-zinc-300">Intensity</label>
                          <span className="text-zinc-500 tabular-nums">{selectedClip.animationIntensity || 1.0}x</span>
                        </div>
                        <input 
                          type="range" min={0.1} max={5.0} step={0.1} 
                          value={selectedClip.animationIntensity || 1.0} 
                          onChange={(e) => updateSelectedClip({ animationIntensity: +e.target.value })} 
                          className="w-full h-1.5 accent-indigo-500" 
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : selectedClip ? (
              <div className="space-y-5">
                {/* QUICK ACTIONS */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      handleAddText();
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Type className="w-4 h-4" /> Add Text
                  </button>
                  <button 
                    onClick={() => {
                      setAudioUrl(selectedClip.url);
                      updateSelectedClip({ volume: 0 });
                      showToast("Audio extracted to background track", "success");
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Extracts audio from this clip and sets it as the background track"
                  >
                    <Music className="w-4 h-4" /> Extract Audio
                  </button>
                </div>

                {/* TRACK LAYERING */}
                <div className="border-t border-zinc-800 pt-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Layering (Track)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        const currentTrackIndex = videoTracks.findIndex(t => t.id === selectedClip.trackId);
                        if (currentTrackIndex === -1) return;
                        if (currentTrackIndex === videoTracks.length - 1) {
                            const newTrackId = `v${Date.now()}`;
                            setVideoTracks([...videoTracks, { id: newTrackId, name: `V${videoTracks.length + 1}` }]);
                            updateSelectedClip({ trackId: newTrackId });
                            showToast("Moved forward to new track", "success");
                        } else {
                            updateSelectedClip({ trackId: videoTracks[currentTrackIndex + 1].id });
                            showToast("Moved to upper track", "success");
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                      title="Bring Forward (Move to Upper Track)"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Bring Forward</span>
                    </button>
                    <button 
                      onClick={() => {
                        const currentTrackIndex = videoTracks.findIndex(t => t.id === selectedClip.trackId);
                        if (currentTrackIndex <= 0) {
                            showToast("Already at the bottom track", "info");
                            return;
                        }
                        updateSelectedClip({ trackId: videoTracks[currentTrackIndex - 1].id });
                        showToast("Moved to lower track", "success");
                      }}
                      className="flex items-center justify-center gap-2 py-2 px-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                      title="Send Backward (Move to Lower Track)"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Send Backward</span>
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <ArrowUpToLine className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Overlay Mode</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Place this video clip on top of all images and text layers.
                    </p>
                    <button
                      onClick={() => updateSelectedClip({ isForeground: !selectedClip.isForeground })}
                      className={`mt-1 w-full py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                        selectedClip.isForeground 
                          ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {selectedClip.isForeground ? 'ENABLED: IN FRONT OF IMAGES' : 'CLICK TO BRING IN FRONT OF IMAGES'}
                    </button>
                  </div>
                </div>

                {/* ONE-CLICK FILTER PRESETS */}
                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Filters</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setActiveFilterId(f.id);
                          updateSelectedClip({
                            brightness: f.brightness,
                            contrast: f.contrast,
                            saturate: f.saturate,
                            sepia: f.sepia,
                            hueRotate: f.hueRotate
                          });
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
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Animations</p>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-300">Animation Style</label>
                      <select 
                        value={selectedClip.animationType || "none"} 
                        onChange={e => updateSelectedClip({ animationType: e.target.value as any })} 
                        className="w-full bg-zinc-800 text-zinc-200 text-sm rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none"
                      >
                        <option value="none">None</option>
                        <optgroup label="Continuous">
                          <option value="pulse">Pulse (Scale)</option>
                          <option value="wiggle">Wiggle (Rotate)</option>
                          <option value="float">Float (Up/Down)</option>
                          <option value="spin-cw">Spin Clockwise</option>
                          <option value="spin-ccw">Spin Anti-Clockwise</option>
                          <option value="blink">Blink (Flash)</option>
                        </optgroup>
                        <optgroup label="In / Out (Broadcast)">
                          <option value="slide-in-left">Slide In (Left)</option>
                          <option value="slide-in-right">Slide In (Right)</option>
                          <option value="slide-in-bottom">Slide In (Bottom)</option>
                          <option value="slide-in-top">Slide In (Top)</option>
                        </optgroup>
                      </select>
                    </div>

                    {selectedClip.animationType && selectedClip.animationType !== "none" && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-indigo-500/5 p-3 rounded-md border border-indigo-500/10">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <label className="font-medium text-zinc-300">Speed</label>
                            <span className="text-zinc-500 tabular-nums">{selectedClip.animationSpeed || 1.0}x</span>
                          </div>
                          <input 
                            type="range" min={0.1} max={5.0} step={0.1} 
                            value={selectedClip.animationSpeed || 1.0} 
                            onChange={(e) => updateSelectedClip({ animationSpeed: +e.target.value })} 
                            className="w-full h-1.5 accent-indigo-500" 
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <label className="font-medium text-zinc-300">Intensity</label>
                            <span className="text-zinc-500 tabular-nums">{selectedClip.animationIntensity || 1.0}x</span>
                          </div>
                          <input 
                            type="range" min={0.1} max={5.0} step={0.1} 
                            value={selectedClip.animationIntensity || 1.0} 
                            onChange={(e) => updateSelectedClip({ animationIntensity: +e.target.value })} 
                            className="w-full h-1.5 accent-indigo-500" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Rewind className="w-3 h-3" /> Transitions</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-medium text-zinc-300">Fade In</label>
                          <span className="text-zinc-500 tabular-nums">{selectedClip.fadeInDuration || 0}s</span>
                        </div>
                        <input type="range" min={0} max={selectedClip.duration ? Math.min(2, selectedClip.duration/2) : 2} step={0.1} value={selectedClip.fadeInDuration || 0} onChange={(e) => updateSelectedClip({ fadeInDuration: +e.target.value })} className="w-full h-1.5 accent-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <label className="font-medium text-zinc-300">Fade Out</label>
                          <span className="text-zinc-500 tabular-nums">{selectedClip.fadeOutDuration || 0}s</span>
                        </div>
                        <input type="range" min={0} max={selectedClip.duration ? Math.min(2, selectedClip.duration/2) : 2} step={0.1} value={selectedClip.fadeOutDuration || 0} onChange={(e) => updateSelectedClip({ fadeOutDuration: +e.target.value })} className="w-full h-1.5 accent-indigo-500" />
                      </div>
                    </div>
                    <button 
                      onClick={() => updateSelectedClip({ fadeInDuration: 0.5, fadeOutDuration: 0.5 })}
                      className="w-full py-1.5 mt-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Apply Smooth Fade
                    </button>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3" /> Fine Tune</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  {[
                    { label: "Volume",     value: selectedClip.volume !== undefined ? selectedClip.volume : 1, min: 0, max: 2, step: 0.1, display: Math.round((selectedClip.volume !== undefined ? selectedClip.volume : 1) * 100), prop: 'volume' as const, isVolume: true },
                    { label: "Speed",      value: selectedClip.playbackRate || 1, min: 0.1, max: 4.0, step: 0.1, display: selectedClip.playbackRate || 1, prop: 'playbackRate' as const, isSpeed: true },
                    { label: "X Position", value: selectedClip.x, min: -100, max: 100, step: 1, display: selectedClip.x, prop: 'x' as const },
                    { label: "Y Position", value: selectedClip.y, min: -100, max: 100, step: 1, display: selectedClip.y, prop: 'y' as const },
                    { label: "Zoom",       value: selectedClip.videoZoom,  min: 0.1,  max: 3, step: 0.05, display: Math.round((selectedClip.videoZoom - 1) * 100), prop: 'videoZoom' as const },
                    { label: "Brightness", value: selectedClip.brightness, min: -1, max: 1, step: 0.05, display: Math.round(selectedClip.brightness * 100), prop: 'brightness' as const },
                    { label: "Contrast",   value: selectedClip.contrast,   min: 0,  max: 2, step: 0.05, display: Math.round((selectedClip.contrast - 1) * 100), prop: 'contrast' as const },
                    { label: "Saturation", value: selectedClip.saturate,   min: 0,  max: 3, step: 0.05, display: Math.round((selectedClip.saturate - 1) * 100), prop: 'saturate' as const },
                  ].map(({ label, value, min, max, step, display, prop, isSpeed, isVolume }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <label className="font-medium text-zinc-300">{label}</label>
                        <span className="text-zinc-500 tabular-nums">{isSpeed ? `${display}x` : isVolume ? `${display}%` : (display > 0 ? `+${display}` : display)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={min} max={max} step={step}
                        value={value}
                        onChange={(e) => { updateSelectedClip({ [prop]: parseFloat(e.target.value) }); setActiveFilterId("custom"); }}
                        className="w-full h-1.5 accent-indigo-500" 
                      />
                    </div>
                  ))}
                  </div>
                  <button 
                    onClick={() => { updateSelectedClip({ videoZoom: 1, x: 0, y: 0, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0 }); setActiveFilterId("none"); }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-colors mt-4"
                  >
                    ↺ Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-4">Select an item on the canvas or timeline to edit its properties.</p>
            )}

            {/* 2. Global AI Tools & Settings (Always available at the bottom) */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Global AI Tools</h4>
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
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chroma Key</h4>
                <input type="checkbox" disabled={!selectedClip} checked={selectedClip?.enableChromaKey || false} onChange={e => updateSelectedClip({ enableChromaKey: e.target.checked })} className="accent-emerald-500" />
              </div>
              {selectedClip?.enableChromaKey && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-zinc-400">Color</label>
                    <input type="color" value={selectedClip.chromaKeyColor} onChange={e => updateSelectedClip({ chromaKeyColor: e.target.value })} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="text-zinc-400">Tolerance</label>
                      <span className="text-zinc-500 tabular-nums">{selectedClip.chromaKeySimilarity.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.01} max={1} step={0.01} value={selectedClip.chromaKeySimilarity} onChange={e => updateSelectedClip({ chromaKeySimilarity: +e.target.value })} className="w-full h-1.5 accent-emerald-500" />
                  </div>
                  <p className="text-[10px] text-emerald-400/70 italic">Applied automatically during video export.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* BOTTOM - TIMELINE */}
        <div className="h-[35vh] md:h-52 min-h-[150px] max-h-[50vh] bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0 z-20">

          {/* TIMELINE TOOLBAR */}
          <div className="h-9 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Timeline</span>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button onClick={() => historyState.undo()} disabled={!historyState.canUndo} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo Timeline (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
              <button onClick={() => historyState.redo()} disabled={!historyState.canRedo} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo Timeline (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button onClick={handleDuplicateClip} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors" title="Duplicate Selected Clip (Ctrl+D)"><Layers className="w-4 h-4" /></button>
              <button onClick={handleSplitClip} className="p-1.5 hover:bg-zinc-800 text-pink-400 hover:text-pink-300 rounded transition-colors" title="Split at Playhead"><Scissors className="w-4 h-4" /></button>
              <button onClick={() => {
                const hasContent = clips.length > 0 || canvasAssets.filter(a => a.id !== 'video-proxy').length > 0 || audioUrl;
                if (hasContent) {
                  setShowClearConfirm(true);
                }
              }} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors" title="Clear All"><Trash2 className="w-4 h-4" /></button>
              
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button 
                onClick={() => setIsSnappingEnabled(!isSnappingEnabled)} 
                className={`p-1.5 rounded transition-colors ${isSnappingEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`} 
                title="Toggle Magnetic Snapping"
              >
                <Magnet className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsRippleEnabled(!isRippleEnabled)} 
                className={`p-1.5 rounded transition-colors ${isRippleEnabled ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`} 
                title="Toggle Ripple Edit Mode (Auto-close gaps on delete)"
              >
                <Link2 className="w-4 h-4" />
              </button>

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
                <input type="range" min={0.1} max={5} step={0.1} value={timelineZoom} onChange={e => setTimelineZoom(+e.target.value)} className="w-20 h-1 accent-indigo-500" />
              </div>
              <div className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                {clips.length} clip{clips.length !== 1 ? "s" : ""} · 
                {isEditingTimecode ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseFloat(timecodeInput);
                    if (!isNaN(parsed) && parsed >= 0 && parsed <= totalDuration) {
                      setGlobalTime(parsed);
                    }
                    setIsEditingTimecode(false);
                  }}>
                    <input 
                      autoFocus
                      type="text" 
                      value={timecodeInput} 
                      onChange={e => setTimecodeInput(e.target.value)} 
                      onBlur={() => setIsEditingTimecode(false)}
                      className="w-16 bg-zinc-800 text-white rounded px-1 py-0.5 text-center outline-none ring-1 ring-indigo-500" 
                    />
                  </form>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-indigo-400 transition-colors" 
                    onClick={() => { setIsEditingTimecode(true); setTimecodeInput(globalTime.toFixed(2)); }}
                    title="Click to jump to time"
                  >
                    {globalTime.toFixed(2)}s / {totalDuration.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TRACKS AREA */}
          <div className="flex-1 overflow-y-auto overflow-x-auto relative select-none">
            <div 
              ref={tracksAreaRef}
              className="relative p-3 space-y-2 h-full"
              style={{ width: `${timelineZoom * 100}%`, minWidth: timelineZoom < 1 ? 'auto' : '100%' }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                try {
                  const data = JSON.parse(e.dataTransfer.getData("application/json"));
                  if (data.type === "audio_clip_drop") {
                    e.preventDefault();
                    setAudioUrl(data.payload.url);
                    showToast("Audio added to background track", "success");
                  } else if (data.type === "timeline_clip_drop") {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const trackWidth = rect.width - 56;
                    const dropX = Math.max(0, e.clientX - rect.left - 56);
                    const dropTime = (dropX / trackWidth) * (totalDuration || 1);
                    
                    const newClipObj: VideoClip = { 
                      id: crypto.randomUUID(), type: "video", 
                      name: data.payload.name, url: data.payload.url, 
                      startTime: dropTime, fileDuration: data.payload.fileDuration, 
                      duration: data.payload.duration, trimStart: data.payload.trimStart, 
                      trimEnd: data.payload.trimEnd, trackId: videoTracks[0]?.id || "v1", 
                      color: `hsl(${Math.floor(Math.random()*360)}, 70%, 55%)`, 
                      x: 0, y: 0, videoZoom: 1, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0, 
                      enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.3, 
                      playbackRate: 1, volume: 1, opacity: 1 
                    }; 
                    setClips(prev => [...prev, newClipObj]); 
                    setSelectedClipId(newClipObj.id); 
                    showToast("Clip dropped to timeline", "success");
                  }
                } catch(err) {}
              }}
              onClick={(e) => { 
                // Deselect if clicking empty space
                if (e.target === e.currentTarget) setSelectedAssetId(null); 
                
                // If clicking on track area, seek to that position
                if (e.target === e.currentTarget && tracksAreaRef.current) {
                  const rect = tracksAreaRef.current.getBoundingClientRect();
                  const trackWidth = rect.width - 80;
                  let newX = e.clientX - rect.left - 68;
                  if (newX < 0) newX = 0;
                  if (newX > trackWidth) newX = trackWidth;
                  const newGlobalTime = (newX / trackWidth) * (totalDuration || 1);
                  handleSeek({ target: { value: newGlobalTime.toString() } } as any);
                }
              }}
            >

            {/* Playhead Line */}
            <div className={`absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none transition-opacity duration-150 ${isDraggingPlayhead ? 'opacity-100' : 'opacity-80'}`}
              style={{ left: `calc(68px + calc(calc(100% - 80px) * ${globalTime / (totalDuration || 1)}))` }}>
              <div 
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPlayhead(true); setIsPlaying(false); }}
                className="absolute top-0 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-sm cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform" 
              />
            </div>

            {/* VIDEO CLIP TRACKS */}
            <div className="space-y-1">
              {videoTracks.map((track, tIdx) => (
                <div 
                  key={track.id} 
                  data-track-id={track.id} 
                  className="h-14 rounded-lg flex relative border border-zinc-800/50 bg-zinc-900/50 transition-colors hover:bg-zinc-800/80"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData("application/json"));
                      if (data.type === "timeline_clip_drop") {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const trackWidth = rect.width - 56;
                        const dropX = Math.max(0, e.clientX - rect.left - 56);
                        const dropTime = (dropX / trackWidth) * (totalDuration || 1);
                        
                        const newClipObj: VideoClip = { 
                          id: crypto.randomUUID(), type: "video", 
                          name: data.payload.name, url: data.payload.url, 
                          startTime: dropTime, fileDuration: data.payload.fileDuration, 
                          duration: data.payload.duration, trimStart: data.payload.trimStart, 
                          trimEnd: data.payload.trimEnd, trackId: track.id, 
                          color: `hsl(${Math.floor(Math.random()*360)}, 70%, 55%)`, 
                          x: 0, y: 0, videoZoom: 1, brightness: 0, contrast: 1, saturate: 1, sepia: 0, hueRotate: 0, 
                          enableChromaKey: false, chromaKeyColor: "#00ff00", chromaKeySimilarity: 0.3, 
                          playbackRate: 1, volume: 1, opacity: 1 
                        }; 
                        setClips(prev => [...prev, newClipObj]); 
                        setSelectedClipId(newClipObj.id); 
                        showToast("Clip dropped to timeline", "success");
                      } else if (data.type === "audio_clip_drop") {
                        setAudioUrl(data.payload.url);
                        showToast("Audio added to background track", "success");
                      }
                    } catch(err) {}
                  }}
                >
                  <div className="w-14 shrink-0 flex flex-col items-center justify-center bg-zinc-900 border-r border-zinc-800 rounded-l-lg z-10 gap-0.5 relative group">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] text-indigo-400 font-bold">{track.name}</span>
                    
                    <div className="flex gap-1.5 mt-0.5 relative z-30">
                      <button 
                        onClick={() => setVideoTracks(videoTracks.map(t => t.id === track.id ? { ...t, isHidden: !t.isHidden } : t))}
                        className={`hover:text-white transition-colors ${track.isHidden ? 'text-zinc-600' : 'text-zinc-400'}`}
                        title={track.isHidden ? "Show Track" : "Hide Track"}
                      >
                        {track.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={() => setVideoTracks(videoTracks.map(t => t.id === track.id ? { ...t, isMuted: !t.isMuted } : t))}
                        className={`hover:text-white transition-colors ${track.isMuted ? 'text-red-400' : 'text-zinc-400'}`}
                        title={track.isMuted ? "Unmute Track" : "Mute Track"}
                      >
                        {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    </div>

                    {videoTracks.length > 1 && (
                      <button 
                        onClick={() => {
                           setVideoTracks(videoTracks.filter(t => t.id !== track.id));
                           setClips(clips.filter(c => c.trackId !== track.id));
                        }}
                        className="absolute top-1 right-1 z-20 w-4 h-4 bg-red-500/80 rounded flex items-center justify-center hover:bg-red-600 transition-colors shadow opacity-0 group-hover:opacity-100" 
                        title="Remove Track"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}

                    {tIdx === videoTracks.length - 1 && (
                       <button onClick={() => setVideoTracks([...videoTracks, { id: `v${Date.now()}`, name: `V${videoTracks.length + 1}` }])}
                               className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 w-5 h-5 bg-zinc-800 rounded flex items-center justify-center hover:bg-indigo-600 transition-colors shadow border border-zinc-700" title="Add Video Track">
                          <Plus className="w-3 h-3 text-white" />
                       </button>
                    )}
                  </div>
                  <div className="flex-1 relative overflow-hidden p-1">
                    {clips.filter(c => c.trackId === track.id).map(clip => {
                      const leftPct = (clip.startTime / (totalDuration || 1)) * 100;
                      const widthPct = (clip.duration / (totalDuration || 1)) * 100;
                      const isSelected = selectedClip?.id === clip.id;
                      return (
                        <div 
                          key={clip.id}
                          className={`absolute top-1 bottom-1 rounded-md flex items-center px-1.5 cursor-move transition-colors shadow-sm ${isSelected ? 'bg-indigo-500/30 border border-indigo-400/60 ring-1 ring-indigo-400 z-10' : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700'}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '40px' }}
                          onMouseDown={(e) => {
                             e.stopPropagation();
                             setSelectedClipId(clip.id);
                             setSelectedAssetId(null);
                             fabricCanvasRef.current?.discardActiveObject();
                             fabricCanvasRef.current?.renderAll();
                             setActiveTab("adjust");
                             setClipDragState({
                               clipId: clip.id, type: 'move', startX: e.clientX,
                               initialStart: clip.startTime, initialDuration: clip.duration,
                               initialTrimStart: clip.trimStart || 0, initialTrimEnd: clip.trimEnd || clip.fileDuration,
                               fileDuration: clip.fileDuration
                             });
                             handleSeek({ target: { value: clip.startTime.toString() } } as any);
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-indigo-400/50 rounded-l-md z-20"
                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 setSelectedClipId(clip.id);
                                 setSelectedAssetId(null);
                                 fabricCanvasRef.current?.discardActiveObject();
                                 fabricCanvasRef.current?.renderAll();
                                 setActiveTab("adjust");
                                 setClipDragState({ clipId: clip.id, type: 'trimStart', startX: e.clientX, initialStart: clip.startTime, initialDuration: clip.duration, initialTrimStart: clip.trimStart || 0, initialTrimEnd: clip.trimEnd || clip.fileDuration, fileDuration: clip.fileDuration });
                               }}
                          />
                          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-indigo-400/50 rounded-r-md z-20"
                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 setSelectedClipId(clip.id);
                                 setSelectedAssetId(null);
                                 fabricCanvasRef.current?.discardActiveObject();
                                 fabricCanvasRef.current?.renderAll();
                                 setActiveTab("adjust");
                                 setClipDragState({ clipId: clip.id, type: 'trimEnd', startX: e.clientX, initialStart: clip.startTime, initialDuration: clip.duration, initialTrimStart: clip.trimStart || 0, initialTrimEnd: clip.trimEnd || clip.fileDuration, fileDuration: clip.fileDuration });
                               }}
                          />
                          
                          <WaveformRenderer 
                            url={clip.url} 
                            duration={clip.duration} 
                            trimStart={clip.trimStart || 0} 
                            fileDuration={clip.fileDuration} 
                          />

                          {/* Fade Overlays */}
                          {clip.fadeInDuration && clip.fadeInDuration > 0 ? (
                            <div className="absolute top-0 bottom-0 left-0 bg-black/40 z-20 pointer-events-none" style={{ width: `${(clip.fadeInDuration / clip.duration) * 100}%`, clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
                          ) : null}
                          {clip.fadeOutDuration && clip.fadeOutDuration > 0 ? (
                            <div className="absolute top-0 bottom-0 right-0 bg-black/40 z-20 pointer-events-none" style={{ width: `${(clip.fadeOutDuration / clip.duration) * 100}%`, clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
                          ) : null}

                          {/* Fade Handles */}
                          <div className="absolute left-0 top-0 w-3 h-3 cursor-ew-resize hover:scale-150 transition-transform bg-white border border-black shadow-sm rounded-br-full z-30 opacity-0 group-hover:opacity-100"
                               onMouseDown={(e) => { e.stopPropagation(); setFadeDragState({ clipId: clip.id, type: 'fadeIn', startX: e.clientX, initialFade: clip.fadeInDuration || 0 }); }} />
                          <div className="absolute right-0 top-0 w-3 h-3 cursor-ew-resize hover:scale-150 transition-transform bg-white border border-black shadow-sm rounded-bl-full z-30 opacity-0 group-hover:opacity-100"
                               onMouseDown={(e) => { e.stopPropagation(); setFadeDragState({ clipId: clip.id, type: 'fadeOut', startX: e.clientX, initialFade: clip.fadeOutDuration || 0 }); }} />

                          <span className={`text-[10px] font-medium truncate pointer-events-none z-10 ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{clip.name}</span>
                          <span className="text-[10px] text-zinc-500 ml-auto shrink-0 pointer-events-none z-10">{clip.duration ? `${clip.duration.toFixed(1)}s` : "…"}</span>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); deleteClip(clip.id); }} 
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
                        setActiveTab("adjust");
                        if (asset.obj) {
                          fabricCanvasRef.current?.setActiveObject(asset.obj);
                          setSelectedObj(asset.obj);
                        }
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
                          if (asset.obj) {
                            fabricCanvasRef.current?.setActiveObject(asset.obj);
                            setSelectedObj(asset.obj);
                          }
                          fabricCanvasRef.current?.renderAll();
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
                          if (asset.obj) {
                            fabricCanvasRef.current?.setActiveObject(asset.obj);
                            setSelectedObj(asset.obj);
                          }
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
