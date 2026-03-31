"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Check, RotateCw, ZoomIn, Crop as CropIcon, MousePointer2, Move, Maximize, Scissors, ZoomOut } from "lucide-react";

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
    { label: "Banner", value: 1920 / 800 },
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
    const [dragMode, setDragMode] = useState<'crop' | 'move'>('crop');

    // Update aspect ratio and drag mode of the active cropper
    useEffect(() => {
        const cropper = cropperRef.current?.cropper;
        if (cropper) {
            cropper.setAspectRatio(aspect === 0 ? NaN : aspect);
            cropper.setDragMode(dragMode);
        }
    }, [aspect, dragMode]);

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
                        {/* <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10 rounded-full border border-slate-100 bg-[#FDFCFB] text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <X className="w-5 h-5" />
                        </Button> */}
                    </div>
                </DialogHeader>

                {/* Main Interaction Area */}
                <div className="flex-1 relative bg-white overflow-hidden flex flex-col items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Cropper
                            src={image}
                            style={{ height: "100%", width: "100%" }}
                            initialAspectRatio={aspect === 0 ? NaN : aspect}
                            aspectRatio={aspect === 0 ? NaN : aspect}
                            guides={true}
                            ref={cropperRef}
                            viewMode={1}
                            dragMode={dragMode}
                            scalable={true}
                            cropBoxResizable={true}
                            cropBoxMovable={true}
                            background={false}
                            responsive={true}
                            autoCropArea={0.8}
                            checkOrientation={false}
                            className="max-w-full max-h-full shadow-2xl rounded-lg"
                        />
                    </div>
                </div>

                {/* Footer Controls Area */}
                <div className="p-6 bg-[#FAF9F7] border-t border-[#E8E2D9] shrink-0">
                    <div className="flex flex-col gap-6">
                        {/* Aspect Ratio Presets */}
                        {!lockAspect && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-[#5C4D3F] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <CropIcon className="w-3.5 h-3.5 text-primary" /> Aspect Ratio
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ASPECT_RATIOS.map((r) => (
                                        <Button
                                            key={r.label}
                                            type="button"
                                            variant={(Math.abs(aspect - r.value) < 0.01) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setAspect(r.value)}
                                            className={`h-9 px-4 rounded-xl transition-all font-bold text-[11px] tracking-tight border-2 ${((Math.abs(aspect - r.value) < 0.01))
                                                ? "bg-primary text-white border-primary shadow-md active:scale-95"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-primary/5"
                                                }`}
                                        >
                                            {r.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tools and Save Bar */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
                            <div className="flex items-center gap-8">
                                {/* Selection Mode Group */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5C4D3F]/60 ml-1">Selection Mode</p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={dragMode === 'crop' ? 'default' : 'outline'}
                                            size="sm"
                                            className={`rounded-xl h-11 px-4 border-slate-200 shadow-sm transition-all ${dragMode === 'crop' ? 'bg-[#8B4513] text-white' : 'bg-white text-slate-600 hover:border-primary/50'}`}
                                            onClick={() => setDragMode('crop')}
                                            title="Move/Resize Crop Box"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CropIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-bold">Adjust Box</span>
                                            </div>
                                        </Button>
                                        <Button
                                            variant={dragMode === 'move' ? 'default' : 'outline'}
                                            size="sm"
                                            className={`rounded-xl h-11 px-4 border-slate-200 shadow-sm transition-all ${dragMode === 'move' ? 'bg-[#8B4513] text-white' : 'bg-white text-slate-600 hover:border-primary/50'}`}
                                            onClick={() => setDragMode('move')}
                                            title="Drag Image"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Move className="w-4 h-4" />
                                                <span className="text-[10px] font-bold">Move Image</span>
                                            </div>
                                        </Button>
                                    </div>
                                </div>

                                {/* Rotation Group */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5C4D3F]/60 ml-1">Rotation</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="w-12 rounded-xl h-11 border-slate-200 bg-white shadow-sm hover:border-primary/50" onClick={() => rotate(-90)}>
                                            <RotateCw className="w-4 h-4 -scale-x-100 text-slate-600" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-12 rounded-xl h-11 border-slate-200 bg-white shadow-sm hover:border-primary/50" onClick={() => rotate(90)}>
                                            <RotateCw className="w-4 h-4 text-slate-600" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Zoom Group */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5C4D3F]/60 ml-1">Scaling</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="w-12 rounded-xl h-11 border-slate-200 bg-white shadow-sm hover:border-primary/50" onClick={() => zoom(-0.1)}>
                                            <ZoomOut className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="w-12 rounded-xl h-11 border-slate-200 bg-white shadow-sm hover:border-primary/50" onClick={() => zoom(0.1)}>
                                            <ZoomIn className="w-4 h-4 text-slate-600" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Quick Tips */}
                                <div className="hidden xl:flex items-center gap-4 bg-white/50 px-4 py-2 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[10px] font-medium transition-all">
                                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Corner Handles
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Move className="w-3 h-3" />
                                        {dragMode === 'move' ? 'Dragging Image' : 'Click to Draw'}
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full md:w-auto min-w-[240px] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl flex items-center justify-center gap-3 font-black transition-all active:scale-95 group"
                            >
                                {isLoading ? (
                                    <RotateCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5 transition-transform group-hover:scale-125" />
                                        <span>FINALIZE & SAVE IMAGE</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
