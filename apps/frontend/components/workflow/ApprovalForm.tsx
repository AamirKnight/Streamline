
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApprovalFormProps {
  onSubmit: (action: 'approved' | 'rejected' | 'requested_changes', comment?: string) => void;
  onCancel: () => void;
}

export function ApprovalForm({ onSubmit, onCancel }: ApprovalFormProps) {
  const [action, setAction] = useState<'approved' | 'rejected' | 'requested_changes'>('approved');
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Submit Review</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Decision</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={action === 'approved' ? 'default' : 'outline'}
                onClick={() => setAction('approved')}
                className="w-full"
              >
                Approve
              </Button>
              <Button
                variant={action === 'requested_changes' ? 'default' : 'outline'}
                onClick={() => setAction('requested_changes')}
                className="w-full"
              >
                Changes
              </Button>
              <Button
                variant={action === 'rejected' ? 'default' : 'outline'}
                onClick={() => setAction('rejected')}
                className="w-full"
              >
                Reject
              </Button>
            </div>
          </div>

          <div>
            <Label>Comment (Optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your feedback..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => onSubmit(action, comment)} className="flex-1">
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}