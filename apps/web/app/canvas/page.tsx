'use client';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuthModal } from '@/components/auth/AuthModal';
import { useI18n } from '@/lib/i18n/provider';
import { useAuth } from '@/lib/auth/use-auth';
import { repo } from '@/lib/api/repository';
import { TemplatePicker, type TemplateItem } from '@/components/canvas/TemplatePicker';
import { getEntitlements, filterTemplatesForUser } from '@/lib/entitlements/client';
import { trackTemplateOpened, trackTemplateColored, trackTemplateSaved, trackRecentColorsCleared } from '@/lib/analytics/templateEvents';
import { saveTemplateWork, loadTemplateWork, saveCanvasPayload, loadCanvasPayload, moveCanvasPayload, type TemplateCanvasStateV2 } from '@/lib/learn/persistence';
import { enqueueOp } from '@/lib/sync/outbox';

// Dynamically import the DrawingCanvas component with SSR disabled
const DrawingCanvas = dynamic(
  () => import('@/components/canvas/DrawingCanvas').then((mod) => mod.DrawingCanvas),
  { ssr: false }
);

// Main component
export default function CanvasPage() {
  // Fill available viewport; recompute size on resize
  const [size, setSize] = useState({ width: 0, height: 0 });
  const STORAGE_KEY = 'lc_guest_canvas_v1';
  const [initialLines, setInitialLines] = useState<any[]>([]);
  const [initialTexts, setInitialTexts] = useState<any[]>([]);
  const saveTimer = useRef<number | null>(null);
  const latestPayloadRef = useRef<{ version: 2; lines: any[]; texts: any[] } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [template, setTemplate] = useState<null | TemplateItem>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [lastSavedPngPath, setLastSavedPngPath] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const { t } = useI18n();
  const { user } = useAuth();
  const userKey = user ? `lc_user_canvas_${user.id}` : null;
  // Brush toolbar state
  const [brushColor, setBrushColor] = useState<string>("#ffffff");
  const [brushSize, setBrushSize] = useState<number>(4);
  const [bgOpacity, setBgOpacity] = useState<number>(1); // 0..1
  const [showBackground, setShowBackground] = useState<boolean>(true);
  type CanvasTool = 'brush' | 'eraser' | 'fill' | 'line' | 'trace' | 'text' | 'pan';
  const toolHintKeys: Record<CanvasTool, string> = {
    brush: 'canvas.tools.brushHint',
    eraser: 'canvas.tools.eraserHint',
    fill: 'canvas.tools.fillHint',
    line: 'canvas.tools.lineHint',
    trace: 'canvas.tools.traceHint',
    text: 'canvas.tools.textHint',
    pan: 'canvas.tools.panHint',
  };
  const [tool, setTool] = useState<CanvasTool>('brush');
  const [fillOpacity, setFillOpacity] = useState<number>(1);
  const [clearCmdCounter, setClearCmdCounter] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [stayInsideLines, setStayInsideLines] = useState<boolean>(false);
  const [askBeforeClear, setAskBeforeClear] = useState<boolean>(true);
  const [undoCmdCounter, setUndoCmdCounter] = useState<number>(0);
  const [redoCmdCounter, setRedoCmdCounter] = useState<number>(0);
  const [ghostCmdCounter, setGhostCmdCounter] = useState<number>(0);
  const [saveCmdCounter, setSaveCmdCounter] = useState<number>(0);
  const [toolbarCollapsed, setToolbarCollapsed] = useState<boolean>(false);
  const [toolbarMounted, setToolbarMounted] = useState<boolean>(false);
  // Recent colors state (persisted)
  const RECENT_COLORS_KEY = 'lc_recent_colors';
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const addRecentColor = (c: string) => {
    try {
      // Normalize lowercase hex
      const color = c.toLowerCase();
      setRecentColors(prev => {
        const next = [color, ...prev.filter(x => x.toLowerCase() !== color)];
        return next.slice(0, 12);
      });
    } catch {}
  };
  // Non-linear size slider mapping (quadratic) for finer small-size control
  const SIZE_MIN = 1;
  const SIZE_MAX = 60;
  const sizeToSlider = (size: number) => {
    const t = Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));
    return Math.round(Math.sqrt(t) * 100);
  };
  const sliderToSize = (slider: number) => {
    const t = Math.max(0, Math.min(1, slider / 100));
    return Math.round(SIZE_MIN + (SIZE_MAX - SIZE_MIN) * (t * t));
  };
  const [sizeSlider, setSizeSlider] = useState<number>(sizeToSlider(brushSize));
  useEffect(() => {
    setSizeSlider(sizeToSlider(brushSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brushSize]);
  const search = useSearchParams();
  const paramPackId = search?.get('packId') ?? undefined;
  const paramTemplateId = search?.get('templateId') ?? undefined;

  // Temporary: cast Dialog components to any to work around React 19 JSX type mismatch
  const AnyDialog = Dialog as any;
  const AnyDialogContent = DialogContent as any;
  const AnyDialogHeader = DialogHeader as any;
  const AnyDialogTitle = DialogTitle as any;
  // Temporary: cast DrawingCanvas to any to work around React JSX type mismatch
  const AnyDrawingCanvas = DrawingCanvas as any;

  // Lightweight, black & white mock templates for guests when none exist in DB
  const mockTemplates: TemplateItem[] = useMemo(() => {
    const svgBase = (content: string) => `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 100 100'>` +
        `<rect fill='white' width='100' height='100'/>` + content + `</svg>`
    )}`;
    return [
      {
        id: 'mock-circle',
        title: 'Circle Outline',
        imageUrl: svgBase(`<circle cx='50' cy='50' r='30' stroke='black' stroke-width='4' fill='none'/>`),
        isFree: true,
        tags: ['basic']
      },
      {
        id: 'mock-star',
        title: 'Star Outline',
        imageUrl: svgBase(
          `<path d='M50 18 L58 40 L82 40 L62 54 L70 76 L50 62 L30 76 L38 54 L18 40 L42 40 Z' stroke='black' stroke-width='4' fill='none'/>`
        ),
        isFree: true,
        tags: ['basic']
      },
      {
        id: 'mock-heart',
        title: 'Heart Outline',
        imageUrl: svgBase(
          `<path d='M50 75 C20 55 20 30 40 30 C50 30 50 38 50 38 C50 38 50 30 60 30 C80 30 80 55 50 75 Z' stroke='black' stroke-width='4' fill='none'/>`
        ),
        isFree: true,
        tags: ['basic']
      },
      {
        id: 'mock-dots-star',
        title: 'Dot-to-dot Star',
        imageUrl: svgBase(`<rect fill='white' width='100' height='100'/>`),
        isFree: true,
        tags: ['basic', 'dot-to-dot'],
        // dot-to-dot lesson shape: ordered targets along the star vertices
        guide: {
          targets: [
            { x: 0.50, y: 0.18 }, { x: 0.58, y: 0.40 }, { x: 0.82, y: 0.40 },
            { x: 0.62, y: 0.54 }, { x: 0.70, y: 0.76 }, { x: 0.50, y: 0.62 },
            { x: 0.30, y: 0.76 }, { x: 0.38, y: 0.54 }, { x: 0.18, y: 0.40 },
            { x: 0.42, y: 0.40 }, { x: 0.50, y: 0.18 },
          ],
        },
      },
      {
        id: 'mock-trace-heart',
        title: 'Trace the Heart',
        imageUrl: svgBase(
          `<path d='M50 75 C20 55 20 30 40 30 C50 30 50 38 50 38 C50 38 50 30 60 30 C80 30 80 55 50 75 Z' stroke='black' stroke-width='4' fill='none'/>`
        ),
        isFree: true,
        tags: ['basic', 'stroke-path'],
        // stroke-path lesson shape: sampled polyline along the heart outline
        guide: {
          path: [
            { x: 0.50, y: 0.75 }, { x: 0.38, y: 0.66 }, { x: 0.27, y: 0.55 },
            { x: 0.22, y: 0.44 }, { x: 0.24, y: 0.34 }, { x: 0.32, y: 0.30 },
            { x: 0.40, y: 0.30 }, { x: 0.46, y: 0.33 }, { x: 0.50, y: 0.38 },
            { x: 0.54, y: 0.33 }, { x: 0.60, y: 0.30 }, { x: 0.68, y: 0.30 },
            { x: 0.76, y: 0.34 }, { x: 0.78, y: 0.44 }, { x: 0.73, y: 0.55 },
            { x: 0.62, y: 0.66 }, { x: 0.50, y: 0.75 },
          ],
        },
      }
    ];
  }, []);

  // Load templates from Supabase (guest => free only; user => all) then filter via client entitlements
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setTemplatesLoading(true);
        const rows = await repo.catalog.templates({ freeOnly: !user });
        const items: TemplateItem[] = rows.map((row: any) => {
          const pub = repo.catalog.templateImageUrl(row.image_path);
          return {
            id: row.id,
            title: row.title,
            imageUrl: pub ?? '',
            isFree: !!row.is_free,
            tags: row.tags ?? [],
            guide: row.guide && typeof row.guide === 'object' ? row.guide : undefined,
          } as TemplateItem;
        });
        // Apply client-side entitlement filtering
        const ent = getEntitlements(user?.id ?? null);
        // Canonical pack membership comes from pack_items (kind='template')
        let packTemplateIds: string[] | undefined;
        if (paramPackId) {
          const itemRows = await repo.catalog.packItems(paramPackId, 'template');
          packTemplateIds = itemRows.map((r: any) => r.ref_id as string);
        }
        const filtered = filterTemplatesForUser(items, {
          isGuest: !user,
          entitlements: ent,
          packId: paramPackId,
          packTemplateIds,
        });
        if (!cancelled) setTemplates(filtered);
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, paramPackId]);

  // If guest and no templates were fetched, present mock templates
  useEffect(() => {
    if (!user && !templatesLoading && templates.length === 0) {
      setTemplates(mockTemplates);
    }
  }, [user, templatesLoading, templates.length, mockTemplates]);

  // If templateId param is present, preselect and try to load persisted canvas state
  useEffect(() => {
    if (!paramTemplateId) return;
    const tpl = templates.find(t => t.id === paramTemplateId);
    if (tpl) {
      setTemplate(tpl);
      trackTemplateOpened({ templateId: tpl.id, templateTitle: tpl.title, isFree: tpl.isFree });
      // Load per-template canvas state if available (IndexedDB via adapter)
      if (paramPackId) {
        void (async () => {
          try {
            const work = await loadTemplateWork(user ? `lc_user_${user.id}` : undefined, paramPackId, tpl.id);
            const s = work?.canvasState;
            if (s && s.version === 2) {
              setInitialLines(s.lines ?? []);
              setInitialTexts(s.texts ?? []);
              latestPayloadRef.current = { version: 2, lines: s.lines ?? [], texts: s.texts ?? [] };
            }
          } catch {}
        })();
      }
    }
  }, [paramTemplateId, paramPackId, templates, user]);

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight - 64 });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Load persisted toolbar preferences
  useEffect(() => {
    let storedCollapsed: boolean | undefined;
    try {
      const raw = window.localStorage.getItem('lc_canvas_prefs_v1');
      if (raw) {
        const prefs = JSON.parse(raw) || {};
        if (typeof prefs.brushColor === 'string') setBrushColor(prefs.brushColor);
        if (typeof prefs.brushSize === 'number') setBrushSize(prefs.brushSize);
        if (typeof prefs.bgOpacity === 'number') setBgOpacity(prefs.bgOpacity);
        if (typeof prefs.showGrid === 'boolean') setShowGrid(prefs.showGrid);
        if (typeof prefs.tool === 'string' && ['brush','eraser','fill','line','trace','text','pan'].includes(prefs.tool)) {
          setTool(prefs.tool as CanvasTool);
        } else if (prefs.mode === 'select') {
          setTool('pan'); // migrate pre-toolkit prefs
        }
        if (typeof prefs.askBeforeClear === 'boolean') setAskBeforeClear(prefs.askBeforeClear);
        if (typeof prefs.showBackground === 'boolean') setShowBackground(prefs.showBackground);
        if (typeof prefs.toolbarCollapsed === 'boolean') storedCollapsed = prefs.toolbarCollapsed;
      }
    } catch {}
    setToolbarCollapsed(storedCollapsed ?? window.innerWidth < 1024);
    setToolbarMounted(true);
  }, []);

  // Persist toolbar preferences when any change
  useEffect(() => {
    try {
      const prefs = { brushColor, brushSize, bgOpacity, showGrid, tool, askBeforeClear, toolbarCollapsed, showBackground };
      window.localStorage.setItem('lc_canvas_prefs_v1', JSON.stringify(prefs));
    } catch {}
  }, [brushColor, brushSize, bgOpacity, showGrid, tool, askBeforeClear, toolbarCollapsed, showBackground]);

  // Load recent colors
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_COLORS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecentColors(parsed.filter(x => typeof x === 'string'));
    } catch {}
  }, []);

  // Persist recent colors when changed
  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recentColors));
    } catch {}
  }, [recentColors]);

  // Load drawing from IndexedDB (legacy localStorage auto-imports): prefer user data when signed in, otherwise guest
  useEffect(() => {
    void (async () => {
      try {
        const keyToLoad = userKey ?? STORAGE_KEY;
        const parsed = (await loadCanvasPayload(keyToLoad)) as any;
        if (parsed) {
          if (Array.isArray(parsed)) {
            setInitialLines(parsed);
          } else if (parsed && parsed.version === 2) {
            setInitialLines(parsed.lines ?? []);
            setInitialTexts(parsed.texts ?? []);
            latestPayloadRef.current = { version: 2, lines: parsed.lines ?? [], texts: parsed.texts ?? [] };
          }
        } else if (userKey) {
          // If signed in but no user data, see if guest data exists and prefill
          const parsedGuest = (await loadCanvasPayload(STORAGE_KEY)) as any;
          if (parsedGuest) {
            if (Array.isArray(parsedGuest)) {
              setInitialLines(parsedGuest);
            } else if (parsedGuest.version === 2) {
              setInitialLines(parsedGuest.lines ?? []);
              setInitialTexts(parsedGuest.texts ?? []);
              latestPayloadRef.current = { version: 2, lines: parsedGuest.lines ?? [], texts: parsedGuest.texts ?? [] };
            }
          }
        }
      } catch {}
    })();
  }, [userKey]);

  // If user signs in from here, you could redirect or keep them on canvas
  useEffect(() => {
    if (user && userKey) {
      // Migrate guest drawing to user-scoped storage if present (IndexedDB)
      void (async () => {
        try {
          const guest = await loadCanvasPayload(STORAGE_KEY);
          if (guest != null) {
            await moveCanvasPayload(STORAGE_KEY, userKey);
            // Simple confirmation; replace with toast if a toast utility is added later
            window.alert(`${t('canvas.upgrade.migratedTitle')}\n${t('canvas.upgrade.migratedDesc')}`);

            // Attempt cloud migration of JSON payload (optional PNG will be saved on next manual Save)
            try {
              const jsonPath = `${user.id}/${Date.now()}-autosave.json`;
              await repo.drawings.uploadJson(jsonPath, guest);
            } catch {}
          }
        } catch {}
      })();
      // Optionally: window.location.href = '/learn/mode';
    }
  }, [user]);

  const toolButtons = [
    { id: 'brush', Icon: Icons.brush, label: t('canvas.toolbar.mode.draw') || 'Brush' },
    { id: 'trace', Icon: Icons.trace, label: t('canvas.tools.trace') || 'Trace' },
    { id: 'eraser', Icon: Icons.eraser, label: t('canvas.tools.eraser') || 'Eraser' },
    { id: 'fill', Icon: Icons.paintBucket, label: t('canvas.tools.fill') || 'Fill' },
    { id: 'line', Icon: Icons.ruler, label: t('canvas.tools.line') || 'Line' },
    { id: 'text', Icon: Icons.text, label: t('canvas.tools.text') || 'Text' },
    { id: 'pan', Icon: Icons.hand, label: t('canvas.toolbar.mode.select') || 'Move' },
  ] as const;

  const renderToolButton = ({ id, Icon, label }: (typeof toolButtons)[number], widthClass: string) => (
    <button
      key={id}
      type="button"
      aria-label={label}
      aria-pressed={tool === id}
      onClick={() => setTool(id)}
      className={`group relative flex h-8 ${widthClass} items-center justify-center rounded border ${
        tool === id
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-brand-navy/15 bg-background text-brand-navy/70 hover:bg-accent'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-navy px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );

  const headerActionClass = 'h-8 w-8 shrink-0 px-0 sm:h-9 sm:w-9 xl:w-auto xl:px-3';
  const headerIconClass = 'h-4 w-4 shrink-0 xl:mr-2';
  const headerTextClass = 'hidden whitespace-nowrap xl:inline';
  const guestLabel = t('canvas.upgrade.title');
  const undoLabel = t('canvas.undo');
  const redoLabel = t('canvas.redo');
  const saveLabel = t('canvas.save') || 'Save';
  const chooseTemplateLabel = t('canvas.chooseTemplate.button');
  const templatesLabel = t('templates.link') || 'Templates';
  const saveProgressLabel = t('canvas.upgrade.cta');
  const shareLabel = t('common.share') || 'Share';

  return (
    <main role="main" className="force-light min-h-screen bg-brand-cream text-brand-navy">
      {/* Top bar for guest upgrade and canvas actions */}
      <div className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-2 px-2 sm:px-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm text-brand-navy/60 sm:h-9 sm:w-9 xl:w-auto xl:px-2"
            title={!user ? guestLabel : undefined}
          >
            {!user && (
              <>
                <Icons.user className="h-4 w-4 shrink-0 xl:mr-2" aria-hidden="true" />
                <span className={headerTextClass}>{guestLabel}</span>
                <span className="sr-only xl:hidden">{guestLabel}</span>
              </>
            )}
          </div>

          {/* Undo/Redo/Save */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              className={headerActionClass}
              aria-label={undoLabel}
              title={undoLabel}
              onClick={() => setUndoCmdCounter(c => c + 1)}
            >
              <Icons.undo className={headerIconClass} aria-hidden="true" />
              <span className={headerTextClass}>{undoLabel}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={headerActionClass}
              aria-label={redoLabel}
              title={redoLabel}
              onClick={() => setRedoCmdCounter(c => c + 1)}
            >
              <Icons.redo className={headerIconClass} aria-hidden="true" />
              <span className={headerTextClass}>{redoLabel}</span>
            </Button>
            <Button
              size="sm"
              variant="default"
              className={headerActionClass}
              aria-label={saveLabel}
              title={saveLabel}
              onClick={() => setSaveCmdCounter(c => c + 1)}
            >
              <Icons.save className={headerIconClass} aria-hidden="true" />
              <span className={headerTextClass}>{saveLabel}</span>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="default"
              className={headerActionClass}
              aria-label={chooseTemplateLabel}
              title={chooseTemplateLabel}
              onClick={() => setShowTemplatePicker(true)}
            >
              <Icons.image className={headerIconClass} aria-hidden="true" />
              <span className={headerTextClass}>{chooseTemplateLabel}</span>
            </Button>
            <Button size="sm" variant="outline" className={headerActionClass} asChild>
              <Link href="/templates" aria-label={templatesLabel} title={templatesLabel}>
                <Icons.packageOpen className={headerIconClass} aria-hidden="true" />
                <span className={headerTextClass}>{templatesLabel}</span>
              </Link>
            </Button>
            {!user && (
              <Button
                size="sm"
                className={headerActionClass}
                aria-label={saveProgressLabel}
                title={saveProgressLabel}
                onClick={() => setShowAuthModal(true)}
              >
                <Icons.logIn className={headerIconClass} aria-hidden="true" />
                <span className={headerTextClass}>{saveProgressLabel}</span>
              </Button>
            )}
            {user && (
              <Button
                size="sm"
                variant="default"
                className={headerActionClass}
                aria-label={shareLabel}
                title={shareLabel}
                disabled={!lastSavedPngPath}
                onClick={async () => {
                  if (!lastSavedPngPath) return;
                  try {
                    setShareLoading(true);
                    setShareError(null);
                    const signedUrl = await repo.drawings.signedUrl(lastSavedPngPath);
                    setShareUrl(signedUrl);
                    setShareOpen(true);
                  } catch (e: any) {
                    setShareError(e?.message || 'Failed to generate share link');
                    setShareOpen(true);
                  } finally {
                    setShareLoading(false);
                  }
                }}
              >
                <Icons.share className={headerIconClass} aria-hidden="true" />
                <span className={headerTextClass}>{shareLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-0px)]" data-testid="konva-stage">
        {size.width > 0 ? (
          <AnyDrawingCanvas
            width={size.width}
            height={size.height}
            className="bg-muted"
            initialLines={initialLines}
            initialTexts={initialTexts}
            backgroundImage={template?.imageUrl}
            backgroundOpacity={showBackground ? bgOpacity : 0}
            tool={tool}
            onToolChange={(next: CanvasTool) => setTool(next)}
            hideToolbar
            insideLinesOnly={stayInsideLines}
            guidePath={template?.guide?.path?.map((pt) => ({ x: pt.x * size.width, y: pt.y * size.height }))}
            guideDots={template?.guide?.targets?.map((pt) => ({ x: pt.x * size.width, y: pt.y * size.height }))}
            ghostCommand={ghostCmdCounter}
            saveCommand={saveCmdCounter}
            fillOpacity={fillOpacity}
            clearCommand={clearCmdCounter}
            showGrid={showGrid}
            undoCommand={undoCmdCounter}
            redoCommand={redoCmdCounter}
            brushColor={brushColor}
            brushSize={brushSize}
            askBeforeClear={askBeforeClear}
            onColorAction={(action: 'fill' | 'stroke', color?: string) => {
              if (template) {
                // Our freehand drawing uses stroke; ensure valid literal type
                trackTemplateColored({ templateId: template.id, action: 'stroke', color });
              }
            }}
            onChangeV2={(payload: { version: 2; lines: any[]; texts: any[] }) => {
              latestPayloadRef.current = payload;
              // Lightweight debounce to avoid excessive writes
              if (saveTimer.current) window.clearTimeout(saveTimer.current);
              saveTimer.current = window.setTimeout(() => {
                void (async () => {
                  try {
                    const key = userKey ?? STORAGE_KEY;
                    await saveCanvasPayload(key, payload);
                    // Also persist per-template work state for resume if we have identifiers
                    if (template && paramPackId) {
                      const canvasState: TemplateCanvasStateV2 = { version: 2, lines: payload.lines ?? [], texts: payload.texts ?? [] };
                      await saveTemplateWork(user ? `lc_user_${user.id}` : undefined, {
                        packId: paramPackId,
                        templateId: template.id,
                        status: 'in_progress',
                        startedAt: Date.now(),
                        updatedAt: Date.now(),
                        canvasState,
                      });
                    }
                  } catch {}
                })();
              }, 250);
            }}
            onSave={async (lines: any[], imageData: string) => {
              if (!user) {
                // Prompt sign-in to save to cloud
                setShowAuthModal(true);
                return;
              }
              try {
                const folder = `${user.id}`;
                const timestamp = Date.now();
                const latest = latestPayloadRef.current ?? { version: 2, lines, texts: [] as any[] };
                const payload = { version: 2, templateId: template?.id ?? null, lines: latest.lines, texts: latest.texts };
                const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                const jsonPath = `${folder}/${timestamp}.json`;
                const pngBlob = await (async () => {
                  // imageData is a dataURL (e.g., 'data:image/png;base64,...')
                  const res = await fetch(imageData);
                  return await res.blob();
                })();
                const pngPath = `${folder}/${timestamp}.png`;

                // Upload JSON (lines)
                const jsonErr = await repo.drawings.uploadFile(jsonPath, jsonBlob).then(() => null, (e) => e);

                // Upload PNG
                const pngErr = await repo.drawings.uploadPng(pngPath, pngBlob).then(() => null, (e) => e);

                if (jsonErr || pngErr) {
                  // S3.4 — queue the save in the sync outbox; it drains when
                  // connectivity returns (foreground + SW sync-artwork).
                  await enqueueOp('artwork', {
                    key: template && paramPackId
                      ? `work-${paramPackId}-${template.id}`
                      : `drawing-${timestamp}`,
                    json: payload,
                    pngDataUrl: imageData,
                  });
                  window.alert(t('common.savedLocally') || 'Saved on this device — it will sync to the cloud when you are back online.');
                } else {
                  window.alert(t('common.saved') || 'Saved to cloud!');
                  setLastSavedPngPath(pngPath);
                  // Track template_saved
                  trackTemplateSaved({ templateId: template?.id ?? null, hasPng: true });
                  // Mark work as completed locally
                  if (template && paramPackId) {
                    await saveTemplateWork(user ? `lc_user_${user.id}` : undefined, {
                      packId: paramPackId,
                      templateId: template.id,
                      status: 'completed',
                      startedAt: Date.now(),
                      updatedAt: Date.now(),
                      canvasState: latestPayloadRef.current ?? { version: 2, lines, texts: [] },
                    });
                  }
                }
              } catch (e) {
                try {
                  const latest = latestPayloadRef.current ?? { version: 2, lines, texts: [] as any[] };
                  await enqueueOp('artwork', {
                    key: template && paramPackId
                      ? `work-${paramPackId}-${template.id}`
                      : `drawing-${Date.now()}`,
                    json: { version: 2, templateId: template?.id ?? null, lines: latest.lines, texts: latest.texts },
                    pngDataUrl: imageData,
                  });
                  window.alert(t('common.savedLocally') || 'Saved on this device — it will sync to the cloud when you are back online.');
                } catch {
                  window.alert(t('common.saveError') || 'Failed to save to cloud. Your local copy is still safe.');
                }
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-brand-navy/60">
            {t('common.loading') || 'Loading...'}
          </div>
        )}
      </div>

      {/* Lightweight on-canvas toolbar (colors and sizes) */}
      <div className="pointer-events-auto fixed left-4 top-36 z-40 select-none">
        {!toolbarMounted ? null : toolbarCollapsed ? (
          <div className="flex flex-col items-center gap-1 rounded-md border bg-background/80 backdrop-blur p-1.5 shadow">
            <button
              type="button"
              onClick={() => setToolbarCollapsed(false)}
              aria-label={t('canvas.toolbar.expand') || 'Expand toolbar'}
              title={t('canvas.toolbar.expand') || 'Expand toolbar'}
              className="flex h-8 w-8 items-center justify-center rounded border border-brand-navy/15 bg-background text-brand-navy/70 hover:bg-accent"
            >
              <Icons.chevronRight className="h-4 w-4" />
            </button>
            <div className="h-px w-6 bg-brand-navy/15" aria-hidden="true" />
            {toolButtons.map((tb) => renderToolButton(tb, 'w-8'))}
            <div className="h-px w-6 bg-brand-navy/15" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setToolbarCollapsed(false)}
              aria-label={t('canvas.toolbar.expand') || 'Expand toolbar'}
              title={t('canvas.toolbar.expand') || 'Expand toolbar'}
              className="h-6 w-6 rounded border border-brand-navy/15"
              style={{ backgroundColor: brushColor }}
            />
          </div>
        ) : (
        <div className="rounded-md border bg-background/80 backdrop-blur p-2 shadow">
          <div className="w-56 mb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-brand-navy/60">{t('canvas.toolbar.tools') || 'Tools'}</div>
              <button
                type="button"
                onClick={() => setToolbarCollapsed(true)}
                aria-label={t('canvas.toolbar.collapse') || 'Collapse toolbar'}
                title={t('canvas.toolbar.collapse') || 'Collapse toolbar'}
                className="flex h-6 w-6 items-center justify-center rounded text-brand-navy/60 hover:bg-accent hover:text-foreground"
              >
                <Icons.chevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {toolButtons.map((tb) => renderToolButton(tb, 'w-full'))}
            </div>
            <div className="mt-1 text-[11px] text-brand-navy/60">{t(toolHintKeys[tool])}</div>
          </div>
          {(template?.guide?.targets || template?.guide?.path) && (
            <div className="w-56 mb-2 rounded border border-indigo-200 bg-indigo-50/80 p-2">
              <div className="text-xs font-medium text-indigo-900 mb-1">{t('canvas.activity.title') || 'Activity'}</div>
              {template?.guide?.targets && (
                <div className="text-[11px] text-indigo-800">{t('canvas.activity.dotsHint') || 'Tap the dots in order to connect them'}</div>
              )}
              {template?.guide?.path && (
                <>
                  <div className="text-[11px] text-indigo-800 mb-1">{t('canvas.activity.traceHint') || 'Follow the dashed guide with the brush or trace tool'}</div>
                  <Button size="sm" variant="outline" onClick={() => setGhostCmdCounter(c => c + 1)}>
                    {t('canvas.activity.watchGhost') || 'Watch how'}
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="text-xs font-medium mb-1 text-brand-navy/60">{t('canvas.toolbar.brush') || 'Brush'}</div>
          <div className="w-56 mb-2">
            <div className="text-[11px] text-brand-navy/60 mb-1">{t('canvas.toolbar.colors.swatches') || 'Swatches'}</div>
            <div className="flex flex-wrap gap-1">
              {['#000000','#6b7280','#ffffff','#ef4444','#3b82f6','#10b981','#f59e0b','#a855f7','#06b6d4','#f97316'].map(c => (
                <button
                  key={c}
                  aria-label={`color ${c}`}
                  onClick={() => { setBrushColor(c); addRecentColor(c); }}
                  className={`h-6 w-6 rounded border ${brushColor===c ? 'ring-2 ring-ring' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          {recentColors.length > 0 && (
            <div className="w-56 mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] text-brand-navy/60">{t('canvas.toolbar.colors.recent') || 'Recent'}</div>
                <button
                  className="text-[11px] underline text-brand-navy/60 hover:text-foreground"
                  onClick={async () => { 
                    setRecentColors([]); 
                    try { window.localStorage.removeItem(RECENT_COLORS_KEY); } catch {} 
                    try { await trackRecentColorsCleared(); } catch {}
                  }}
                  aria-label={t('canvas.toolbar.colors.clearRecent') || 'Clear recent colors'}
                  title={t('canvas.toolbar.colors.clearRecent') || 'Clear recent colors'}
                >
                  {t('canvas.toolbar.colors.clearRecent') || 'Clear recent colors'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {recentColors.map(c => (
                  <button
                    key={`recent-${c}`}
                    aria-label={`recent color ${c}`}
                    onClick={() => { setBrushColor(c); addRecentColor(c); }}
                    className={`h-6 w-6 rounded border ${brushColor===c ? 'ring-2 ring-ring' : ''}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="w-56">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.size') || 'Size'}</span>
              <span className="text-xs tabular-nums">{brushSize}px</span>
            </div>
            <Slider
              value={[sizeSlider]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v: number[]) => {
                const sv = Math.max(0, Math.min(100, v[0] ?? sizeSlider));
                setSizeSlider(sv);
                setBrushSize(sliderToSize(sv));
              }}
            />
          </div>
          {/* Fill controls */}
          <div className="w-56 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.fill.opacity') || 'Fill opacity'}</span>
              <span className="text-xs tabular-nums">{Math.round(fillOpacity * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(fillOpacity * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v: number[]) => {
                const sv = Math.max(0, Math.min(100, v[0] ?? Math.round(fillOpacity * 100)));
                setFillOpacity(sv / 100);
              }}
            />
            <div className="mt-1 text-[11px] text-brand-navy/60">{t('canvas.toolbar.fill.hint') || 'Applies to the Fill tool layer'}</div>
          </div>
          {/* Clear tool */}
          <div className="w-56 mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.clear.title') || 'Clear'}</span>
            </div>
            <Button size="sm" variant="destructive" onClick={() => {
              if (askBeforeClear) {
                const ok = window.confirm(t('canvas.toolbar.clear.confirm') || 'Clear the entire canvas? This cannot be undone except via Undo.');
                if (!ok) return;
              }
              setClearCmdCounter(c => c + 1);
            }}>
              {t('canvas.toolbar.clear.button') || 'Clear canvas'}
            </Button>
            <label className="mt-2 flex items-center gap-2 text-xs text-brand-navy/60">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={askBeforeClear}
                onChange={(e) => setAskBeforeClear(e.target.checked)}
              />
              {t('canvas.toolbar.clear.askBefore') || 'Ask before clear'}
            </label>
          </div>
          {/* Stay inside lines toggle */}
          <div className="w-56 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.insideLines.title') || 'Stay inside lines'}</span>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={stayInsideLines}
                  onChange={(e) => setStayInsideLines(e.target.checked)}
                />
                <span>{stayInsideLines ? (t('canvas.toolbar.grid.on') || 'On') : (t('canvas.toolbar.grid.off') || 'Off')}</span>
              </label>
            </div>
            <div className="text-[11px] text-brand-navy/50 mt-0.5">{t('canvas.toolbar.insideLines.hint') || 'Brush strokes stop at template outlines'}</div>
          </div>
          {/* Grid toggle */}
          <div className="w-56 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.grid.title') || 'Show grid'}</span>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span>{showGrid ? (t('canvas.toolbar.grid.on') || 'On') : (t('canvas.toolbar.grid.off') || 'Off')}</span>
              </label>
            </div>
          </div>
          <div className="w-56">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.background.show') || 'Show background'}</span>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={showBackground}
                  onChange={(e) => setShowBackground(e.target.checked)}
                />
                <span>{showBackground ? (t('canvas.toolbar.grid.on') || 'On') : (t('canvas.toolbar.grid.off') || 'Off')}</span>
              </label>
            </div>
            <div className="flex items-center justify-between mb-1 mt-2">
              <span className="text-xs text-brand-navy/60">{t('canvas.toolbar.background') || 'Background'}</span>
              <span className="text-xs tabular-nums">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <Slider
              disabled={!showBackground}
              value={[Math.round(bgOpacity * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v: number[]) => {
                const sv = Math.max(0, Math.min(100, v[0] ?? Math.round(bgOpacity * 100)));
                setBgOpacity(sv / 100);
              }}
            />
          </div>
        </div>
        )}
      </div>

      {/* Auth Modal for upgrade */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="signin" />

      {/* Share Dialog */}
      <AnyDialog open={shareOpen} onOpenChange={setShareOpen}>
        <AnyDialogContent>
          <AnyDialogHeader>
            <AnyDialogTitle>{t('common.share') || 'Share'}</AnyDialogTitle>
          </AnyDialogHeader>
          <div className="space-y-3">
            {shareLoading && <div className="text-sm text-brand-navy/60">{t('common.loading') || 'Generating link...'}</div>}
            {shareError && <div className="text-sm text-red-600">{shareError}</div>}
            {shareUrl && (
              <>
                <div className="break-all text-sm p-2 bg-muted rounded">
                  {shareUrl}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { navigator.clipboard?.writeText(shareUrl); }}>
                    {t('common.copyLink') || 'Copy link'}
                  </Button>
                  {typeof navigator !== 'undefined' && (navigator as any).share && (
                    <Button size="sm" variant="outline" onClick={() => {
                      (navigator as any).share({ title: t('common.share') || 'Share', url: shareUrl }).catch(() => {});
                    }}>
                      {t('common.systemShare') || 'Share via…'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </AnyDialogContent>
      </AnyDialog>

      {/* Template Picker */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templates={templates}
        onSelect={(tpl) => {
          setTemplate(tpl);
          trackTemplateOpened({ templateId: tpl.id, templateTitle: tpl.title, isFree: tpl.isFree });
          setShowTemplatePicker(false);
        }}
        showOnlyFree={!user}
        title={user ? t('canvas.chooseTemplate.title') : t('canvas.chooseTemplate.freeTitle')}
      />
    </main>
  );
}
