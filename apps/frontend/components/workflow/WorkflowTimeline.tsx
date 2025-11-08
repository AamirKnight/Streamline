
'use client';

import { Workflow } from '@/lib/workflow';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface WorkflowTimelineProps {
  workflow: Workflow;
}

export function WorkflowTimeline({ workflow }: WorkflowTimelineProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
      <div className="space-y-2">
        {workflow.stateHistory.map((event, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <div className="mt-1">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{event.fromState}</span>
                {' → '}
                <span className="font-medium">{event.toState}</span>
              </p>
              {event.reason && (
                <p className="text-gray-600 text-xs mt-1">{event.reason}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {workflow.approvals.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-gray-700 mt-4">Approvals</h4>
          <div className="space-y-2">
            {workflow.approvals.map((approval, index) => {
              const Icon = 
                approval.action === 'approved' ? CheckCircle :
                approval.action === 'rejected' ? AlertCircle :
                Clock;
              
              const color = 
                approval.action === 'approved' ? 'text-green-600' :
                approval.action === 'rejected' ? 'text-red-600' :
                'text-yellow-600';

              return (
                <div key={index} className="flex items-start gap-3 text-sm bg-gray-50 rounded p-2">
                  <Icon className={`w-4 h-4 mt-1 ${color}`} />
                  <div className="flex-1">
                    <p className="text-gray-900">
                      User #{approval.userId} - <span className="capitalize">{approval.action.replace('_', ' ')}</span>
                    </p>
                    {approval.comment && (
                      <p className="text-gray-600 text-xs mt-1 italic">&quot;{approval.comment}&quot;</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(approval.timestamp).toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 font-mono">
                      Signature: {approval.signature.slice(0, 16)}...
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}