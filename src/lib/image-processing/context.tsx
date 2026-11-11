"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  HistoryStepItem,
  ImageMetadata,
  StudioModuleId,
} from "./types";
import { cloneImageData } from "./core";
import { getAspectRatio } from "./analysis";

interface StudioContextType {
  originalImage: ImageData | null;
  currentImage: ImageData | null;
  previewImage: ImageData | null;
  isPreviewOn: boolean;
  setIsPreviewOn: (value: boolean) => void;
  metadata: ImageMetadata;
  history: HistoryStepItem[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  projectId: string;
  // Methods
  loadImageFromUrl: (url: string, name?: string) => Promise<void>;
  loadImageFromFile: (file: File) => Promise<void>;
  applyStep: (
    label: string,
    module: StudioModuleId,
    algorithm: string,
    parameters: Record<string, any>,
    newImageData: ImageData
  ) => void;
  setLivePreview: (preview: ImageData | null) => void;
  undo: () => void;
  redo: () => void;
  revertToOriginal: () => void;
  jumpToStep: (index: number) => void;
  downloadImage: (format?: "png" | "jpeg" | "webp", quality?: number, fileName?: string) => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);
  const [isPreviewOn, setIsPreviewOn] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryStepItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [projectId, setProjectId] = useState<string>("default-session");
  const [metadata, setMetadata] = useState<ImageMetadata>({
    name: "cosmos.jpg",
    width: 2400,
    height: 1800,
    aspectRatio: "4:3",
    format: "JPG",
    megapixels: "4.3 MP",
  });

  const historyImagesRef = useRef<ImageData[]>([]);

