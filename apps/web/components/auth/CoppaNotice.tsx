'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

type CoppaNoticeProps = {
  onAccept: () => void;
  onReject: () => void;
};

export function CoppaNotice({ onAccept, onReject }: CoppaNoticeProps) {
  const [accepted, setAccepted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Parental Consent Required</h1>
        <p className="text-muted-foreground">
          To comply with COPPA, we need parental consent for users under 13.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Important Notice for Parents</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            LucidCraft is committed to protecting the privacy of children. 
            The Children's Online Privacy Protection Act (COPPA) requires that we 
            obtain verifiable parental consent before collecting personal information 
            from children under 13.
          </p>
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-primary hover:underline"
            type="button"
          >
            {showDetails ? 'Hide details' : 'Read more about our privacy practices'}
          </button>
          
          {showDetails && (
            <div className="mt-4 space-y-4 text-sm">
              <p>
                We collect the following information from children:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Username (can be a nickname)</li>
                <li>Parent's email address (for verification only)</li>
                <li>Artwork and creations (stored securely)</li>
                <li>Usage data (to improve our service)</li>
              </ul>
              <p>
                We do not share children's personal information with third parties 
                except as necessary to provide our service or as required by law.
              </p>
              <p>
                Parents can review, update, or delete their child's information 
                at any time by contacting us at privacy@lucidcraft.app.
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="parental-consent" 
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <Label htmlFor="parental-consent" className="text-sm">
            I am the parent or legal guardian of this child and I consent to the collection 
            and use of my child's information as described in the 
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              Privacy Policy
            </a>.
          </Label>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onReject}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            disabled={!accepted}
            type="button"
          >
            I Agree
          </Button>
        </div>
      </div>
    </div>
  );
}
