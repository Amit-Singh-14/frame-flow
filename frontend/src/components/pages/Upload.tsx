import React, { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileVideo, X, Play, Pause, Settings, Info, Check, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    ACCEPTED_FORMATS,
    APP_CONFIG,
    formatFileSize,
    OUTPUT_FORMATS,
    QUALITY_PRESETS,
    validateFile,
    type AcceptedFormat,
    type AcceptedQuality,
} from "@/utils/constants";
import api, { API_ENDPOINTS } from "@/services/api";
import { useMutation } from "@tanstack/react-query";

interface SelectedFile {
    file: File;
    preview: string;
    size: string;
}

interface ConversionSettings {
    quality: AcceptedQuality;
    format: AcceptedFormat;
}

interface UploadResponse {
    job: {
        id: string;
    };
}

const UploadPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
        quality: "720p",
        format: "mp4",
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const file = acceptedFiles[0];

        if (!file && fileRejections) {
            setValidationError(fileRejections[0].errors[0].message);
            return;
        }
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
        maxSize: APP_CONFIG.MAX_FILE_SIZE,
    });

    const uploadMutation = useMutation<UploadResponse, Error, FormData>({
        mutationFn: async (formData: FormData) => {
            setIsUploading(true);
            setUploadResponse(null);
            setUploadProgress(0);
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
            setIsUploading(false);
            setUploadResponse(data);
            setUploadProgress(100);
        },
        onError: (error) => {
            console.error("Upload failed:", error);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadResponse(null);
        },
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        window.scrollTo({
            top: 0,
        });

        const formData = new FormData();
        formData.append("video", selectedFile.file);
        formData.append("quality", JSON.stringify(conversionSettings));

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
    console.log(selectedFile);

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                        <FileVideo className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                        Upload
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Transform your videos with professional quality conversion. Choose your preferred resolution and format for optimal results.
                    </p>
                </div>

                {/* Upload Success */}
                {uploadResponse && (
                    <Alert className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 border-emerald-500/30 backdrop-blur-sm">
                        <Check className="h-5 w-5 text-emerald-400" />
                        <AlertDescription className="space-y-4">
                            <div>
                                <p className="font-semibold text-emerald-100 text-lg">Upload Successful!</p>
                                <p className="text-emerald-200">Your video has been uploaded and queued for processing.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0">
                                    View Job Details <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 bg-transparent">
                                    All Jobs
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setUploadResponse(null);
                                        removeFile();
                                    }}
                                    className="text-emerald-300 hover:bg-emerald-500/10"
                                >
                                    Upload Another
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Validation Error */}
                {validationError && (
                    <Alert className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border-red-500/30 backdrop-blur-sm">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <AlertDescription className="text-red-200">{validationError}</AlertDescription>
                    </Alert>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                                        Processing your video...
                                    </span>
                                    <span className="text-slate-400 font-mono">{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-3 bg-slate-700" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">
                                        Quality: {conversionSettings.quality} • Format: {conversionSettings.format.toUpperCase()}
                                    </span>
                                    <span className="text-slate-500">Estimated time: 2-5 minutes</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Upload Area */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Dropzone */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                                        isDragActive
                                            ? "border-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                                            : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full">
                                            <Upload className="w-8 h-8 text-blue-400" />
                                        </div>
                                        {isDragActive ? (
                                            <div>
                                                <p className="text-blue-400 text-xl font-medium">Drop the video here...</p>
                                                <p className="text-slate-400">Release to upload</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedFile ? (
                                                    <p className="text-white text-xl font-medium">Change Uploaded video here</p>
                                                ) : (
                                                    <p className="text-white text-xl font-medium">Drag & drop your video here</p>
                                                )}
                                                <p className="text-slate-400">or click to browse files</p>
                                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                    {ACCEPTED_FORMATS.slice(0, 4).map((format) => (
                                                        <Badge key={format} variant="secondary" className="bg-slate-700 text-slate-300">
                                                            {format.toUpperCase()}
                                                        </Badge>
                                                    ))}
                                                    {ACCEPTED_FORMATS.length > 4 && (
                                                        <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                                                            +{ACCEPTED_FORMATS.length - 4} more
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-sm">Maximum file size: 100MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected File Preview */}
                        {selectedFile && (
                            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <span className="flex items-center">
                                            <FileVideo className="w-5 h-5 mr-3 text-blue-400" />
                                            Video Preview
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeFile}
                                            className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                                        <video
                                            id="preview-video"
                                            src={selectedFile.preview}
                                            className="w-full h-full object-contain"
                                            controls={false}
                                            onPlay={() => setIsVideoPlaying(true)}
                                            onPause={() => setIsVideoPlaying(false)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                            <Button
                                                size="lg"
                                                onClick={handleVideoToggle}
                                                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-white/20 rounded-full w-16 h-16"
                                            >
                                                {isVideoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-white font-medium truncate max-w-xs">{selectedFile.file.name}</p>
                                            <p className="text-slate-400 text-sm">Original file</p>
                                        </div>
                                        <Badge className="bg-slate-700 text-slate-300 border-slate-600">{selectedFile.size}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Settings Sidebar */}
                    <div className="space-y-6">
                        {/* Conversion Settings */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Settings className="w-5 h-5 mr-3 text-blue-400" />
                                    Conversion Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="quality" className="space-y-4">
                                    <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                                        <TabsTrigger value="quality" className="data-[state=active]:bg-slate-600">
                                            Quality
                                        </TabsTrigger>
                                        <TabsTrigger value="format" className="data-[state=active]:bg-slate-600">
                                            Format
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="quality" className="space-y-3">
                                        <RadioGroup
                                            value={conversionSettings.quality}
                                            onValueChange={(value) =>
                                                setConversionSettings((prev) => ({ ...prev, quality: value as AcceptedQuality }))
                                            }
                                        >
                                            {QUALITY_PRESETS.map((preset) => (
                                                <div key={preset.value} className="relative">
                                                    <Label
                                                        htmlFor={preset.value}
                                                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                            conversionSettings.quality === preset.value
                                                                ? "border-blue-500 bg-blue-500/10"
                                                                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
                                                        }`}
                                                    >
                                                        <RadioGroupItem value={preset.value} id={preset.value} />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-white">{preset.label}</span>
                                                                <preset.icon className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <p className="text-sm text-slate-400">{preset.description}</p>
                                                            <p className="text-xs text-slate-500">{preset.fileSize}</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </TabsContent>

                                    <TabsContent value="format" className="space-y-3">
                                        <RadioGroup
                                            value={conversionSettings.format}
                                            onValueChange={(value) => setConversionSettings((prev) => ({ ...prev, format: value as AcceptedFormat }))}
                                        >
                                            {OUTPUT_FORMATS.map((format) => (
                                                <div key={format.value} className="relative">
                                                    <Label
                                                        htmlFor={format.value}
                                                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                            conversionSettings.format === format.value
                                                                ? "border-blue-500 bg-blue-500/10"
                                                                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
                                                        }`}
                                                    >
                                                        <RadioGroupItem value={format.value} id={format.value} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-white">{format.label}</span>
                                                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                                                    .{format.value}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-slate-400">{format.description}</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Quick Info */}
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Info className="w-5 h-5 mr-3 text-blue-400" />
                                    Processing Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Max size:</span>
                                            <span className="text-white font-medium">100 MB</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Formats:</span>
                                            <span className="text-white font-medium">{ACCEPTED_FORMATS.length}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Quality:</span>
                                            <span className="text-white font-medium">{conversionSettings.quality}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Output:</span>
                                            <span className="text-white font-medium">{conversionSettings.format.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Processing typically takes 2-5 minutes depending on file size and selected quality.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upload Button */}
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 py-6 text-lg font-medium"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 mr-3" />
                                    Start Conversion
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
