import {
  Brush,
  Eraser,
  PaintBucket,
  Hand,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Type as TypeIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Palette,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Sun,
  Moon,
  User,
  LogOut,
  Home,
  Library,
  Search,
  Heart,
  Share,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Star,
  Lock,
  Unlock,
  Check,
  Grid3X3,
  List,
  Layers,
  FolderOpen,
  Pipette,
  Ruler,
  BookOpen,
  Package,
  Loader2,
  type LucideIcon,
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  // Drawing tools
  brush: Brush,
  eraser: Eraser,
  paintBucket: PaintBucket,
  hand: Hand,
  text: TypeIcon,
  
  // Actions
  undo: Undo,
  redo: Redo,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  rotateLeft: RotateCcw,
  rotateRight: RotateCw,
  flipHorizontal: FlipHorizontal,
  flipVertical: FlipVertical,
  move: Move,
  
  // Shapes
  square: Square,
  circle: Circle,
  triangle: Triangle,
  star: Star,
  heart: Heart,
  
  // File
  download: Download,
  upload: Upload,
  save: Save,
  load: FolderOpen,
  loader: Loader2,
  
  // UI
  settings: Settings,
  palette: Palette,
  eyeDropper: Pipette,
  ruler: Ruler,
  grid: Grid3X3,
  list: List,
  layers: Layers,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  search: Search,
  bookOpen: BookOpen,
  packageOpen: Package,
  
  // Media
  play: Play,
  pause: Pause,
  
  // Navigation
  home: Home,
  library: Library,
  user: User,
  logOut: LogOut,
  menu: Menu,
  share: Share,
  moreHorizontal: MoreHorizontal,
  
  // Theme
  sun: Sun,
  moon: Moon,
  
  // Custom icons
  insideLines: ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}
