"use client";

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import getCroppedImg from '@/utils/cropImage';
import { useAuthStore } from '@/store/useAuthStore';

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function LogoUploader({ value, onChange, disabled }: LogoUploaderProps) {
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");

      const file = new File([croppedBlob], "logo.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      // The backend returns filepath like "uploads/uuid.png"
      // We want to return the full URL back to the form
      const baseUrl = API_URL.replace('/api/v1', '');
      const finalUrl = `${baseUrl}/${data.filepath}`;
      
      onChange(finalUrl);
      setImageSrc(null); // Close cropper modal
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input (Hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Preview Area */}
      <div 
        onClick={triggerUpload}
        className={`relative flex items-center justify-center w-40 h-40 rounded-xl overflow-hidden border-2 border-dashed ${disabled ? 'opacity-50 cursor-not-allowed border-zinc-800' : 'cursor-pointer border-white/20 hover:border-purple-500 transition-colors bg-black/20 group'}`}
      >
        {value ? (
          <img src={value} alt="Logo Preview" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center text-zinc-500">
            <ImageIcon size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium">Upload Logo</span>
          </div>
        )}

        {!disabled && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center text-sm font-semibold text-white">
              <Upload size={16} className="mr-2" />
              {value ? "Change Logo" : "Upload Logo"}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Click to browse or drag and drop an image. Supported formats: PNG, JPG, SVG.
      </p>

      {/* Cropper Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Crop Logo</h3>
              <button onClick={() => setImageSrc(null)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative h-80 w-full bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Assuming square or free crop. For logos, free crop might be better, but let's default to square or allow custom
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-zinc-400">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setImageSrc(null)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={uploadCroppedImage}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : <><Check size={16} /> Crop & Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
}
