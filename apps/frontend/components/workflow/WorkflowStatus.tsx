// FILE: apps/frontend/components/workflow/WorkflowStatus.tsx
// CREATE this new file in your project

'use client';

import { WorkflowState } from '@/lib/workflow';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Archive 
} from 'lucide-react';

interface WorkflowStatusProps {
  state: WorkflowState;
  showIcon?: boolean;
}

const stateConfig = {
  [WorkflowState.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileText,
  },
  [WorkflowState.IN_REVIEW]: {
    label: 'In Review',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
  [WorkflowState.CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
  },
  [WorkflowState.APPROVED]: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  [WorkflowState.PUBLISHED]: {
    label: 'Published',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
  },
  [WorkflowState.ARCHIVED]: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Archive,
  },
};

export function WorkflowStatus({ state, showIcon = true }: WorkflowStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border font-medium`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}