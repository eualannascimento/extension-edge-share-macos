export interface IconPathSet {
  [size: number]: string;
  16: string;
  48: string;
  128: string;
}

export function iconPathsForTheme(isDark: boolean): IconPathSet {
  const folder = isDark ? "white" : "dark";
  return {
    16: `icons/${folder}/icon-16.png`,
    48: `icons/${folder}/icon-48.png`,
    128: `icons/${folder}/icon-128.png`,
  };
}
