import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("Oops! Something went wrong")).toBeTruthy();
    expect(getByText("We encountered an unexpected error. Please try again.")).toBeTruthy();
  });

  it('should render custom fallback UI when provided', () => {
    const CustomFallback = <Text>Custom error message</Text>;
    
    const { getByText } = render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onErrorMock = jest.fn();
    
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error state when retry button is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText("Oops! Something went wrong")).toBeTruthy();

    // Press retry button
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    // Error UI should be hidden (component would re-render)
    expect(queryByText("Oops! Something went wrong")).toBeFalsy();
  });

  it('should show debug info in development mode', () => {
    // Mock __DEV__ to be true
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Debug Info:')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();

    // Restore original __DEV__
    (global as any).__DEV__ = originalDev;
  });
});