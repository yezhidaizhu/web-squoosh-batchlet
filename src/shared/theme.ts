export type Theme = 'light' | 'dark';

export const themeStorageKey = 'vicoco-theme';

const themeColor: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#1b1a1d',
};

const isTheme = (value: string | null | undefined): value is Theme =>
  value === 'light' || value === 'dark';

export const themeInitScript = `(() => {
  let theme;
  try {
    theme = localStorage.getItem('${themeStorageKey}');
  } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '${themeColor.dark}' : '${themeColor.light}');
})();`;

export const getInitialTheme = (): Theme => {
  const documentTheme = document.documentElement.dataset.theme;
  if (isTheme(documentTheme)) return documentTheme;

  try {
    const storedTheme = localStorage.getItem(themeStorageKey);
    if (isTheme(storedTheme)) return storedTheme;
  } catch (_) {}

  return 'light';
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themeColor[theme]);
};

export const storeTheme = (theme: Theme) => {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (_) {}
};
