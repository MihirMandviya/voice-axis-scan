import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, MessageSquare, Mic, TrendingUp, Users, Star, Target, AlertTriangle, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, Analysis, Recording } from "@/lib/supabase";

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisAndRecording = async () => {
      if (!id || !user) return;

      try {
        // Fetch analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', id)
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
  }, [id, user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent-blue";
    return "text-warning";
  };

  const getRiskColor = (risk: string) => {
    const lowerRisk = risk?.toLowerCase() || '';
    if (lowerRisk.includes('low')) return "text-success";
    if (lowerRisk.includes('medium') || lowerRisk.includes('moderate')) return "text-warning";
    return "text-red-500";
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

      <div className="w-full px-8 py-8 space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Closure Probability */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Closure Probability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.closure_probability || 0)}`}>
                {analysis.closure_probability || 0}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (analysis.closure_probability || 0) >= 80 ? 'bg-green-500' : 
                    (analysis.closure_probability || 0) >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${analysis.closure_probability || 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Acceptance Risk */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Candidate Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (analysis.candidate_acceptance_risk || 0) >= 80 ? 'text-red-500' : 
                (analysis.candidate_acceptance_risk || 0) >= 60 ? 'text-warning' : 'text-success'
              }`}>
                {analysis.candidate_acceptance_risk || 0}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (analysis.candidate_acceptance_risk || 0) >= 80 ? 'bg-red-500' : 
                    (analysis.candidate_acceptance_risk || 0) >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${analysis.candidate_acceptance_risk || 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-blue">
                {analysis.participants_count || 0}
              </div>
              {analysis.participants_names && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {analysis.participants_names}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recruiter Process Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                Recruiter Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor((analysis.recruiter_process_score || 0) * 10)}`}>
                {(analysis.recruiter_process_score || 0).toFixed(1)}/10
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (analysis.recruiter_process_score || 0) >= 8 ? 'bg-green-500' : 
                    (analysis.recruiter_process_score || 0) >= 6 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${((analysis.recruiter_process_score || 0) / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Recruiter Confidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />
                Recruiter Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor((analysis.recruiter_confidence_score || 0) * 10)}`}>
                {(analysis.recruiter_confidence_score || 0).toFixed(1)}/10
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (analysis.recruiter_confidence_score || 0) >= 8 ? 'bg-green-500' : 
                    (analysis.recruiter_confidence_score || 0) >= 6 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${((analysis.recruiter_confidence_score || 0) / 10) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Objections Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Objections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {(() => {
                      const objRaised = analysis.objections_detected || analysis.objections_raised || '';
                      const count = objRaised.split('\n').filter(line => line.trim()).length;
                      return count > 0 ? count : 0;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Raised</div>
                </div>
                <div className="text-3xl text-muted-foreground">→</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {(() => {
                      const objHandled = analysis.objections_handled || analysis.objections_handeled || '';
                      const count = objHandled.split('\n').filter(line => line.trim()).length;
                      return count > 0 ? count : 0;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Handled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Purpose of Call */}
          {analysis.purpose_of_call && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Purpose of Call
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysis.purpose_of_call}</p>
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          {analysis.exec_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysis.exec_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Outcome */}
          {analysis.outcome && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Call Outcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-foreground">{analysis.outcome}</p>
              </CardContent>
            </Card>
          )}

          {/* Closure Probability Reasoning and Candidate Acceptance Risk - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.closure_probability_reasoning && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Closure Probability Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {analysis.closure_probability_reasoning}
                  </p>
                </CardContent>
              </Card>
            )}

            {analysis.candidate_acceptance_risk && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Candidate Acceptance Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-lg font-medium ${getRiskColor(analysis.candidate_acceptance_risk)}`}>
                      {analysis.candidate_acceptance_risk}
                    </p>
                    {analysis.candidate_acceptance_risk_reasoning && (
                      <p className="text-muted-foreground leading-relaxed">
                        {analysis.candidate_acceptance_risk_reasoning}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Next Steps */}
          {analysis.next_steps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {analysis.next_steps}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Details */}
          {analysis.follow_up_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Follow-up Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysis.follow_up_details}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Feedback for Recruiter */}
          {analysis.ai_feedback_for_recruiter && (
            <Card className="border-2 border-accent-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent-blue">
                  <Star className="h-5 w-5" />
                  AI Feedback for Recruiter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {analysis.ai_feedback_for_recruiter}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Objections Section */}
          {(analysis.objections_detected || analysis.objections_raised || 
            analysis.objections_handled || analysis.objections_handeled) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Objections Detected/Raised */}
              {(analysis.objections_detected || analysis.objections_raised) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-warning" />
                      Objections Raised
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysis.objections_detected || analysis.objections_raised}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Objections Handled */}
              {(analysis.objections_handled || analysis.objections_handeled) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Objections Handled
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysis.objections_handled || analysis.objections_handeled}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Additional Details */}
          {analysis.additional_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(analysis.additional_details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Call Transcript */}
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

        </div>
      </div>
    </div>
  );
}
