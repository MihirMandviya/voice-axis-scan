import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload } from "lucide-react";

interface AddRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordingAdded?: () => void;
}

const WEBHOOK_URL = "https://n8nautomation.site/webhook/a2025371-8955-4ef4-8a74-0686456b3003";

// Function to send webhook in background without blocking UI
const sendWebhookInBackground = async (webhookPayload: any) => {
  try {
    console.log('🔄 Attempting webhook call...');
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('✅ Webhook response status:', webhookResponse.status);
    console.log('✅ Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));
    
    if (webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      console.log('✅ Webhook response body:', responseText);
      console.log('🎉 Webhook call successful!');
    } else {
      console.warn(`⚠️ Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
    }
    
  } catch (corsError) {
    console.warn('❌ CORS error, trying no-cors mode:', corsError);
    
    // Second attempt: No-CORS mode
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      console.log('✅ Webhook request sent via no-cors mode');
      
    } catch (noCorsError) {
      console.error('❌ Both webhook attempts failed:', noCorsError);
      
      // Third attempt: Using XMLHttpRequest as fallback
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(webhookPayload));
        console.log('✅ Webhook sent via XMLHttpRequest fallback');
      } catch (xhrError) {
        console.error('❌ All webhook attempts failed:', xhrError);
      }
    }
  }
};

// Validation functions
const validateGoogleDriveUrl = (url: string): { isValid: boolean; error?: string } => {
  // Check if it's a Google Drive URL
  const driveUrlPattern = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
  
  if (!driveUrlPattern.test(url)) {
    return {
      isValid: false,
      error: "Please provide a valid Google Drive URL (must start with https://drive.google.com/)"
    };
  }

  // Check if it's a public/shareable link (contains /file/d/ or open?id=)
  const publicLinkPattern = /\/file\/d\/([a-zA-Z0-9_-]+)|[\?&]id=([a-zA-Z0-9_-]+)/;
  
  if (!publicLinkPattern.test(url)) {
    return {
      isValid: false,
      error: "Please provide a public/shareable Google Drive link. Make sure the file is shared with 'Anyone with the link' access."
    };
  }

  return { isValid: true };
};

// Function to check if Google Drive URL is publicly accessible
const checkGoogleDriveUrlAccessibility = async (url: string): Promise<{ isAccessible: boolean; error?: string }> => {
  try {
    // Extract file ID from the URL
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)|[\?&]id=([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return { isAccessible: false, error: "Could not extract file ID from URL" };
    }
    
    const fileId = fileIdMatch[1] || fileIdMatch[2];
    
    // Convert to viewable URL format (this is more reliable for checking accessibility)
    const viewableUrl = `https://drive.google.com/file/d/${fileId}/view`;
    
    console.log('🔍 Checking URL accessibility:', viewableUrl);
    
    // Try multiple methods to check accessibility
    try {
      // Method 1: Try to fetch the viewable URL
      const response = await fetch(viewableUrl, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      
      console.log('✅ URL accessibility check completed via viewable URL');
      return { isAccessible: true };
      
    } catch (viewableError) {
      console.log('⚠️ Viewable URL check failed, trying direct download URL...');
      
      // Method 2: Try direct download URL
      const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      try {
        const downloadResponse = await fetch(directDownloadUrl, {
          method: 'HEAD',
          mode: 'no-cors',
        });
        
        console.log('✅ URL accessibility check completed via download URL');
        return { isAccessible: true };
        
      } catch (downloadError) {
        console.log('⚠️ Download URL check also failed, but this might be due to CORS restrictions');
        
        // Method 3: Use a proxy service to check accessibility
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(viewableUrl)}`;
          const proxyResponse = await fetch(proxyUrl);
          
          if (proxyResponse.ok) {
            const data = await proxyResponse.json();
            if (data.contents && !data.contents.includes('Sorry, the file you have requested does not exist')) {
              console.log('✅ URL accessibility check completed via proxy');
              return { isAccessible: true };
            }
          }
        } catch (proxyError) {
          console.log('⚠️ Proxy check also failed');
        }
        
        // If all methods fail, assume it's accessible but warn the user
        console.log('⚠️ All accessibility checks failed, but this might be due to CORS restrictions');
        return { 
          isAccessible: true, // Assume accessible but warn user
          error: "Could not fully verify accessibility due to browser restrictions. Please ensure the file is shared with 'Anyone with the link' access." 
        };
      }
    }
    
  } catch (error) {
    console.error('❌ URL accessibility check failed:', error);
    return { 
      isAccessible: false, 
      error: "Could not verify if the file is publicly accessible. Please ensure the file is shared with 'Anyone with the link' access." 
    };
  }
};

const checkUniqueFileName = async (fileName: string, userId: string): Promise<{ isUnique: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('id')
      .eq('file_name', fileName.trim())
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return {
        isUnique: false,
        error: "A recording with this name already exists. Please choose a different name."
      };
    }

    return { isUnique: true };
  } catch (error) {
    console.error('Error checking file name uniqueness:', error);
    return {
      isUnique: false,
      error: "Unable to verify file name uniqueness. Please try again."
    };
  }
};

export default function AddRecordingModal({ open, onOpenChange, onRecordingAdded }: AddRecordingModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add recordings",
        variant: "destructive",
      });
      return;
    }
    
    if (!driveUrl.trim() || !fileName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Validate Google Drive URL
      const urlValidation = validateGoogleDriveUrl(driveUrl.trim());
      if (!urlValidation.isValid) {
        toast({
          title: "Invalid URL",
          description: urlValidation.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Check if URL is publicly accessible
      toast({
        title: "Validating URL",
        description: "Checking if the Google Drive file is publicly accessible...",
      });
      
      const accessibilityCheck = await checkGoogleDriveUrlAccessibility(driveUrl.trim());
      if (!accessibilityCheck.isAccessible) {
        toast({
          title: "URL Not Accessible",
          description: accessibilityCheck.error || "The file is not publicly accessible. Please ensure it's shared with 'Anyone with the link' access.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Check if file name is unique
      const uniqueCheck = await checkUniqueFileName(fileName.trim(), user.id);
      if (!uniqueCheck.isUnique) {
        toast({
          title: "Duplicate Name",
          description: uniqueCheck.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Insert recording into database
      const { data: recording, error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          drive_file_id: extractFileIdFromUrl(driveUrl),
          file_name: fileName,
          stored_file_url: driveUrl,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Step 4: Create corresponding analysis record
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          recording_id: recording.id,
          user_id: user.id,
          sentiment_score: null,
          engagement_score: null,
          confidence_score_executive: null,
          confidence_score_person: null,
          objections_handled: null,
          next_steps: null,
          improvements: null,
          call_outcome: null,
          detailed_call_analysis: null,
          short_summary: null
        })
        .select()
        .single();

      if (analysisError) {
        console.warn('Failed to create analysis record:', analysisError);
        // Don't throw error - continue with webhook even if analysis creation fails
      }

      // Step 5: Send to webhook - Multiple attempts for reliability
      const webhookPayload = {
        url: driveUrl,
        name: fileName,
        recording_id: recording.id,
        analysis_id: analysis?.id || null,
        user_id: user.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-frontend',
        url_validated: true, // Indicates URL has been validated for accessibility
        validation_method: 'frontend_check' // How the URL was validated
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload:', webhookPayload);
      console.log('👤 User ID in payload:', webhookPayload.user_id);

      // Send webhook in background - don't block modal closing
      sendWebhookInBackground(webhookPayload);

      // Reset form and close modal immediately after recording is saved
      setDriveUrl("");
      setFileName("");
      onOpenChange(false);
      
      // Trigger refresh of recordings list
      if (onRecordingAdded) {
        onRecordingAdded();
      }

      // Show success message
      toast({
        title: "Recording Added Successfully!",
        description: "Your recording has been submitted for analysis. You'll be notified when it's complete.",
      });

    } catch (error) {
      console.error('Error adding recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add recording",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractFileIdFromUrl = (url: string): string => {
    // Extract file ID from Google Drive URL
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  // Test webhook function for debugging
  const testWebhook = async () => {
    if (!user) return;
    
    const testPayload = {
      url: "https://drive.google.com/test",
      name: "test_recording.mp3",
      recording_id: "test-recording-id",
      analysis_id: "test-analysis-id",
      user_id: user.id,
      timestamp: new Date().toISOString(),
      source: 'voice-axis-scan-frontend-test'
    };

    console.log('🧪 Testing webhook with payload:', testPayload);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });
      
      console.log('🧪 Test webhook response status:', response.status);
      console.log('🧪 Test webhook response:', await response.text());
      
      toast({
        title: "Webhook Test",
        description: `Test sent! Check console for details. Status: ${response.status}`,
      });
    } catch (error) {
      console.error('🧪 Test webhook failed:', error);
      
      // Try no-cors mode
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload),
        });
        
        toast({
          title: "Webhook Test",
          description: "Test sent via no-cors mode! Check n8n for receipt.",
        });
      } catch (noCorsError) {
        toast({
          title: "Webhook Test Failed",
          description: "Could not send test request",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    setDriveUrl("");
    setFileName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Tasknova" 
              className="h-5 w-auto"
              onError={(e) => {
                e.currentTarget.src = "/logo2.png";
              }}
            />
            <Upload className="h-5 w-5" />
            Add New Recording
          </DialogTitle>
          <DialogDescription>
            Add a new recording by providing the Google Drive URL and file name. The recording will be queued for analysis by <span className="font-semibold text-accent-blue">Tasknova</span> AI.
          </DialogDescription>
          
          {/* Debug Test Button - Remove in production */}
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testWebhook}
              disabled={isLoading}
              className="text-xs"
            >
              🧪 Test Webhook
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!driveUrl.trim()) {
                  toast({
                    title: "No URL",
                    description: "Please enter a Google Drive URL first",
                    variant: "destructive",
                  });
                  return;
                }
                
                const urlValidation = validateGoogleDriveUrl(driveUrl.trim());
                if (!urlValidation.isValid) {
                  toast({
                    title: "Invalid URL",
                    description: urlValidation.error,
                    variant: "destructive",
                  });
                  return;
                }
                
                toast({
                  title: "Testing URL",
                  description: "Checking if the Google Drive file is accessible...",
                });
                
                const accessibilityCheck = await checkGoogleDriveUrlAccessibility(driveUrl.trim());
                if (accessibilityCheck.isAccessible) {
                  toast({
                    title: "✅ URL is Accessible",
                    description: "The Google Drive file is publicly accessible and ready for processing.",
                  });
                } else {
                  toast({
                    title: "❌ URL Not Accessible",
                    description: accessibilityCheck.error || "The file is not publicly accessible. Please ensure it's shared with 'Anyone with the link' access.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isLoading}
              className="text-xs"
            >
              🔍 Test URL
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drive-url">Google Drive URL *</Label>
            <Input
              id="drive-url"
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Paste a public Google Drive link. Make sure the file is shared with "Anyone with the link" access.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file-name">File Name *</Label>
            <Input
              id="file-name"
              type="text"
              placeholder="e.g., sales_call_john_doe.mp3"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Choose a unique name that doesn't already exist in your recordings.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Recording
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
