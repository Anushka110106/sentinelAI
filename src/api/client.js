import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(request => {
    console.log('Making request to:', request.url);
    return request;
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

// ============================================
// DOCUMENT MANAGEMENT ENDPOINTS
// ============================================

export const uploadDocuments = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });
    
    return apiClient.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
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
    return apiClient.post('/query', {
        question,
        top_k: topK,
    });
};

export const getChatHistory = async () => {
    return apiClient.get('/chat-history');
};

export const clearChatHistory = async () => {
    return apiClient.post('/chat-history/clear');
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
