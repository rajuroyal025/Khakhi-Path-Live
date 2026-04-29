import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "કંઈક ખોટું થયું છે. કૃપા કરીને પછીથી પ્રયાસ કરો.";
      
      try {
        const errorData = JSON.parse(this.state.error?.message || '{}');
        if (errorData.error && errorData.error.includes('Requested entity was not found')) {
          errorMessage = "Firebase કન્ફિગરેશનમાં ભૂલ છે. કૃપા કરીને સેટિંગ્સ તપાસો.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center space-y-6 border border-slate-200">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">ભૂલ આવી છે</h2>
            <p className="text-slate-600 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all"
            >
              ફરીથી પ્રયાસ કરો
            </button>
            {this.state.error && (
              <details className="text-left text-xs text-slate-400 mt-4">
                <summary className="cursor-pointer hover:text-slate-600 transition-colors">ટેકનિકલ વિગતો</summary>
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
