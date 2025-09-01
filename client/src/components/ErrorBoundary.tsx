import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from 'antd';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Chart error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <Alert
                        message="Chart Loading Error"
                        description="Unable to render chart. Please refresh the page or try again later."
                        type="error"
                        showIcon
                        style={{ margin: '20px 0' }}
                    />
                )
            );
        }

        return this.props.children;
    }
}