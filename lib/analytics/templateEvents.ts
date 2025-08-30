import { getAnalyticsQueue } from './queue';
import { createBaseEvent, LearningEvent } from './events';

const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';
const analyticsQueue = getAnalyticsQueue(ANALYTICS_ENDPOINT);

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch {}
  // Fallback
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const SESSION_ID = typeof sessionStorage !== 'undefined' 
  ? (sessionStorage.getItem('analytics_session_id') || genId()) 
  : genId();

if (typeof sessionStorage !== 'undefined') {
  sessionStorage.setItem('analytics_session_id', SESSION_ID);
}

function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  if ((window as any).__AUTH_CONTEXT__?.user?.id) {
    return (window as any).__AUTH_CONTEXT__.user.id;
  }
  return localStorage.getItem('user_id') || undefined;
}

export async function trackTemplateOpened(params: {
  templateId: string;
  templateTitle: string;
  isFree?: boolean;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('template_opened', SESSION_ID, getUserId()),
    template_id: params.templateId,
    template_title: params.templateTitle,
    is_free: params.isFree,
  } as any;
  return analyticsQueue.enqueue(event);
}

export async function trackTemplateColored(params: {
  templateId: string;
  action: 'fill' | 'stroke';
  color?: string;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('template_colored', SESSION_ID, getUserId()),
    template_id: params.templateId,
    action: params.action,
    color: params.color,
  } as any;
  return analyticsQueue.enqueue(event);
}

export async function trackTemplateSaved(params: {
  templateId: string | null;
  hasPng?: boolean;
}): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('template_saved', SESSION_ID, getUserId()),
    template_id: params.templateId,
    has_png: params.hasPng ?? true,
  } as any;
  return analyticsQueue.enqueue(event);
}

export async function trackRecentColorsCleared(): Promise<boolean> {
  const event: LearningEvent = {
    ...createBaseEvent('recent_colors_cleared', SESSION_ID, getUserId()),
  } as any;
  return analyticsQueue.enqueue(event);
}
