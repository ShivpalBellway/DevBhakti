"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Check, RotateCw, ZoomIn, Crop as CropIcon, MousePointer2, Move, Maximize, Scissors } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (file: File) => void;
    onCancel: () => void;
    initialAspect?: number;
    title?: string;
    lockAspect?: boolean;
}

const ASPECT_RATIOS = [
    { label: "Free / Manual", value: 0 },
    { label: "1:1", value: 1 / 1 },
    { label: "3:2", value: 3 / 2 },
    { label: "4:3", value: 4 / 3 },
    { label: "5:4", value: 5 / 4 },
    { label: "2:3", value: 2 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
    { label: "Banner", value: 1920 / 600 },
];

export function ImageCropper({
    image,
    onCropComplete,
    onCancel,
    initialAspect = 1,
    title = "Precise Image Selection",
    lockAspect = false
}: ImageCropperProps) {
    const cropperRef = useRef<ReactCropperElement>(null);
    const [aspect, setAspect] = useState<number>(initialAspect || 0);
    const [isLoading, setIsLoading] = useState(false);

    // Update aspect ratio of the active cropper
    useEffect(() => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            cropper.setAspectRatio(aspect === 0 ? NaN : aspect);
        }
    }, [aspect]);

    const handleSave = async () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        try {
            setIsLoading(true);
            // Get the cropped canvas with high quality
            const canvas = cropper.getCroppedCanvas({
                imageSmoothingQuality: 'high',
            });

            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
                        onCropComplete(file);
                    }
                }, "image/jpeg", 0.95);
            }
        } catch (e) {
            console.error("Cropping failed:", e);
        } finally {
            // Loading finish is handled by parent on success or here on error
            // setIsLoading(false); 
        }
    };

    const rotate = (deg: number) => {
        cropperRef.current?.cropper.rotate(deg);
    };

    const zoom = (factor: number) => {
        cropperRef.current?.cropper.zoom(factor);
    };

    return (
        <Dialog open={true} onOpenChange={() => !isLoading && onCancel()}>
            <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 overflow-hidden bg-[#FAF9F7] border-none shadow-2xl rounded-3xl">
                {/* Header Section */}
                <DialogHeader className="p-6 border-b border-[#E8E2D9] bg-white flex flex-row items-center justify-between shrink-0">
                    <div className="flex flex-col gap-1">
                      <DialogTitle className="flex items-center gap-3 text-[#2D1B08] text-2xl font-serif">
                          <div className="p-2 bg-[#8B4513]/10 rounded-xl">
                            <Scissors className="w-6 h-6 text-[#8B4513]" />
                          </div>
                          {title}
                      </DialogTitle>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-11">Selection Tool v2.0</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                          <MousePointer2 className="w-3.5 h-3.5" /> Corner Handles Active
                        </div>
                        <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10 rounded-full border border-slate-100 bg-[#FDFCFB] text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Main Interaction Area */}
                <div className="flex-1 relative bg-[#F4F1EE] overflow-hidden flex flex-col items-center justify-center p-6 md:p-10">
                    <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
                        <Cropper
                            src={image}
                            style={{ height: "100%", width: "100%" }}
                            initialAspectRatio={aspect === 0 ? NaN : aspect}
                            aspectRatio={aspect === 0 ? NaN : aspect}
                            guides={true}
                            ref={cropperRef}
                            viewMode={1}
                            dragMode="move"
                            scalable={true}
                            cropBoxResizable={true}
                            cropBoxMovable={true}
                            background={false}
                            responsive={true}
                            autoCropArea={0.8}
                            checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
                            className="max-w-full max-h-full"
                        />
                    </div>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 text-white text-[11px] font-medium shadow-2xl pointer-events-none flex items-center gap-3 z-10">
                      <div className="flex items-center gap-2 border-r border-white/20 pr-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Grab corners to resize
                      </div>
                      <div className="flex items-center gap-2">
                        <Move className="w-3.5 h-3.5 text-blue-300" />
                        Drag inside to reposition
                      </div>
                    </div>
                </div>

                {/* Footer Controls Area */}
                <div className="p-8 bg-white border-t border-[#E8E2D9] shrink-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Aspect Ratio Presets */}
                        <div className="lg:col-span-8 space-y-5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#4A3728] uppercase tracking-[0.2em] flex items-center gap-2">
                                  <CropIcon className="w-4 h-4 text-[#8B735B]" /> Viewport Proportions
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {ASPECT_RATIOS.map((r) => (
                                    <Button
                                        key={r.label}
                                        type="button"
                                        variant={(aspect === r.value) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setAspect(r.value)}
                                        className={`h-12 px-6 rounded-2xl transition-all font-bold text-sm tracking-tight border-2 ${((aspect === r.value))
                                            ? "bg-[#8B4513] text-white border-[#8B4513] shadow-xl shadow-[#8B4513]/20 active:scale-95"
                                            : "text-[#4A3728] border-[#E8E2D9] hover:bg-[#FDF8F3] hover:border-[#8B735B]/40"
                                            }`}
                                    >
                                        {r.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Fine Tuning controls */}
                        <div className="lg:col-span-4 flex flex-col justify-end gap-6">
                            <div className="flex items-center gap-4">
                               <div className="flex-1 space-y-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precise Rotation</p>
                                  <div className="flex gap-2">
                                     <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 border-[#E8E2D9]" onClick={() => rotate(-90)}>
                                        <RotateCw className="w-4 h-4 -scale-x-100 text-[#8B735B]" />
                                     </Button>
                                     <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 border-[#E8E2D9]" onClick={() => rotate(90)}>
                                        <RotateCw className="w-4 h-4 text-[#8B735B]" />
                                     </Button>
                                  </div>
                               </div>
                               <div className="flex-1 space-y-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Canvas Zoom</p>
                                  <div className="flex gap-2">
                                     <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 border-[#E8E2D9]" onClick={() => zoom(-0.1)}>
                                        <span className="font-bold">-</span>
                                     </Button>
                                     <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 border-[#E8E2D9]" onClick={() => zoom(0.1)}>
                                        <span className="font-bold">+</span>
                                     </Button>
                                  </div>
                               </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 h-16 rounded-2xl bg-[#8B4513] hover:bg-[#6F3710] text-white shadow-2xl shadow-[#8B4513]/40 flex items-center justify-center gap-3 font-black transition-all active:scale-95"
                                >
                                    {isLoading ? (
                                        <RotateCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <div className="p-1 px-3 bg-white/10 rounded-lg">
                                              <Maximize className="w-4 h-4" />
                                            </div>
                                            APPLY SELECTION
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
