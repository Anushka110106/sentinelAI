import { Component } from 'react';
import { AlertTriangle, RefreshCw } from './Icons';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[SentinelAI] Component Error:', error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="glass-card p-10 text-center max-w-md">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="w-6 h-6 text-rose-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
                        <p className="text-sm text-white/50 mb-6 leading-relaxed">
                            An unexpected error occurred in this component. This has been logged.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 rounded-xl text-sm font-medium text-white/80 transition-all duration-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
