import { useState } from 'react';

export function UploadArea() {
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
                    isDragOver
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60'
                }`}
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Cloud Upload Icon */}
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center shadow-inner border border-slate-700">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    
                    <div>
                        <p className="text-lg font-semibold text-slate-200">
                            Drag & drop PDFs here
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Only PDF files are supported
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-slate-700"></div>
                        <span className="text-xs text-slate-500 font-medium">OR</span>
                        <div className="h-px w-8 bg-slate-700"></div>
                    </div>

                    <label className="relative inline-block group">
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/10 transition-all duration-300 inline-block group-hover:scale-102">
                            Browse Files
                        </span>
                    </label>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-6 glass rounded-2xl p-5 border border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex justify-between items-center">
                        <span>Selected Files ({files.length}):</span>
                        <button 
                            onClick={() => setFiles([])} 
                            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                        >
                            Clear All
                        </button>
                    </h3>
                    <ul className="space-y-2">
                        {files.map((file, i) => (
                            <li key={i} className="flex items-center justify-between text-sm text-slate-300 bg-slate-800/60 border border-slate-800/80 px-4 py-2.5 rounded-xl hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-2 overflow-hidden pr-4">
                                    <span className="text-base">📄</span>
                                    <span className="truncate font-medium">{file.name}</span>
                                    <span className="text-xs text-slate-500 shrink-0">
                                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeFile(i)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
