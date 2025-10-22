import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Home, Upload, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import type { Applicant, RequiredDocumentsState } from "@/types/applicant";

const UploadDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const applicantId = searchParams.get("applicant");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [moveInDate, setMoveInDate] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<RequiredDocumentsState>({
    passport: false,
    eid: false,
    visa: false,
    salaryConfirmation: false,
    bankStatement: false
  });

  useEffect(() => {
    const fetchApplicant = async () => {
      if (!applicantId) return;
      
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', applicantId)
        .single();
      
      if (error) {
        console.error('Error fetching applicant:', error);
        toast({
          title: "Error",
          description: "Could not load applicant information",
          variant: "destructive"
        });
      } else {
        const typedApplicant = data as Applicant;
        setApplicant(typedApplicant);
        if (typedApplicant.move_in_date) {
          setMoveInDate(typedApplicant.move_in_date);
        }
      }
    };

    fetchApplicant();
  }, [applicantId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicantId) {
      toast({
        title: "Error",
        description: "Invalid applicant ID",
        variant: "destructive"
      });
      return;
    }

    if (!moveInDate) {
      toast({
        title: "Error",
        description: "Please enter your desired move-in date",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('applicants')
        .update({
          move_in_date: moveInDate,
          required_documents: uploadedDocs
        })
        .eq('id', applicantId);

      if (error) throw error;

      toast({
        title: "Documents Submitted!",
        description: "Thank you for providing the requested information. We will review your documents and contact you soon.",
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast({
        title: "Error",
        description: "Failed to submit documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!applicantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This link appears to be invalid. Please contact us for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>
              <Home className="mr-2 w-4 h-4" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Upload Documents</h1>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
          >
            <Home className="mr-2 w-4 h-4" />
            Back to Website
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Document Upload Request</CardTitle>
            <CardDescription>
              Dear Mr./Ms. {applicant.last_name},
              <br /><br />
              Thanks a lot for your application. We would just need some further info.
              <br /><br />
              Best regards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="moveInDate">Desired Move-in Date *</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  required
                />
              </div>

              <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Required Documents
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm which documents you can provide:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="passport"
                      checked={uploadedDocs.passport}
                      onCheckedChange={(checked) =>
                        setUploadedDocs({ ...uploadedDocs, passport: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="passport"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Passport
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eid"
                      checked={uploadedDocs.eid}
                      onCheckedChange={(checked) =>
                        setUploadedDocs({ ...uploadedDocs, eid: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="eid"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      EID
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visa"
                      checked={uploadedDocs.visa}
                      onCheckedChange={(checked) =>
                        setUploadedDocs({ ...uploadedDocs, visa: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="visa"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Visa
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="salary"
                      checked={uploadedDocs.salaryConfirmation}
                      onCheckedChange={(checked) =>
                        setUploadedDocs({ ...uploadedDocs, salaryConfirmation: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="salary"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Salary Confirmation
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bank"
                      checked={uploadedDocs.bankStatement}
                      onCheckedChange={(checked) =>
                        setUploadedDocs({ ...uploadedDocs, bankStatement: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="bank"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Bank Statement
                    </label>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="mr-2 w-4 h-4" />
                    Submit Information
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadDocuments;
