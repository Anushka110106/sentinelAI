export const mockGetDocuments = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        data: {
            documents: [
                {
                    id: 'doc1',
                    filename: 'Adaptive_Beamforming_Survey.pdf',
                    upload_timestamp: new Date(Date.now() - 86400000).toISOString(),
                    total_pages: 45,
                    status: 'indexed'
                },
                {
                    id: 'doc2',
                    filename: 'MIMO_Systems_Overview.pdf',
                    upload_timestamp: new Date(Date.now() - 172800000).toISOString(),
                    total_pages: 32,
                    status: 'indexed'
                },
                {
                    id: 'doc3',
                    filename: 'Signal_Processing_Algorithms.pdf',
                    upload_timestamp: new Date(Date.now() - 259200000).toISOString(),
                    total_pages: 58,
                    status: 'indexed'
                }
            ]
        }
    };
};

export default {
    mockGetDocuments,
};
