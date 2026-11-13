export interface DesktopItem {
  id: number;
  title: string;
  type: 'project' | 'pdf';
  icon?: string;
  gridPos: { col: number; row: number };
  content: {
    url?: string;     // External project link
    pdfPath?: string; // E.g., "/resume.pdf"
  };
}

export const TOTAL_COLS = 14;
export const TOTAL_ROWS = 7;
export const RESERVED_CELLS = new Set(['5-6', '6-6', '7-6', '8-6']);

export const INITIAL_ITEMS: DesktopItem[] = [
  {
    id: 1,
    title: 'Resume.pdf',
    type: 'pdf',
    gridPos: { col: 0, row: 0 },
    content: { pdfPath: '/resume.pdf' },
  },
  {
    id: 2,
    title: 'White Board',
    type: 'project',
    icon : '/projectIcon/drawApp.svg',
    gridPos: { col: 0, row: 1 },
    content: { url: 'https://draw-app-web-six.vercel.app/' },
  },
  {
    id: 3,
    title: 'URL Shortener',
    type: 'project',
    icon : '/projectIcon/urlshortener.svg',
    gridPos: { col: 0, row: 2 },
    content: { url: 'https://urlshortenerapp-lake.vercel.app/' },
  },
  {
    id: 4,
    title: 'Brainly',
    type: 'project',
    icon : '/projectIcon/brainly.png',
    gridPos: { col: 1, row: 0 },
    content: { url: 'https://brainly-snowy.vercel.app/' },
  },
  {
    id: 5,
    title: 'Rubiks Cube',
    type: 'project',
    icon : '/projectIcon/rubiksCube.png',
    gridPos: { col: 1, row: 1 },
    content: { url: 'https://rubikscube-azure.vercel.app/' },
  },
  {
    id: 6,
    title: 'Hunter Maze',
    type: 'project',
    icon : '/projectIcon/hunter-maze.png',
    gridPos: { col: 1, row: 2 },
    content: { url: 'https://hunter-maze.vercel.app/' },
  },
  {
    id: 7,
    title: 'Snake Game',
    type: 'project',
    icon : '/projectIcon/snakeGame.svg',
    gridPos: { col: 2, row: 0 },
    content: { url: 'https://snake-game-phi-five-30.vercel.app/' },
  },
];