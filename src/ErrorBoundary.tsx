import React, { PropsWithChildren } from "react";
import { ErrorViewer } from "./Error";

export interface ErrorBoundaryPros {
    height: number;
    width: number;
    content: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
    errorInfo: any;
}

export class ErrorBoundary extends React.Component<PropsWithChildren<ErrorBoundaryPros>, ErrorBoundaryState> {
    constructor(props: PropsWithChildren<ErrorBoundaryPros>) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null};
    }
  
    static getDerivedStateFromError(error) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true, error: error};
    }
  
    componentDidCatch(error, errorInfo) {
      // You can also log the error to an error reporting service
      this.setState({hasError: true, error: error, errorInfo: errorInfo});
    }
  
    render() {
      if (this.state.hasError) {
        // You can render any custom fallback UI
        return (<ErrorViewer error={this.state.error} height={this.props.height} width={this.props.width} json={this.props.content} />);
      }
  
      return this.props.children; 
    }
  }