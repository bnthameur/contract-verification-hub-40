
import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = 'light' | 'dark' | 'pure-black' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isPureBlack: boolean;
  togglePureBlack: () => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isPureBlack: false,
  togglePureBlack: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(
    () => (localStorage.getItem(storageKey) as ThemeMode) || defaultTheme
  );
  const [isPureBlack, setIsPureBlack] = useState<boolean>(
    () => localStorage.getItem("pure-black-mode") === "true"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark", "pure-black");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      if (isPureBlack && systemTheme === "dark") {
        root.classList.add("pure-black");
      }
      return;
    }
    
    root.classList.add(theme);
    if (isPureBlack && theme === "dark") {
      root.classList.add("pure-black");
    }
  }, [theme, isPureBlack]);

  const togglePureBlack = () => {
    const newPureBlack = !isPureBlack;
    localStorage.setItem("pure-black-mode", newPureBlack.toString());
    setIsPureBlack(newPureBlack);
  };

  const value = {
    theme,
    setTheme: (theme: ThemeMode) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    isPureBlack,
    togglePureBlack,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
    
  return context;
};
