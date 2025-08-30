import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <WifiOff className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground">
            We can't connect to the internet right now. Please check your connection and try again.
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>
        </div>
        
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <div className="flex items-start">
            <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>Some features may not be available while offline. Your work will be saved and synced when you're back online.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
