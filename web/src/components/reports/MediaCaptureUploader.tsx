import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Video,
  X,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import { ReportMediaItem } from '../../types/report';
import { ReportService } from '../../services/reportService';

interface MediaCaptureUploaderProps {
  mediaList: ReportMediaItem[];
  onAddMedia: (item: ReportMediaItem) => void;
  onRemoveMedia: (id: string) => void;
  onRetakeMedia?: (id: string) => void;
}

export const MediaCaptureUploader: React.FC<MediaCaptureUploaderProps> = ({
  mediaList,
  onAddMedia,
  onRemoveMedia,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start live camera stream
  const startCamera = async () => {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      // Connect to video element once mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err: any) {
      console.warn('[Camera] Failed to access webcam:', err);
      // Fallback: trigger native file camera input
      if (photoInputRef.current) {
        photoInputRef.current.click();
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture snapshot from live camera
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          setIsUploading(true);
          const file = new File([blob], `incident_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          try {
            const uploaded = await ReportService.uploadMediaToObjectStorage(file);
            onAddMedia(uploaded);
          } catch (e: any) {
            setUploadError(e.message || 'Failed to upload photo');
          } finally {
            setIsUploading(false);
          }
        }
      }, 'image/jpeg', 0.85);
    }
  };

  // Handle file input changes
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await ReportService.uploadMediaToObjectStorage(file);
        onAddMedia(uploaded);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload selected file');
    } finally {
      setIsUploading(false);
      // reset input value
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#DCEBED] p-5 sm:p-6 shadow-card mb-6">
      <div className="pb-3 mb-4 border-b border-[#DCEBED] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#18364A] font-sans">
            Step 3: Photos & Video Evidence
          </h3>
          <p className="text-xs text-[#708696] mt-0.5">
            Capture real-time visuals or upload footage of flood lines, road conditions, or damage.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#708696] uppercase">
          {mediaList.length} item(s) attached
        </span>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-xl bg-[#FEF1F3] border border-[#FDC8D1] text-xs text-[#E94B68] font-medium flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-[#E94B68] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Action Buttons: Take Photo / Upload Photo / Upload Video */}
      {!isCameraActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Take Photo Button */}
          <button
            type="button"
            onClick={startCamera}
            disabled={isUploading}
            className="p-4 rounded-2xl bg-[#EDFAFC] hover:bg-[#DDF6F9] border border-[#AEEBF0] text-[#075B8A] font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 text-[#18C3D0]" />
            </div>
            <span>Take Photo (Live Camera)</span>
          </button>

          {/* Upload Photo Button */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="p-4 rounded-2xl bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] text-[#18364A] font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5 text-[#075B8A]" />
            </div>
            <span>Upload Photo</span>
          </button>

          {/* Upload Video Button */}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="p-4 rounded-2xl bg-[#F4F8FA] hover:bg-[#EEF5F8] border border-[#DCEBED] text-[#18364A] font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
              <Video className="w-5 h-5 text-[#E94B68]" />
            </div>
            <span>Upload Video (MP4)</span>
          </button>

          {/* Hidden File Inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileSelected}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>
      )}

      {/* Live Camera Viewfinder Modal / Inline View */}
      {isCameraActive && (
        <div className="mb-5 bg-black rounded-2xl overflow-hidden p-4 flex flex-col items-center gap-3 relative shadow-elevated">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-72 rounded-xl object-contain bg-slate-900"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Action Controls */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-[#E94B68] text-white flex items-center justify-center shadow-float ring-4 ring-white/30 hover:scale-105 transition-transform"
              title="Capture Photo"
            >
              <Camera className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              Cancel Camera
            </button>
          </div>
        </div>
      )}

      {/* Uploading Spinner */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-[#EDFAFC] border border-[#AEEBF0] text-center flex items-center justify-center gap-2.5 text-xs text-[#075B8A] font-semibold mb-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#18C3D0]" />
          <span>Compressing & uploading media to secure storage vault...</span>
        </div>
      )}

      {/* Media Previews Grid */}
      {mediaList.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-[#708696]">
            Uploaded Evidence ({mediaList.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-2xl overflow-hidden bg-slate-100 border border-[#DCEBED] shadow-xs aspect-video flex items-center justify-center"
              >
                {item.fileType.startsWith('video/') ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                    <Video className="w-6 h-6 text-[#18C3D0] mb-1" />
                    <span className="text-[10px] font-mono">{item.fileName}</span>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt="Evidence Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Remove & Retake Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRemoveMedia(item.id)}
                    className="p-1.5 rounded-full bg-[#E94B68] text-white hover:scale-110 transition-transform"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveMedia(item.id);
                      startCamera();
                    }}
                    className="p-1.5 rounded-full bg-[#075B8A] text-white hover:scale-110 transition-transform"
                    title="Retake photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Another Media Tile */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-[#DCEBED] hover:border-[#18C3D0] aspect-video flex flex-col items-center justify-center gap-1 text-[#708696] hover:text-[#075B8A] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-mono font-bold uppercase">Add Another</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
