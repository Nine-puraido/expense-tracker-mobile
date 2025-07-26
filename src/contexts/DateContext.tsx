import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Generate available years (current year and 10 years back)
  const availableYears = Array.from({ length: 11 }, (_, i) => currentYear - i);

  return (
    <DateContext.Provider value={{
      selectedYear,
      setSelectedYear,
      availableYears,
    }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};