import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api, API_ENDPOINTS } from "@/services/api";
import { ROUTES } from "@/utils/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileVideo, X, Check, AlertCircle, Play, Pause, Settings, ArrowRight, Info } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "@radix-ui/react-progress";

interface SelectedFile {
    file: File;
    preview: string;
    size: string;
}

interface ConversionSettings {
    quality: "1080p" | "720p" | "480p";
}

interface UploadResponse {
    success: boolean;
    file: {
        originalName: string;
        filename: string;
        path: string;
        size: number;
        mimetype: string;
        formattedSize: string;
    };
    job: {
        id: string;
        status: string;
        input_file: string;
        created_at: string;
        file_size: number;
        conversion_settings: any;
        statusDescription: string;
        estimatedCompletion: string;
        progress: number;
        healthStatus: string;
        canRetry: boolean;
        canCancel: boolean;
        priority: string;
        progressMessage: string;
    };
    queue: any;
    metadata: {
        uploadedAt: string;
        userId: string;
        jobCreated: boolean;
        queuedForProcessing: boolean;
    };
}

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
        quality: "720p",
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const ACCEPTED_FORMATS = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    const validateFile = (file: File): string | null => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (!fileExtension || !ACCEPTED_FORMATS.includes(fileExtension)) {
            return `File format not supported. Please use: ${ACCEPTED_FORMATS.join(", ")}`;
        }

        if (file.size > MAX_FILE_SIZE) {
            return "File size must be less than 100MB";
        }

        return null;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const error = validateFile(file);
        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError(null);
        const preview = URL.createObjectURL(file);
        setSelectedFile({
            file,
            preview,
            size: formatFileSize(file.size),
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "video/*": ACCEPTED_FORMATS.map((format) => `.${format}`),
        },
        multiple: false,
        maxSize: MAX_FILE_SIZE,
    });

    const uploadMutation = useMutation<UploadResponse, Error, FormData>({
        mutationFn: async (formData: FormData) => {
            const response = await api.post(API_ENDPOINTS.upload, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            setUploadResponse(data);
            setUploadProgress(100);
        },
        onError: (error) => {
            console.error("Upload failed:", error);
            setUploadProgress(0);
        },
    });

    const handleUpload = () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("video", selectedFile.file);
        formData.append("quality", conversionSettings.quality);

        uploadMutation.mutate(formData);
    };

    const removeFile = () => {
        if (selectedFile?.preview) {
            URL.revokeObjectURL(selectedFile.preview);
        }
        setSelectedFile(null);
        setValidationError(null);
        setUploadProgress(0);
        setUploadResponse(null);
    };

    const handleVideoToggle = () => {
        const video = document.getElementById("preview-video") as HTMLVideoElement;
        if (video) {
            if (isVideoPlaying) {
                video.pause();
            } else {
                video.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Upload Video</h1>
                    <p className="text-gray-400 text-lg">Convert your videos to different qualities</p>
                </div>

                {/* Upload Success */}
                {uploadResponse && (
                    <Alert className="bg-green-900/20 border-green-500/30 text-green-200">
                        <Check className="h-4 w-4 text-green-400" />
                        <AlertDescription className="space-y-3">
                            <div>
                                <p className="font-medium">Upload Successful!</p>
                                <p className="text-sm text-green-300">Your video has been uploaded and queued for processing.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => navigate(ROUTES.JOB_DETAIL(uploadResponse.job.id))}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    View Job Details
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(ROUTES.JOBS)}
                                    className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                                >
                                    All Jobs
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setUploadResponse(null);
                                        removeFile();
                                    }}
                                    className="text-green-300 hover:bg-green-500/10"
                                >
                                    Upload Another
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Validation Error */}
                {validationError && (
                    <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                )}

                {/* Upload Error */}
                {uploadMutation.isError && (
                    <Alert className="bg-red-900/20 border-red-500/30 text-red-200">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription>Upload failed. Please try again.</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dropzone */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="p-6">
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
                                        isDragActive ? "border-blue-400 bg-blue-500/10" : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    {isDragActive ? (
                                        <p className="text-blue-400 text-lg">Drop the video here...</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-white text-lg">Drag & drop your video here, or click to select</p>
                                            <p className="text-gray-400 text-sm">Supports: {ACCEPTED_FORMATS.join(", ")} (max 100MB)</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected File Preview */}
                        {selectedFile && (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <span className="flex items-center">
                                            <FileVideo className="w-5 h-5 mr-2 text-blue-400" />
                                            File Preview
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeFile}
                                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                        <video
                                            id="preview-video"
                                            src={selectedFile.preview}
                                            className="w-full h-full object-contain"
                                            controls={false}
                                            onPlay={() => setIsVideoPlaying(true)}
                                            onPause={() => setIsVideoPlaying(false)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleVideoToggle}
                                                className="bg-black/50 hover:bg-black/70 text-white"
                                            >
                                                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">{selectedFile.file.name}</span>
                                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                            {selectedFile.size}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upload Progress */}
                        {uploadMutation.isPending && (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-medium">Uploading...</span>
                                            <span className="text-gray-400">{uploadProgress}%</span>
                                        </div>
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-gray-400 text-sm">Please don't close this page while uploading.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Settings Sidebar */}
                    <div className="space-y-6">
                        {/* Conversion Settings */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-blue-400" />
                                    Conversion Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-3 block">Output Quality</label>
                                    <div className="space-y-2">
                                        {["1080p", "720p", "480p"].map((quality) => (
                                            <button
                                                key={quality}
                                                onClick={() => setConversionSettings({ quality: quality as any })}
                                                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                                    conversionSettings.quality === quality
                                                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                                        : "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700/50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{quality}</span>
                                                    {conversionSettings.quality === quality && <Check className="w-4 h-4 text-blue-400" />}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {quality === "1080p" && "High quality (1920×1080)"}
                                                    {quality === "720p" && "Standard quality (1280×720)"}
                                                    {quality === "480p" && "Basic quality (854×480)"}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upload Info */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Info className="w-5 h-5 mr-2 text-blue-400" />
                                    Upload Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Max file size:</span>
                                    <span className="text-white">100 MB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Supported formats:</span>
                                    <span className="text-white">{ACCEPTED_FORMATS.length} types</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Processing time:</span>
                                    <span className="text-white">~2-5 minutes</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upload Button */}
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploadMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400 py-6 text-lg"
                        >
                            {uploadMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 mr-2" />
                                    Start Upload
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