  // Helper to load image into Canvas & ImageData
  const processLoadedImage = useCallback((img: HTMLImageElement, name: string, format: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const aspect = getAspectRatio(canvas.width, canvas.height);
    const mp = ((canvas.width * canvas.height) / 1000000).toFixed(1) + " MP";

    setMetadata({
      name,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: aspect,
      format: format.toUpperCase(),
      megapixels: mp,
    });

    setOriginalImage(cloneImageData(imgData));
    setCurrentImage(imgData);
    setPreviewImage(null);

    const initialStep: HistoryStepItem = {
      id: "step-0",
      stepIndex: 0,
      label: "Original image",
      module: "editor",
      algorithm: "original",
      parameters: {},
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    historyImagesRef.current = [imgData];
    setHistory([initialStep]);
    setHistoryIndex(0);
    setIsLoading(false);
  }, []);

  // Load from URL
  const loadImageFromUrl = useCallback(
    async (url: string, name: string = "cosmos.jpg") => {
      setIsLoading(true);
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const ext = name.split(".").pop() || "JPG";
          processLoadedImage(img, name, ext);
          resolve();
        };
        img.onerror = (err) => {
          console.error("Failed to load image from URL", err);
          setIsLoading(false);
          reject(err);
        };
        img.src = url;
      });
    },
    [processLoadedImage]
  );

  // Load from File
  const loadImageFromFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const ext = file.name.split(".").pop() || "JPG";
            processLoadedImage(img, file.name, ext);
            resolve();
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    [processLoadedImage]
  );

  // Initial load with cosmos sample
  useEffect(() => {
    loadImageFromUrl("/samples/cosmos.jpg", "cosmos.jpg").catch(() => {
      // Fallback: draw an artistic floral bouquet on canvas if sample is not yet loaded
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d")!;

      // Warm paper background
      ctx.fillStyle = "#FBF9F5";
      ctx.fillRect(0, 0, 1200, 900);

      // Soft sunlit window gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 900);
      grad.addColorStop(0, "#F7EFE6");
      grad.addColorStop(0.5, "#EFE6DB");
      grad.addColorStop(1, "#E8DDCE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 900);

      // Ceramic vase
      ctx.fillStyle = "#E3CEBD";
      ctx.beginPath();
      ctx.ellipse(600, 620, 100, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flowers (pink cosmos and green stems)
      const flowers = [
        { x: 580, y: 440, r: 45, c: "#E28B82" },
        { x: 650, y: 410, r: 50, c: "#DB736B" },
        { x: 520, y: 390, r: 42, c: "#EAA29A" },
        { x: 620, y: 340, r: 48, c: "#E58279" },
        { x: 710, y: 460, r: 38, c: "#EEABA4" },
      ];

      flowers.forEach((f) => {
        // Petals
        ctx.fillStyle = f.c;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const px = f.x + Math.cos(angle) * f.r * 0.7;
          const py = f.y + Math.sin(angle) * f.r * 0.7;
          ctx.beginPath();
          ctx.ellipse(px, py, f.r * 0.4, f.r * 0.25, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center
        ctx.fillStyle = "#F3B543";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      });

      const imgData = ctx.getImageData(0, 0, 1200, 900);
      setOriginalImage(cloneImageData(imgData));
      setCurrentImage(imgData);
      historyImagesRef.current = [imgData];
      setHistory([
        {
          id: "step-0",
          stepIndex: 0,
          label: "Original image",
          module: "editor",
          algorithm: "original",
          parameters: {},
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setHistoryIndex(0);
      setIsLoading(false);
    });
  }, [loadImageFromUrl]);

  // Apply a new adjustment step
  const applyStep = useCallback(
    (
      label: string,
      module: StudioModuleId,
      algorithm: string,
      parameters: Record<string, any>,
      newImageData: ImageData
    ) => {
      // Truncate redo steps if we branched
      const nextIndex = historyIndex + 1;
      const updatedHistoryImages = historyImagesRef.current.slice(0, nextIndex);
      updatedHistoryImages.push(newImageData);
      historyImagesRef.current = updatedHistoryImages;

      const newStep: HistoryStepItem = {
        id: `step-${nextIndex}`,
        stepIndex: nextIndex,
        label,
        module,
        algorithm,
        parameters,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedHistory = history.slice(0, nextIndex);
      updatedHistory.push(newStep);

      setHistory(updatedHistory);
      setHistoryIndex(nextIndex);
      setCurrentImage(newImageData);
      setPreviewImage(null);

      // Record in background database if needed
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          stepIndex: nextIndex,
          module,
          algorithm,
          label,
          parameters,
        }),
      }).catch(() => {
        // Session local, ignore db offline
      });
    },
    [history, historyIndex, projectId]
  );

  // Set real-time live preview while slider moves
  const setLivePreview = useCallback((preview: ImageData | null) => {
    setPreviewImage(preview);
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentImage(historyImagesRef.current[prevIndex]);
      setPreviewImage(null);
    }
  }, [historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentImage(historyImagesRef.current[nextIndex]);
      setPreviewImage(null);
    }
  }, [historyIndex, history.length]);

  // Revert to original
  const revertToOriginal = useCallback(() => {
    if (originalImage && history.length > 0) {
      setHistoryIndex(0);
      setCurrentImage(historyImagesRef.current[0]);
      setPreviewImage(null);
    }
  }, [originalImage, history.length]);

  // Jump to specific step in history
  const jumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < historyImagesRef.current.length) {
      setHistoryIndex(index);
      setCurrentImage(historyImagesRef.current[index]);
      setPreviewImage(null);
    }
  }, []);

  // Download Image
  const downloadImage = useCallback(
    (format: "png" | "jpeg" | "webp" = "png", quality: number = 92, customName?: string) => {
      const activeData = previewImage || currentImage || originalImage;
      if (!activeData) return;

      const canvas = document.createElement("canvas");
      canvas.width = activeData.width;
      canvas.height = activeData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(activeData, 0, 0);

      const mimeType = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
      const q = format === "png" ? undefined : quality / 100;
      const dataUrl = canvas.toDataURL(mimeType, q);

      const baseName = customName || metadata.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement("a");
      link.download = `${baseName}.${format === "jpeg" ? "jpg" : format}`;
      link.href = dataUrl;
      link.click();

      // Log export to database
      fetch("/api/export-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: link.download,
          format: format.toUpperCase(),
          quality: format === "jpeg" ? quality : undefined,
          dimensions: `${canvas.width} × ${canvas.height} px`,
          stepsCount: history.length,
        }),
      }).catch(() => {});
    },
    [previewImage, currentImage, originalImage, metadata.name, history.length]
  );

  return (
    <StudioContext.Provider
      value={{
        originalImage,
        currentImage,
        previewImage,
        isPreviewOn,
        setIsPreviewOn,
        metadata,
        history,
        historyIndex,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        isLoading,
        projectId,
        loadImageFromUrl,
        loadImageFromFile,
        applyStep,
        setLivePreview,
        undo,
        redo,
        revertToOriginal,
        jumpToStep,
        downloadImage,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
