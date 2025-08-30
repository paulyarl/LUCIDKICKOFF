'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link as LinkIcon, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

type LinkStatus = 'idle' | 'generating' | 'verifying' | 'success' | 'error';

export function LinkChildForm() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<LinkStatus>('idle');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const generateOtp = async () => {
    try {
      setStatus('generating');
      
      const { data, error } = await supabase.functions.invoke('generate-otp');
      
      if (error) throw error;
      
      setGeneratedOtp(data.otp);
      setStatus('idle');
      toast.success('OTP generated successfully');
    } catch (error) {
      console.error('Error generating OTP:', error);
      setStatus('error');
      toast.error('Failed to generate OTP. Please try again.');
    }
  };

  const verifyOtp = async () => {
    try {
      if (otp.length !== 6) {
        toast.error('Please enter a 6-digit OTP');
        return;
      }
      
      setStatus('verifying');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      const { data, error } = await supabase.rpc('link_child_account', {
        p_otp: otp,
        p_parent_id: session.user.id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setStatus('success');
        toast.success('Child account linked successfully!');
        // Refresh the page to show the updated list of linked children
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(data?.message || 'Failed to link child account');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to link child account');
    } finally {
      setStatus('idle');
    }
  };

  const copyToClipboard = () => {
    if (!generatedOtp) return;
    
    navigator.clipboard.writeText(generatedOtp);
    setIsCopied(true);
    toast.success('OTP copied to clipboard');
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Link Child Account</h3>
        <p className="text-sm text-muted-foreground">
          Generate a one-time code to link your child's account to your parent account.
        </p>
      </div>
      
      <div className="space-y-4">
        {!generatedOtp ? (
          <Button 
            onClick={generateOtp} 
            disabled={status === 'generating'}
            className="w-full"
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Generate Link Code
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-mono text-lg font-medium tracking-wider">
                  {generatedOtp}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyToClipboard}
                disabled={isCopied}
              >
                {isCopied ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy to clipboard</span>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Share this code with your child. It will expire in 10 minutes.
            </p>
            
            <div className="pt-2">
              <h4 className="mb-2 text-sm font-medium">Instructions for your child:</h4>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Open the app on your child's device</li>
                <li>Go to Settings &gt; Link to Parent</li>
                <li>Enter the code above</li>
                <li>Follow the on-screen instructions</li>
              </ol>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or enter child's code
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="child-otp" className="text-sm font-medium">
            Child's OTP
          </label>
          <div className="flex space-x-2">
            <Input
              id="child-otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={status === 'verifying'}
              className="text-center font-mono text-lg"
            />
            <Button 
              onClick={verifyOtp}
              disabled={otp.length !== 6 || status === 'verifying'}
              className="min-w-[120px]"
            >
              {status === 'verifying' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {status === 'verifying' ? 'Linking...' : 'Link'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask your child for their 6-digit OTP from their device
          </p>
        </div>
      </div>
    </div>
  );
}
