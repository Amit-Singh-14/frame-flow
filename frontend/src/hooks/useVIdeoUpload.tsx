const uploadMutation = useMutation<UploadResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
        setStep("process");
        setIsUploading(true);
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
