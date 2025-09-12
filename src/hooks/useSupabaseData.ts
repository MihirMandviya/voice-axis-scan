import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Recording, Analysis, MetricsAggregate } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useRecordings() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['recordings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Recording[]
    },
    enabled: !!user
  })
}

export function useAnalyses() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['analyses', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
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
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Analysis & { recordings: Recording })[]
    },
    enabled: !!user
  })
}

export function useMetricsAggregates() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['metrics_aggregates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('metrics_aggregates')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      return data as MetricsAggregate[]
    },
    enabled: !!user
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
      
      // Additional KPIs
      const highPerformingCalls = analyses.filter(a => (a.sentiment_score || 0) >= 80 && (a.engagement_score || 0) >= 75).length
      const callsWithNextSteps = analyses.filter(a => a.next_steps && a.next_steps !== 'TBD' && a.next_steps.trim().length > 10).length
      const totalObjectionsRaised = analyses.reduce((sum, a) => sum + (a.objections_raised || 0), 0)
      const totalObjectionsTackled = analyses.reduce((sum, a) => sum + (a.objections_tackled || 0), 0)
      const objectionSuccessRate = totalObjectionsRaised > 0 ? (totalObjectionsTackled / totalObjectionsRaised) * 100 : 0

      // Sentiment distribution - 5 categories
      const sentimentData = [
        { 
          name: 'Perfect', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 90).length,
          color: '#10B981' // Emerald green for perfect
        },
        { 
          name: 'Excellent', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 80 && (a.sentiment_score || 0) < 90).length,
          color: '#059669' // Dark green for excellent
        },
        { 
          name: 'Good', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 70 && (a.sentiment_score || 0) < 80).length,
          color: 'hsl(var(--accent-blue))' // Blue for good
        },
        { 
          name: 'Neutral', 
          value: analyses.filter(a => (a.sentiment_score || 0) >= 50 && (a.sentiment_score || 0) < 70).length,
          color: '#F59E0B' // Amber for neutral
        },
        { 
          name: 'Negative', 
          value: analyses.filter(a => (a.sentiment_score || 0) < 50).length,
          color: '#EF4444' // Red for negative
        }
      ]

      // Trend data from metrics
      const trendData = metrics.slice(-7).map(m => ({
        date: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
        sentiment: m.avg_sentiment || 0,
        engagement: m.avg_engagement || 0
      }))

      // Engagement levels - 5 categories
      const engagementData = [
        { level: 'Perfect', count: analyses.filter(a => (a.engagement_score || 0) >= 90).length, fill: '#10B981' },
        { level: 'Excellent', count: analyses.filter(a => (a.engagement_score || 0) >= 80 && (a.engagement_score || 0) < 90).length, fill: '#059669' },
        { level: 'Good', count: analyses.filter(a => (a.engagement_score || 0) >= 70 && (a.engagement_score || 0) < 80).length, fill: 'hsl(var(--accent-blue))' },
        { level: 'Neutral', count: analyses.filter(a => (a.engagement_score || 0) >= 50 && (a.engagement_score || 0) < 70).length, fill: '#F59E0B' },
        { level: 'Negative', count: analyses.filter(a => (a.engagement_score || 0) < 50).length, fill: '#EF4444' }
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
          highPerformingCalls,
          callsWithNextSteps,
          totalObjectionsRaised,
          totalObjectionsTackled,
          objectionSuccessRate
        },
        sentimentData,
        trendData,
        engagementData,
        objectionData,
        
        // Last 10 calls sentiment trend data for line chart
        last10CallsSentiment: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 10) || `Call ${index + 1}`,
          sentiment: Math.round(analysis.sentiment_score || 0),
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
        // Last 10 calls confidence data for bar chart
        last10CallsConfidence: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 8) || `Call ${index + 1}`,
          executive: analysis.confidence_score_executive || 0,
          person: analysis.confidence_score_person || 0,
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
        // Last 10 calls objections data for visualization
        last10CallsObjections: analyses.slice(0, 10).reverse().map((analysis, index) => ({
          call: `Call ${index + 1}`,
          callName: analysis.recordings?.file_name?.replace('.mp3', '').substring(0, 8) || `Call ${index + 1}`,
          raised: analysis.objections_raised || 0,
          tackled: analysis.objections_tackled || 0,
          date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })),
        
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (recordingId: string) => {
      if (!user) throw new Error('User not authenticated')
      
      // Delete the recording (analyses will be deleted automatically due to CASCADE)
      // RLS policies ensure users can only delete their own recordings
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId)
      
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
