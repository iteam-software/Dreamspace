import React, { useContext } from "react";

export type ErrorContextType = {
  dispatch(error: string): void;
  reset(): void;
};

const DEFAULT_ERROR_CONTEXT: ErrorContextType = {
  dispatch: () => {},
  reset: () => {},
};

export const ErrorContext = React.createContext<ErrorContextType>(
  DEFAULT_ERROR_CONTEXT,
);

export function useErrors() {
  const context = useContext(ErrorContext);
  return context;
}
