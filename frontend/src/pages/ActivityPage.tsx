import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { ActivityItem } from '@/types';
import {
  Activity,
  FileText,
  MessageSquare,
  FileCheck,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SkeletonText } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRelativeDate, formatDate } from '@/utils/formatters';

export const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await api.getRecentActivity();
        setActivities(data);
      } catch (err) {
        console.error('Failed to load activity', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'document_uploaded':
      case 'document_processed':
        return <FileText className="w-4 h-4 text-primary-600" />;
      case 'conversation_created':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'summary_generated':
        return <FileCheck className="w-4 h-4 text-teal-600" />;
      default:
        return <Activity className="w-4 h-4 text-charcoal-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Recent Activity</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Audit trail and timeline of document parsing, RAG inquiries, and generated syntheses.
        </p>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <SkeletonText lines={6} />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-8 h-8" />}
          title="No activity recorded"
          description="Your document ingestion events and chat interactions will show up here."
        />
      ) : (
        <div className="bg-white/90 dark:bg-[#111827]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs backdrop-blur-sm">
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {activities.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[30px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100/80 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(item.type)}
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatRelativeDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-6">
                      {item.description}
                    </p>
                  </div>

                  {item.targetUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => navigate(item.targetUrl)}
                      className="self-start sm:self-auto shrink-0"
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
