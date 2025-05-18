
"use client";

import { useState, type ChangeEvent, useCallback } from "react";
import AppHeader from "@/components/app-header";
import CodeBlock from "@/components/code-block";
import ResultDisplayCard from "@/components/result-display-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import { performAnalysis, type PerformAnalysisInput, type PerformAnalysisOutput } from "@/ai/flows/perform-analysis-flow";

import { ShieldAlert, Skull, FileText, AlertTriangle, UploadCloud, Loader2, Microscope, Binary } from "lucide-react";

const fileToDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ClarityPage() {
  const { toast } = useToast();

  // Inputs
  const [binaryFileInput, setBinaryFileInput] = useState<File | null>(null);
  const [binaryFileInputName, setBinaryFileInputName] = useState<string>("");

  // Outputs
  const [analysisOutput, setAnalysisOutput] = useState<PerformAnalysisOutput | null>(null);

  // Loading states
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // Errors
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBinaryFileInput(event.target.files[0]);
      setBinaryFileInputName(event.target.files[0].name);
      setAnalysisError(null);
      setAnalysisOutput(null);
    } else {
      setBinaryFileInput(null);
      setBinaryFileInputName("");
    }
  };

  const handlePerformAnalysis = useCallback(async () => {
    if (!binaryFileInput) {
      toast({ title: "Error", description: "Please upload a binary file to analyze.", variant: "destructive" });
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisOutput(null);
    try {
      const input: PerformAnalysisInput = {};
      if (binaryFileInput) {
        input.binaryFileDataUri = await fileToDataURI(binaryFileInput);
      }
      
      const result = await performAnalysis(input);
      setAnalysisOutput(result);
      toast({ title: "Analysis Complete", description: "Review the binary analysis results." });
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
      setAnalysisError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [binaryFileInput, toast]);

  const canPerformAnalysis = !!binaryFileInput;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-150px)] rounded-lg border border-border shadow-xl">
          <ResizablePanel defaultSize={35} minSize={25}>
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                <ResultDisplayCard title="Analysis Input" icon={Microscope} minHeight="auto" placeholderText="">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="binaryFile" className="text-sm font-medium">Upload Binary File</Label>
                      <div className="relative flex items-center mt-1">
                          <Input
                              id="binaryFile"
                              type="file"
                              onChange={handleFileChange}
                              className="hidden"
                              disabled={isLoadingAnalysis}
                              accept=".exe,.dll,.bin,.so,.dylib,application/octet-stream,application/x-mach-binary,application/x-executable,application/vnd.microsoft.portable-executable"
                          />
                          <Label 
                              htmlFor="binaryFile"
                              className="flex items-center justify-center w-full h-20 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer border-accent text-accent hover:bg-accent/10 transition-colors"
                          >
                              <UploadCloud className="w-8 h-8 mr-2" />
                              <span className="text-sm font-medium">
                                  {binaryFileInputName ? binaryFileInputName : "Click or drag to upload file"}
                              </span>
                          </Label>
                      </div>
                    </div>
                    <Button onClick={handlePerformAnalysis} disabled={isLoadingAnalysis || !canPerformAnalysis} className="w-full mt-4">
                      {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Binary className="mr-2 h-4 w-4" />}
                      Analyze Binary File
                    </Button>
                    {analysisError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>}
                  </div>
                </ResultDisplayCard>
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="p-4 h-full">
              <ResultDisplayCard
                title="Binary Vulnerability Report"
                icon={ShieldAlert}
                isLoading={isLoadingAnalysis && !!binaryFileInput}
                placeholderText={!binaryFileInput && !isLoadingAnalysis ? "Upload a binary file to see its analysis." : "Binary analysis results will appear here."}
                minHeight="calc(100% - 2rem)" // Adjust to fill panel
              >
                {analysisOutput?.binaryAnalysisResult ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-semibold mb-1 flex items-center"><ShieldAlert className="w-4 h-4 mr-2 text-accent" /> Identified Vulnerabilities</h3>
                      {analysisOutput.binaryAnalysisResult.vulnerabilities?.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {analysisOutput.binaryAnalysisResult.vulnerabilities.map((vuln, i) => <li key={i}>{vuln}</li>)}
                        </ul>
                      ) : <p className="text-sm italic">No vulnerabilities identified.</p>}
                    </div>
                    <div>
                      <h3 className="text-md font-semibold mb-1 flex items-center"><Skull className="w-4 h-4 mr-2 text-accent" /> Malicious Behavior</h3>
                       {analysisOutput.binaryAnalysisResult.maliciousBehavior?.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {analysisOutput.binaryAnalysisResult.maliciousBehavior.map((behav, i) => <li key={i}>{behav}</li>)}
                        </ul>
                      ) : <p className="text-sm italic">No malicious behavior identified.</p>}
                    </div>
                     <div>
                      <h3 className="text-md font-semibold mb-1 flex items-center"><FileText className="w-4 h-4 mr-2 text-accent" /> Analysis Summary</h3>
                      <p className="text-sm whitespace-pre-wrap">{analysisOutput.binaryAnalysisResult.summary || "No summary provided."}</p>
                    </div>
                  </div>
                ) : analysisError && binaryFileInput ? ( 
                   <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Failed</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>
                ) : null}
              </ResultDisplayCard>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
