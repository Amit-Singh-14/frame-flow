import React, { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileVideo, X, Zap, Minimize2, Monitor, Clock, Package, Check, AlertCircle, ArrowRight, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Job Types Configuration
const BASIC_JOB_TYPES = ["transcode", "compress", "resize", "change-framerate", "convert-container"] as const;
export type JobType = (typeof BASIC_JOB_TYPES)[number];

const JOB_TYPE_CONFIG = {
    transcode: {
        label: "Transcode",
        description: "Convert to different codec",
        icon: Zap,
        badge: "Popular",
        color: "blue",
        estimatedTime: "3-8 min",
        options: [
            { value: "h264", label: "H.264 (AVC)", description: "Most compatible" },
            { value: "h265", label: "H.265 (HEVC)", description: "Better compression" },
            { value: "vp9", label: "VP9", description: "Web optimized" },
            { value: "av1", label: "AV1", description: "Latest codec" },
        ],
    },
    compress: {
        label: "Compress",
        description: "Reduce file size",
        icon: Minimize2,
        badge: "Fast",
        color: "green",
        estimatedTime: "2-5 min",
        options: [
            { value: "low", label: "Light", description: "25-35% reduction" },
            { value: "medium", label: "Medium", description: "40-55% reduction" },
            { value: "high", label: "Strong", description: "60-75% reduction" },
            { value: "maximum", label: "Max", description: "75-85% reduction" },
        ],
    },
    resize: {
        label: "Resize",
        description: "Change resolution",
        icon: Monitor,
        badge: "Precise",
        color: "purple",
        estimatedTime: "2-6 min",
        options: [
            { value: "2160p", label: "4K", description: "3840×2160" },
            { value: "1440p", label: "2K", description: "2560×1440" },
            { value: "1080p", label: "Full HD", description: "1920×1080" },
            { value: "720p", label: "HD", description: "1280×720" },
            { value: "480p", label: "SD", description: "854×480" },
        ],
    },
    "change-framerate": {
        label: "Frame Rate",
        description: "Adjust playback speed",
        icon: Clock,
        badge: "Smooth",
        color: "orange",
        estimatedTime: "4-10 min",
        options: [
            { value: "24", label: "24 FPS", description: "Cinematic" },
            { value: "30", label: "30 FPS", description: "Standard" },
            { value: "60", label: "60 FPS", description: "Smooth" },
            { value: "120", label: "120 FPS", description: "Ultra smooth" },
        ],
    },
    "convert-container": {
        label: "Format",
        description: "Change file format",
        icon: Package,
        badge: "Quick",
        color: "indigo",
        estimatedTime: "30s-2 min",
        options: [
            { value: "mp4", label: "MP4", description: "Most compatible" },
            { value: "mkv", label: "MKV", description: "High quality" },
            { value: "webm", label: "WebM", description: "Web optimized" },
            { value: "mov", label: "MOV", description: "Apple format" },
        ],
    },
};

const ACCEPTED_FORMATS = ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface SelectedFile {
    file: File;
    preview: string;
    size: string;
}

interface UploadResponse {
    job: {
        id: string;
    };
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
        return "File size exceeds 100MB limit";
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_FORMATS.includes(extension)) {
        return `Unsupported format. Accepted formats: ${ACCEPTED_FORMATS.join(", ")}`;
    }
    return null;
};

const UploadPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [selectedJobType, setSelectedJobType] = useState<JobType>("transcode");
    const [selectedJobOption, setSelectedJobOption] = useState<string>("h264");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [, setIsUploading] = useState(false);
    const [step, setStep] = useState<"upload" | "configure" | "process">("upload");

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const file = acceptedFiles[0];

        if (!file && fileRejections.length > 0) {
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
        setStep("configure");
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "video/*": ACCEPTED_FORMATS.map((format) => `.${format}`),
        },
        multiple: false,
        maxSize: MAX_FILE_SIZE,
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        setStep("process");
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + Math.random() * 10;
            });
        }, 200);

        // Simulate API call
        setTimeout(() => {
            clearInterval(interval);
            setUploadProgress(100);
            setIsUploading(false);
            setUploadResponse({
                job: {
                    id: `job_${Date.now()}`,
                },
            });
        }, 3000);
    };

    const removeFile = () => {
        if (selectedFile?.preview) {
            URL.revokeObjectURL(selectedFile.preview);
        }
        setSelectedFile(null);
        setValidationError(null);
        setUploadProgress(0);
        setUploadResponse(null);
        setStep("upload");
    };

    const handleJobTypeChange = (jobType: JobType) => {
        setSelectedJobType(jobType);
        setSelectedJobOption(JOB_TYPE_CONFIG[jobType].options[0].value);
    };

    const colors = {
        blue: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
        green: { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-400" },
        purple: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400" },
        orange: { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-400" },
        indigo: { bg: "bg-indigo-500/20", border: "border-indigo-500", text: "text-indigo-400" },
    } as const;

    type SupportedColor = keyof typeof colors;
    type Variant = keyof (typeof colors)["blue"];

    const getColorClasses = (color: SupportedColor, variant: Variant = "bg") => {
        return colors[color]?.[variant] || colors.blue[variant];
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
                <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step === "upload" ? "bg-blue-500 text-white" : selectedFile ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300"
                    }`}
                >
                    1
                </div>
                <div className={`w-12 h-0.5 ${selectedFile ? "bg-green-500" : "bg-gray-600"}`} />
                <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step === "configure"
                            ? "bg-blue-500 text-white"
                            : step === "process" || uploadResponse
                            ? "bg-green-500 text-white"
                            : "bg-gray-600 text-gray-300"
                    }`}
                >
                    2
                </div>
                <div className={`w-12 h-0.5 ${step === "process" || uploadResponse ? "bg-green-500" : "bg-gray-600"}`} />
                <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        uploadResponse ? "bg-green-500 text-white" : step === "process" ? "bg-blue-500 text-white" : "bg-gray-600 text-gray-300"
                    }`}
                >
                    3
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                        <FileVideo className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Video Processor</h1>
                    <p className="text-slate-400 max-w-md mx-auto">Transform your videos with professional-grade processing tools</p>
                </div>

                <StepIndicator />

                {/* Alerts */}
                {uploadResponse && (
                    <Alert className="mb-6 bg-green-900/30 border-green-500/30">
                        <Check className="h-4 w-4 text-green-400" />
                        <AlertDescription className="text-green-100">
                            <div className="font-semibold mb-1">Processing Complete!</div>
                            <div className="text-green-200 text-sm mb-3">
                                Your video has been successfully processed with {JOB_TYPE_CONFIG[selectedJobType].label}.
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    Download <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setUploadResponse(null);
                                        removeFile();
                                    }}
                                    className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                                >
                                    Process Another
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {validationError && (
                    <Alert className="mb-6 bg-red-900/30 border-red-500/30">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">{validationError}</AlertDescription>
                    </Alert>
                )}

                {/* Main Content */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                        {step === "upload" && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-white mb-2">Upload Your Video</h2>
                                    <p className="text-slate-400 text-sm">Choose a video file to get started</p>
                                </div>

                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                                        isDragActive
                                            ? "border-blue-400 bg-blue-500/10"
                                            : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 rounded-full">
                                            <Upload className="w-8 h-8 text-slate-400" />
                                        </div>
                                        {isDragActive ? (
                                            <div>
                                                <p className="text-blue-400 text-lg font-medium">Drop your video here</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-white text-lg font-medium">Drag & drop your video</p>
                                                <p className="text-slate-400">or click to browse your files</p>
                                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                    {ACCEPTED_FORMATS.slice(0, 4).map((format) => (
                                                        <Badge key={format} variant="secondary" className="bg-slate-700 text-slate-300">
                                                            {format.toUpperCase()}
                                                        </Badge>
                                                    ))}
                                                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                                                        +{ACCEPTED_FORMATS.length - 4} more
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-500 text-sm mt-3">Maximum file size: 100MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "configure" && selectedFile && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Configure Processing</h2>
                                        <p className="text-slate-400 text-sm">Choose how you want to process your video</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={removeFile} className="text-slate-400 hover:text-white">
                                        <X className="w-4 h-4 mr-1" /> Change File
                                    </Button>
                                </div>

                                {/* File Preview */}
                                <div className="bg-slate-900/50 rounded-lg p-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="aspect-video w-24 bg-black rounded overflow-hidden">
                                            <video src={selectedFile.preview} className="w-full h-full object-cover" muted />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{selectedFile.file.name}</p>
                                            <p className="text-slate-400 text-sm">{selectedFile.size}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Type Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white flex items-center">
                                        <Settings className="w-5 h-5 mr-2" />
                                        Processing Type
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {BASIC_JOB_TYPES.map((jobType) => {
                                            const config = JOB_TYPE_CONFIG[jobType];
                                            const IconComponent = config.icon;
                                            const isSelected = selectedJobType === jobType;

                                            return (
                                                <div
                                                    key={jobType}
                                                    onClick={() => handleJobTypeChange(jobType)}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                        isSelected
                                                            ? `${getColorClasses(config.color as SupportedColor, "border")} ${getColorClasses(
                                                                  config.color as SupportedColor,
                                                                  "bg"
                                                              )}`
                                                            : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/30"
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className={`p-2 rounded ${
                                                                isSelected ? getColorClasses(config.color as SupportedColor, "bg") : "bg-slate-700"
                                                            }`}
                                                        >
                                                            <IconComponent
                                                                className={`w-4 h-4 ${
                                                                    isSelected
                                                                        ? getColorClasses(config.color as SupportedColor, "text")
                                                                        : "text-slate-400"
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-white">{config.label}</span>
                                                                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                                                                    {config.badge}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-slate-400 text-sm">{config.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white">{JOB_TYPE_CONFIG[selectedJobType].label} Options</h3>
                                    <RadioGroup
                                        value={selectedJobOption}
                                        onValueChange={setSelectedJobOption}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                    >
                                        {JOB_TYPE_CONFIG[selectedJobType].options.map((option) => (
                                            <Label
                                                key={option.value}
                                                htmlFor={option.value}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                    selectedJobOption === option.value
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-slate-600 hover:border-slate-500"
                                                }`}
                                            >
                                                <RadioGroupItem value={option.value} id={option.value} />
                                                <div className="flex-1">
                                                    <span className="font-medium text-white">{option.label}</span>
                                                    <p className="text-slate-400 text-xs">{option.description}</p>
                                                </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <Button
                                    onClick={handleUpload}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Start Processing
                                </Button>
                            </div>
                        )}

                        {step === "process" && (
                            <div className="space-y-6 text-center">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">Processing Your Video</h2>
                                    <p className="text-slate-400 text-sm">
                                        {JOB_TYPE_CONFIG[selectedJobType].label} in progress • Estimated{" "}
                                        {JOB_TYPE_CONFIG[selectedJobType].estimatedTime}
                                    </p>
                                </div>

                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                                        {React.createElement(JOB_TYPE_CONFIG[selectedJobType].icon, { className: "w-8 h-8 text-white" })}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Progress</span>
                                            <span className="text-white font-mono">{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <Progress value={uploadProgress} className="h-2" />
                                    </div>

                                    <div className="text-sm text-slate-400">
                                        Processing with{" "}
                                        {JOB_TYPE_CONFIG[selectedJobType].options.find((opt) => opt.value === selectedJobOption)?.label}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UploadPage;
