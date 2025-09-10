import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export function useAnalysisNotifications() {
  const { toast } = useToast();
  const previousAnalysesRef = useRef<Set<string>>(new Set());
  
  // Query to check for completed analyses
  const { data: completedAnalyses } = useQuery({
    queryKey: ['completed_analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          id,
          created_at,
          sentiment_score,
          engagement_score,
          recordings (
            file_name,
            status
          )
        `)
        .eq('user_id', MOCK_USER_ID)
        .not('sentiment_score', 'is', null) // Has analysis data
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    if (!completedAnalyses) return;

    const currentCompletedIds = new Set(completedAnalyses.map(a => a.id));
    
    // Find newly completed analyses
    const newlyCompleted = completedAnalyses.filter(analysis => 
      !previousAnalysesRef.current.has(analysis.id)
    );

    // Show notifications for newly completed analyses
    newlyCompleted.forEach(analysis => {
      const fileName = analysis.recordings?.file_name || 'Recording';
      const sentimentScore = (analysis.sentiment_score || 0).toFixed(0);
      const engagementScore = (analysis.engagement_score || 0).toFixed(0);
      
      toast({
        title: "🎉 Analysis Complete!",
        description: `${fileName} - Sentiment: ${sentimentScore}%, Engagement: ${engagementScore}%`,
        duration: 6000,
      });
    });

    // Update the reference
    previousAnalysesRef.current = currentCompletedIds;
  }, [completedAnalyses, toast]);

  return {
    completedAnalyses: completedAnalyses || [],
    hasNewCompletedAnalyses: completedAnalyses && completedAnalyses.length > previousAnalysesRef.current.size
  };
}
