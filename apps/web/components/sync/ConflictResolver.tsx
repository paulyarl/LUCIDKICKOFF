'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Clock, Check, X, ExternalLink, Loader2 } from 'lucide-react';

interface ArtworkVersion {
  id: string;
  title: string;
  updatedAt: string;
  width: number;
  height: number;
  previewUrl?: string;
  data?: any;
}

interface Conflict {
  id: string;
  serverVersion: ArtworkVersion;
  localVersion: ArtworkVersion;
  type: 'version' | 'deletion';
}

interface ConflictResolverProps {
  conflict: Conflict | null;
  onResolve: (resolution: 'server' | 'local') => Promise<void>;
  onPreview?: (version: ArtworkVersion) => void;
  onDismiss?: () => void;
}

export function ConflictResolver({ 
  conflict, 
  onResolve, 
  onPreview,
  onDismiss 
}: ConflictResolverProps) {
  const [selectedVersion, setSelectedVersion] = useState<'server' | 'local' | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Reset selection when conflict changes
  useEffect(() => {
    setSelectedVersion(null);
  }, [conflict?.id]);

  if (!conflict) return null;

  const { serverVersion, localVersion } = conflict;

  const handleResolve = async (resolution: 'server' | 'local') => {
    // Note: We are resolving with the passed resolution directly, not necessarily the selected one.
    // This is to support the main action buttons that don't rely on prior selection.
    setIsResolving(true);
    try {
      await onResolve(resolution);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };
  
  const timeAgo = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    // @ts-expect-error React 19 forwardRef JSX compatibility
    <Dialog open={!!conflict} onOpenChange={(open: boolean) => !open && onDismiss?.()}>
      {/* @ts-expect-error React 19 forwardRef JSX compatibility */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          {/* @ts-expect-error React 19 forwardRef JSX compatibility */}
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Resolve Conflict
          </DialogTitle>
          {/* @ts-expect-error React 19 forwardRef JSX compatibility */}
          <DialogDescription>
            There are conflicting versions of this artwork. Please choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Server Version */}
            <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedVersion === 'server' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`} onClick={() => setSelectedVersion('server')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedVersion === 'server' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`} />
                  <h3 className="font-medium">Server Version</h3>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Updated: {timeAgo(serverVersion.updatedAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {serverVersion.width} × {serverVersion.height}
              </p>
              {serverVersion.previewUrl && (
                <div className="mt-3">
                  <img 
                    src={serverVersion.previewUrl} 
                    alt={serverVersion.title}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(serverVersion);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              )}
            </div>

            {/* Local Version */}
            <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedVersion === 'local' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`} onClick={() => setSelectedVersion('local')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedVersion === 'local' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`} />
                  <h3 className="font-medium">Local Version</h3>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Updated: {timeAgo(localVersion.updatedAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {localVersion.width} × {localVersion.height}
              </p>
              {localVersion.previewUrl && (
                <div className="mt-3">
                  <img 
                    src={localVersion.previewUrl} 
                    alt={localVersion.title}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(localVersion);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isResolving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => handleResolve('server')}
              disabled={isResolving || selectedVersion !== 'server'}
              className="flex-1"
            >
              {isResolving && selectedVersion === 'server' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Keep Server Version
            </Button>
            <Button
              onClick={() => handleResolve('local')}
              disabled={isResolving || selectedVersion !== 'local'}
              className="flex-1"
            >
              {isResolving && selectedVersion === 'local' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Keep Local Version
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
