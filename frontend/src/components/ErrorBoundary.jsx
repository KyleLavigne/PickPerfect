import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Save stack trace for debugging
        this.setState({ error, info });
        // Also log to console
        // eslint-disable-next-line no-console
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        const { error, info } = this.state;
        if (error) {
            return (
                <div className="min-h-screen p-6">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                    <div className="mb-4 rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
                        <pre style={{ whiteSpace: "pre-wrap" }}>
                            {String(error && error.message ? error.message : String(error))}
                        </pre>
                        {info?.componentStack && (
                            <details className="mt-2 text-xs text-neutral-400">
                                <summary>Stack</summary>
                                <pre style={{ whiteSpace: "pre-wrap" }}>{info.componentStack}</pre>
                            </details>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
