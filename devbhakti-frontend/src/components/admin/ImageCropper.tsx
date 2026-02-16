"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Minus, Plus, Check, RotateCw } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
    initialAspect?: number;
    title?: string;
}

const ASPECT_RATIOS = [
    { label: "Square (1:1)", value: 1 / 1 },
    { label: "Classic (4:3)", value: 4 / 3 },
    { label: "Photo (3:2)", value: 3 / 2 },
    { label: "Wide (16:9)", value: 16 / 9 },
    { label: "Banner (1920:600)", value: 1920 / 600 },
];

export const ImageCropper: React.FC<ImageCropperProps> = ({
    image,
    onCropComplete,
    onCancel,
    initialAspect = 4 / 3,
    title = "Crop Image"
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(initialAspect);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        rotation = 0
    ): Promise<File | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const rotRad = (rotation * Math.PI) / 180;
        const { width: bBoxWidth, height: bBoxHeight } = getRadianChatSize(
            image.width,
            image.height,
            rotRad
        );

        // Set canvas size to the bounding box of the rotated image
        canvas.width = bBoxWidth;
        canvas.height = bBoxHeight;

        // Origin at the center of the canvas
        ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
        ctx.rotate(rotRad);
        ctx.translate(-image.width / 2, -image.height / 2);

        // Draw rotated image
        ctx.drawImage(image, 0, 0);

        // Create a temporary canvas for the final cropped output
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) return null;

        croppedCanvas.width = pixelCrop.width;
        croppedCanvas.height = pixelCrop.height;

        // Draw the cropped portion from the transformed canvas
        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            croppedCanvas.toBlob((blob) => {
                if (!blob) return resolve(null);
                const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    };

    const getRadianChatSize = (width: number, height: number, rotation: number) => {
        const cos = Math.abs(Math.cos(rotation));
        const sin = Math.abs(Math.sin(rotation));
        return {
            width: width * cos + height * sin,
            height: width * sin + height * cos,
        };
    };

    const handleCrop = async () => {
        try {
            const croppedFile = await getCroppedImg(image, croppedAreaPixels, rotation);
            if (croppedFile) {
                onCropComplete(croppedFile);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-[90vw] w-[1000px] p-0 gap-0 overflow-hidden bg-[#FAF9F6] border-none shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1DA]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif text-[#4A3728] flex items-center gap-2">
                            <span className="p-1 border border-[#4A3728]/20 rounded stroke-[1.5]">
                                <CropIcon className="w-5 h-5" />
                            </span>
                            {title}
                        </DialogTitle>
                    </DialogHeader>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-[#E5E1DA] rounded-full transition-colors text-[#4A3728]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cropper Main Area */}
                <div className="relative w-full h-[60vh] bg-[#121212]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        showGrid={true}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        classes={{
                            containerClassName: "bg-[#121212]",
                            mediaClassName: "bg-[#121212]",
                            cropAreaClassName: "border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                        }}
                    />
                </div>

                {/* Footer Area */}
                <div className="p-6 space-y-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-4">
                            <Minus className="w-5 h-5 text-[#8B735B]" />
                            <div className="flex-1 px-2">
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    onValueChange={(value) => setZoom(value[0])}
                                    className="[&>[role=slider]]:bg-[#8B4513] [&>[role=slider]]:border-[#8B4513] [&>.relative>.absolute]:bg-[#8B735B]/30"
                                />
                            </div>
                            <Plus className="w-5 h-5 text-[#8B735B]" />
                            <span className="text-sm font-medium w-16 text-[#4A3728]">
                                Zoom: {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        {/* Rotation Controls */}
                        <div className="flex items-center gap-4">
                            <RotateCw className="w-5 h-5 text-[#8B735B]" />
                            <div className="flex-1 px-2">
                                <Slider
                                    value={[rotation]}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onValueChange={(value) => setRotation(value[0])}
                                    className="[&>[role=slider]]:bg-[#8B4513] [&>[role=slider]]:border-[#8B4513] [&>.relative>.absolute]:bg-[#8B735B]/30"
                                />
                            </div>
                            <span className="text-sm font-medium w-16 text-[#4A3728]">
                                Rot: {rotation}°
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
                        {/* Aspect Ratio Options */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#4A3728] mr-2">Aspect Ratio:</span>
                            <div className="flex flex-wrap gap-2">
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => setAspect(ratio.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${Math.abs(aspect - ratio.value) < 0.01
                                            ? "bg-[#8B4513] text-white shadow-md"
                                            : "bg-[#F3EFEC] text-[#4A3728] hover:bg-[#E5E1DA] border border-[#E5E1DA]"
                                            }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                className="px-8 h-12 rounded-xl border-[#8B735B] text-[#8B735B] hover:bg-[#F3EFEC]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCrop}
                                className="px-10 h-12 rounded-xl bg-[#8B4513] hover:bg-[#6F3710] text-white shadow-lg flex items-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Save Crop
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const CropIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
        <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
);
