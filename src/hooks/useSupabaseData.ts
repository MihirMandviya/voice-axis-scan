import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Recording, Analysis, MetricsAggregate } from '@/lib/supabase'

// Mock user ID - in a real app, this would come from authentication
const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

export function useRecordings() {
  return useQuery({
    queryKey: ['recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Recording[]
    }
  })
}

export function useAnalyses() {
  return useQuery({
    queryKey: ['analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          recordings (
            file_name,
            duration_seconds,
            created_at
          )
        `)
        .eq('user_id', MOCK_USER_ID)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Analysis & { recordings: Recording })[]
    }
  })
}

export function useMetricsAggregates() {
  return useQuery({
    queryKey: ['metrics_aggregates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_aggregates')
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .order('date', { ascending: false })
      
      if (error) throw error
      return data as MetricsAggregate[]
    }
  })
}

export function useDashboardStats() {
  const { data: recordings } = useRecordings()
  const { data: analyses } = useAnalyses()
  const { data: metrics } = useMetricsAggregates()

  return useQuery({
    queryKey: ['dashboard_stats', recordings, analyses, metrics],
    queryFn: () => {
      if (!recordings || !analyses || !metrics) return null

      // Calculate KPIs
      const totalCalls = recordings.length
      const avgSentiment = analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / analyses.length
      const avgEngagement = analyses.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / analyses.length
      const avgConfidenceExecutive = analyses.reduce((sum, a) => sum + (a.confidence_score_executive || 0), 0) / analyses.length
      const avgConfidencePerson = analyses.reduce((sum, a) => sum + (a.confidence_score_person || 0), 0) / analyses.length
      const totalObjectionsHandled = analyses.filter(a => a.objections_handled && a.objections_handled !== 'None - customer was receptive and interested' && a.objections_handled !== 'None - strong alignment with growth challenges' && a.objections_handled !== 'None - enterprise client was highly engaged throughout').length
      const successfulOutcomes = analyses.filter(a => a.call_outcome && !['Trial Setup', 'Awaiting Decision'].includes(a.call_outcome)).length

      // Sentiment distribution
      const sentimentData = [
        { 
          name: 'Positive', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 0.7).length,
          color: 'hsl(var(--success))' 
        },
        { 
          name: 'Neutral', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 0.4 && (a.sentiment_score || 0) < 0.7).length,
          color: 'hsl(var(--accent-blue))' 
        },
        { 
          name: 'Negative', 
          value: analyses.filter(a => (a.sentiment_score || 0) < 0.4).length,
          color: 'hsl(var(--warning))' 
        }
      ]

      // Trend data from metrics
      const trendData = metrics.slice(-7).map(m => ({
        date: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
        sentiment: m.avg_sentiment || 0,
        engagement: m.avg_engagement || 0
      }))

      // Engagement levels
      const engagementData = [
        { level: 'High', count: analyses.filter(a => (a.engagement_score || 0) >= 0.8).length },
        { level: 'Medium', count: analyses.filter(a => (a.engagement_score || 0) >= 0.6 && (a.engagement_score || 0) < 0.8).length },
        { level: 'Low', count: analyses.filter(a => (a.engagement_score || 0) < 0.6).length }
      ]

      // Objection handling analysis
      const objectionData = [
        { category: 'Budget/Price', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('budget') || a.objections_handled?.toLowerCase().includes('price')).length },
        { category: 'Timeline', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('timeline')).length },
        { category: 'Authority', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('authority') || a.objections_handled?.toLowerCase().includes('decision')).length },
        { category: 'Competition', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('competition') || a.objections_handled?.toLowerCase().includes('competitor')).length },
        { category: 'None', count: analyses.filter(a => a.objections_handled?.toLowerCase().includes('none')).length }
      ]

      return {
        kpiData: {
          totalCalls,
          avgSentiment,
          avgEngagement,
          avgConfidenceExecutive,
          avgConfidencePerson,
          objectionsHandled: totalObjectionsHandled,
          conversionRate: successfulOutcomes / totalCalls || 0
        },
        sentimentData,
        trendData,
        engagementData,
        objectionData,
        recentCalls: analyses.slice(0, 4).map((analysis, index) => ({
          id: analysis.id,
          name: analysis.recordings?.file_name?.replace('.mp3', '') || `Call ${index + 1}`,
          date: new Date(analysis.created_at).toLocaleDateString(),
          duration: analysis.recordings?.duration_seconds ? 
            `${Math.floor(analysis.recordings.duration_seconds / 60)}:${(analysis.recordings.duration_seconds % 60).toString().padStart(2, '0')}` : 
            'N/A',
          sentiment: analysis.sentiment_score || 0,
          engagement: analysis.engagement_score || 0,
          confidenceExecutive: analysis.confidence_score_executive || 0,
          confidencePerson: analysis.confidence_score_person || 0,
          status: 'completed',
          objections: analysis.objections_handled || 'None',
          nextSteps: analysis.next_steps || 'TBD',
          improvements: analysis.improvements || 'None',
          callOutcome: analysis.call_outcome || 'Unknown'
        }))
      }
    },
    enabled: !!recordings && !!analyses && !!metrics
  })
}

export function useDeleteRecording() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recordingId: string) => {
      // Delete the recording (analyses will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId)
        .eq('user_id', MOCK_USER_ID) // Extra security check
      
      if (error) throw error
      return recordingId
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })
      queryClient.invalidateQueries({ queryKey: ['metrics_aggregates'] })
    },
    onError: (error) => {
      console.error('Failed to delete recording:', error)
    }
  })
}
