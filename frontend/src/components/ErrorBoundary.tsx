import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-v3-background">
                    <div className="text-center p-8">
                        <h1 className="text-4xl font-bold text-v3-primary mb-4">Something went wrong</h1>
                        <p className="text-v3-secondary mb-6">An unexpected error occurred.</p>
                        <button
                            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
                            className="px-6 py-3 bg-v3-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            Go home
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
