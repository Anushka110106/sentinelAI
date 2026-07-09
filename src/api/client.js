const API_BASE = 'http://localhost:8000/api';

const request = async (path, { method = 'GET', body, headers = {}, isFormData = false } = {}) => {
    const options = {
        method,
        headers,
    };

    if (body !== undefined) {
        options.body = body;
    }

    if (!isFormData) {
        options.headers = {
            'Content-Type': 'application/json',
            ...headers,
        };
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

    if (!response.ok) {
        const error = new Error(data?.detail || 'Request failed');
        error.response = { status: response.status, data };
        throw error;
    }

    return { data };
};

export const apiClient = {
    get: (path, config) => request(path, { ...config, method: 'GET' }),
    post: (path, body, config) => request(path, { ...config, method: 'POST', body }),
    delete: (path, config) => request(path, { ...config, method: 'DELETE' }),
};

// ============================================
// DOCUMENT MANAGEMENT ENDPOINTS
// ============================================

export const uploadDocuments = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });

    return apiClient.post('/upload', formData, {
        isFormData: true,
    });
};

export const getDocuments = async () => {
    return apiClient.get('/documents');
};

export const deleteDocument = async (docId) => {
    return apiClient.delete(`/documents/${docId}`);
};

// ============================================
// QUERY & CHAT ENDPOINTS (Module 1)
// ============================================

export const query = async (question, topK = 5) => {
    return apiClient.post('/query', JSON.stringify({
        question,
        top_k: topK,
    }));
};

export const getChatHistory = async () => {
    return apiClient.get('/chat-history');
};

export const clearChatHistory = async () => {
    return apiClient.post('/chat-history/clear', undefined);
};

// ============================================
// ANALYSIS ENDPOINTS (Modules 2, 3, 4)
// ============================================

export const getContradictions = async () => {
    return apiClient.get('/contradictions');
};

export const getGaps = async () => {
    return apiClient.get('/gaps');
};

export const getGraphData = async () => {
    return apiClient.get('/graph-data');
};

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

export const checkHealth = async () => {
    return apiClient.get('/health');
};

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

export const getErrorMessage = (error) => {
    if (error.response?.data?.detail) {
        return error.response.data.detail;
    }
    if (error.message === 'Network Error') {
        return 'Cannot connect to backend. Is the server running?';
    }
    if (error.message.includes('timeout')) {
        return 'Request timed out. The server may be busy.';
    }
    return error.message || 'An unexpected error occurred';
};

export const isBackendReachable = async () => {
    try {
        await checkHealth();
        return true;
    } catch (error) {
        return false;
    }
};

export default apiClient;
