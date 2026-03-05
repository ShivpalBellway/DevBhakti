"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Check, RotateCw, ZoomIn, Crop as CropIcon } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (file: File) => void;
    onCancel: () => void;
    initialAspect?: number;
    title?: string;
    lockAspect?: boolean;
}

const ASPECT_RATIOS = [
    { label: "1:1", value: 1 / 1 },
    { label: "3:2", value: 3 / 2 },
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
    { label: "Banner (1920:600)", value: 1920 / 600 },
];

export function ImageCropper({
    image,
    onCropComplete,
    onCancel,
    initialAspect = 1,
    title = "Crop Image",
    lockAspect = false
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(initialAspect);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (lockAspect) {
            setAspect(initialAspect);
        }
    }, [initialAspect, lockAspect]);

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

    function getRadianChatSize(width: number, height: number, rotation: number) {
        const cos = Math.abs(Math.cos(rotation));
        const sin = Math.abs(Math.sin(rotation));
        return {
            width: width * cos + height * sin,
            height: width * sin + height * cos,
        };
    }

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        rotation = 0
    ): Promise<Blob | null> => {
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

        canvas.width = bBoxWidth;
        canvas.height = bBoxHeight;

        ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
        ctx.rotate(rotRad);
        ctx.translate(-image.width / 2, -image.height / 2);

        ctx.drawImage(image, 0, 0);

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) return null;

        croppedCanvas.width = pixelCrop.width;
        croppedCanvas.height = pixelCrop.height;

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
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const blob = await getCroppedImg(image, croppedAreaPixels, rotation);
            if (blob) {
                const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
                onCropComplete(file);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => !isLoading && onCancel()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF9F6]">
                <DialogHeader className="p-6 border-b border-[#E5E1DA]">
                    <DialogTitle className="flex items-center gap-2 text-[#4A3728]">
                        <CropIcon className="w-5 h-5 text-[#8B4513]" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        rotation={rotation}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropCompleteCallback}
                        classes={{
                            containerClassName: "bg-black",
                            mediaClassName: "bg-black",
                            cropAreaClassName: "border-2 border-white/50"
                        }}
                    />
                </div>

                <div className="p-6 bg-white border-t border-[#E5E1DA] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#4A3728] flex items-center gap-2">
                                    <ZoomIn className="w-4 h-4 text-[#8B735B]" /> Zoom
                                </span>
                                <span className="text-xs font-bold text-[#8B4513]">{Math.round(zoom * 100)}%</span>
                            </div>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.01}
                                onValueChange={([v]) => setZoom(v)}
                                className="cursor-pointer"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#4A3728] flex items-center gap-2">
                                    <RotateCw className="w-4 h-4 text-[#8B735B]" /> Rotation
                                </span>
                                <span className="text-xs font-bold text-[#8B4513]">{rotation}°</span>
                            </div>
                            <Slider
                                value={[rotation]}
                                min={0}
                                max={360}
                                step={1}
                                onValueChange={([v]) => setRotation(v)}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <span className="text-sm font-semibold text-[#4A3728]">Aspect Ratio</span>
                        <div className="flex flex-wrap gap-2">
                            {lockAspect ? (
                                <div className="h-9 px-4 rounded-lg bg-[#8B4513] text-white flex items-center text-sm font-medium">
                                    {ASPECT_RATIOS.find(r => Math.abs(r.value - aspect) < 0.01)?.label || "Locked"}
                                </div>
                            ) : (
                                ASPECT_RATIOS.map((r) => (
                                    <Button
                                        key={r.label}
                                        type="button"
                                        variant={Math.abs(aspect - r.value) < 0.01 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setAspect(r.value)}
                                        className={`h-9 px-4 rounded-lg transition-all ${Math.abs(aspect - r.value) < 0.01
                                            ? "bg-[#8B4513] text-white"
                                            : "text-[#4A3728] border-[#E5E1DA] hover:bg-[#F3EFEC]"
                                            }`}
                                    >
                                        {r.label}
                                    </Button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-6 h-11 rounded-xl border-[#8B735B] text-[#8B735B] hover:bg-[#F3EFEC]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-8 h-11 rounded-xl bg-[#8B4513] hover:bg-[#6F3710] text-white shadow-lg flex items-center gap-2 min-w-[120px]"
                        >
                            {isLoading ? (
                                <RotateCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Save Crop
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
): Promise<Blob | null> => {
    // This is redundant but kept to match the structure if needed externally, 
    // actually it's better defined inside or passed as helper.
    // I already defined it inside for simplicity.
    return null; // Not used as it's defined inside
};
