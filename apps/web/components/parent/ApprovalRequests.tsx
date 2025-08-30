'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type ApprovalRequest = {
  id: string;
  child_id: string;
  child_username: string;
  request_type: string;
  status: 'pending' | 'approved' | 'denied';
  metadata: {
    title?: string;
    description?: string;
    duration?: number;
    content_type?: string;
  };
  created_at: string;
  updated_at: string;
};

type RequestTypeConfig = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  actionLabel: string;
};

const REQUEST_TYPES: Record<string, RequestTypeConfig> = {
  unlock: {
    title: 'Unlock Request',
    description: 'wants to unlock additional content',
    icon: <Unlock className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    actionLabel: 'Unlock',
  },
  purchase: {
    title: 'Purchase Request',
    description: 'wants to make a purchase',
    icon: <ShoppingBag className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    actionLabel: 'Approve Purchase',
  },
  content_access: {
    title: 'Content Access',
    description: 'wants to access age-restricted content',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    actionLabel: 'Grant Access',
  },
  default: {
    title: 'Permission Request',
    description: 'needs your approval',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    actionLabel: 'Approve',
  },
};

function Unlock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function ApprovalRequests() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          profiles:child_id (username)
        `)
        .eq('parent_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include the username
      const transformedData = data.map((item: any) => ({
        ...item,
        child_username: item.profiles?.username || 'Your child',
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      toast.error('Failed to load approval requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('approval_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests',
      }, () => {
        fetchRequests();
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleDecision = async (requestId: string, approved: boolean) => {
    try {
      setIsProcessing(requestId);
      
      const { error } = await supabase.rpc('process_approval_request', {
        p_request_id: requestId,
        p_approved: approved,
      });
      
      if (error) throw error;
      
      // Emit analytics event
      await supabase.rpc('track_event', {
        event_name: 'approval_decided',
        event_data: {
          request_id: requestId,
          decision: approved ? 'approved' : 'denied',
        },
      });
      
      toast.success(`Request ${approved ? 'approved' : 'denied'} successfully`);
      
      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(`Failed to ${approved ? 'approve' : 'deny'} request`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getRequestConfig = (type: string) => {
    return REQUEST_TYPES[type] || REQUEST_TYPES.default;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-8 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-medium">No pending requests</h3>
        <p className="text-sm text-muted-foreground">
          When your child requests approval, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Pending Approvals</h3>
        <Badge variant="outline" className="ml-2">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {requests.map((request) => {
          const config = getRequestConfig(request.request_type);
          const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: true });
          
          return (
            <Card key={request.id} className="overflow-hidden
              hover:shadow-md transition-shadow duration-200">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {request.child_username} {config.description}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {timeAgo}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {config.title}
                  </Badge>
                </div>
              </CardHeader>
              
              {request.metadata && (
                <CardContent className="p-4 pt-0">
                  <div className="rounded-lg bg-muted/30 p-3 text-sm">
                    {request.metadata.title && (
                      <h4 className="font-medium">{request.metadata.title}</h4>
                    )}
                    {request.metadata.description && (
                      <p className="text-muted-foreground">{request.metadata.description}</p>
                    )}
                    {request.metadata.duration && (
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        <span>{request.metadata.duration} minutes</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecision(request.id, false)}
                      disabled={isProcessing === request.id}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDecision(request.id, true)}
                      disabled={isProcessing === request.id}
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {config.actionLabel}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
