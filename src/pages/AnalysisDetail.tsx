import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, MessageSquare, Mic, TrendingUp, Users, Star, Target, AlertTriangle } from "lucide-react";
import { supabase, Analysis, Recording } from "@/lib/supabase";

const MOCK_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisAndRecording = async () => {
      if (!id) return;

      try {
        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
          .eq('user_id', MOCK_USER_ID)
          .single();

        if (analysisError) throw analysisError;

        // Fetch recording
        const { data: recordingData, error: recordingError } = await supabase
          .from('recordings')
          .select('*')
          .eq('id', analysisData.recording_id)
          .single();

        if (recordingError) throw recordingError;

        setAnalysis(analysisData);
        setRecording(recordingData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisAndRecording();
  }, [id]);

  const getSentimentColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent-blue";
    return "text-warning";
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-accent-blue";
    return "text-warning";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis || !recording) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Analysis Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested analysis could not be found.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const details = analysis.detailed_call_analysis || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/?tab=recordings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recordings
            </Button>
            <img 
              src="/logo.png" 
              alt="Tasknova" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.src = "/logo2.png";
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Call Analysis Details</h1>
              <p className="text-muted-foreground">
                <span className="font-semibold text-accent-blue">Tasknova</span> Voice Analysis • {recording.file_name || 'Recording'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getSentimentColor(analysis.sentiment_score || 0)}`}>
                {analysis.sentiment_score || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-blue">
                {analysis.engagement_score || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                Exec Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {analysis.confidence_score_executive || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Person Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-blue">
                {analysis.confidence_score_person || 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Short Summary */}
            {analysis.short_summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {analysis.short_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Evidence Quotes */}
            {details.evidence_quotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Key Evidence Quotes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg border-l-4 border-accent-blue">
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{details.evidence_quotes}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {details.next_steps_detailed ? (
                    details.next_steps_detailed.split(/\d+\)/).filter(Boolean).map((step: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-accent-blue text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{step.trim()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      {analysis.next_steps || 'No next steps defined'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Objections Detected */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Objections Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.objections_detected ? (
                    details.objections_detected.split(/\d+\)/).filter(Boolean).map((objection: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-warning text-white rounded-full flex items-center justify-center text-xs font-medium">
                          !
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{objection.trim()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      {analysis.objections_handled || 'No objections recorded'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Objections Handling */}
            {details.objections_handling_details && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    How Objections Were Handled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {details.objections_handling_details}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Improvements for Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Improvements for Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.improvements_for_team ? (
                    details.improvements_for_team.split(/\d+\)/).filter(Boolean).map((improvement: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-medium">
                          ✓
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{improvement.trim()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      {analysis.improvements || 'No improvements suggested'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Call Outcome */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Call Outcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-lg font-medium text-foreground">
                    {analysis.call_outcome || 'Unknown'}
                  </p>
                  {details.call_outcome_rationale && (
                    <p className="text-muted-foreground leading-relaxed">
                      {details.call_outcome_rationale}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Score Explanations */}
            <div className="space-y-4">
              {/* Sentiment Explanation */}
              {details.sentiments_explanation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {details.sentiments_explanation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Engagement Explanation */}
              {details.engagement_explanation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Engagement Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {details.engagement_explanation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Executive Confidence Explanation */}
              {details.confidence_explanation_executive && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Executive Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {details.confidence_explanation_executive}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Person Confidence Explanation */}
              {details.confidence_explanation_person && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Person Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {details.confidence_explanation_person}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Call Transcript
                </CardTitle>
                <CardDescription>
                  Full transcript of the recorded conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded border p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {recording.transcript || 'No transcript available for this recording.'}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Raw JSON Data (Optional - for debugging) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Raw Analysis Data
                </CardTitle>
                <CardDescription>
                  Technical details from the AI analysis pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
