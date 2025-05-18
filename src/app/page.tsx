"use client";

import { useState, type ChangeEvent, useCallback } from "react";
import AppHeader from "@/components/app-header";
import CodeBlock from "@/components/code-block";
import ResultDisplayCard from "@/components/result-display-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

import { performAnalysis, type PerformAnalysisInput, type PerformAnalysisOutput } from "@/ai/flows/perform-analysis-flow";
import { synthesizeReadableCode, type SynthesizeReadableCodeInput, type SynthesizeReadableCodeOutput } from "@/ai/flows/synthesize-readable-code";

import { FileCode, Binary, Lightbulb, ShieldAlert, Skull, FileText, AlertTriangle, UploadCloud, Loader2, Wand2, Microscope } from "lucide-react";

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
  const [obfuscatedCodeInput, setObfuscatedCodeInput] = useState<string>("");
  const [binaryFileInput, setBinaryFileInput] = useState<File | null>(null);
  const [binaryFileInputName, setBinaryFileInputName] = useState<string>("");

  // Outputs
  const [analysisOutput, setAnalysisOutput] = useState<PerformAnalysisOutput | null>(null);
  const [synthesizedCodeResult, setSynthesizedCodeResult] = useState<SynthesizeReadableCodeOutput | null>(null);

  // Loading states
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [isLoadingSynthesize, setIsLoadingSynthesize] = useState<boolean>(false);

  // Errors
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

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
    if (!obfuscatedCodeInput.trim() && !binaryFileInput) {
      toast({ title: "Error", description: "Please provide obfuscated code or a binary file to analyze.", variant: "destructive" });
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisOutput(null);
    setSynthesizedCodeResult(null); 
    try {
      const input: PerformAnalysisInput = {};
      if (obfuscatedCodeInput.trim()) {
        input.obfuscatedCode = obfuscatedCodeInput;
      }
      if (binaryFileInput) {
        input.binaryFileDataUri = await fileToDataURI(binaryFileInput);
      }
      
      const result = await performAnalysis(input);
      setAnalysisOutput(result);
      toast({ title: "Analysis Complete", description: "Review the decompilation and binary analysis results." });
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
      setAnalysisError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [obfuscatedCodeInput, binaryFileInput, toast]);

  const handleSynthesize = useCallback(async () => {
    if (!analysisOutput?.decompilationResult?.decompiledCode) {
      toast({ title: "Error", description: "No decompiled code available to synthesize.", variant: "destructive" });
      return;
    }
    setIsLoadingSynthesize(true);
    setSynthesizeError(null);
    setSynthesizedCodeResult(null);
    try {
      const input: SynthesizeReadableCodeInput = { decompiledCode: analysisOutput.decompilationResult.decompiledCode };
      const result = await synthesizeReadableCode(input);
      setSynthesizedCodeResult(result);
      toast({ title: "Code Synthesis Successful", description: "Readable code synthesized." });
    } catch (error) {
      console.error("Code synthesis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during code synthesis.";
      setSynthesizeError(errorMessage);
      toast({ title: "Code Synthesis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingSynthesize(false);
    }
  }, [analysisOutput, toast]);

  const canPerformAnalysis = obfuscatedCodeInput.trim() || binaryFileInput;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-150px)] rounded-lg border border-border shadow-xl">
          <ResizablePanel defaultSize={35} minSize={25}>
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                <ResultDisplayCard title="Analysis Inputs" icon={Microscope} minHeight="auto" placeholderText="">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="obfuscatedCode" className="text-sm font-medium">Obfuscated Code (Optional)</Label>
                      <Textarea
                        id="obfuscatedCode"
                        placeholder="Paste obfuscated malware code here..."
                        value={obfuscatedCodeInput}
                        onChange={(e) => {
                          setObfuscatedCodeInput(e.target.value);
                          setAnalysisError(null);
                          setAnalysisOutput(null);
                        }}
                        rows={8}
                        className="font-mono text-xs mt-1"
                        disabled={isLoadingAnalysis}
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground my-2">OR</div>
                    <div>
                      <Label htmlFor="binaryFile" className="text-sm font-medium">Upload Binary File (Optional)</Label>
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
                      {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Perform Full Analysis
                    </Button>
                    {analysisError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>}
                  </div>
                </ResultDisplayCard>
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={25}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
                  <ResultDisplayCard
                    title="Decompilation Analysis"
                    icon={FileText}
                    isLoading={isLoadingAnalysis && !!obfuscatedCodeInput.trim()}
                    placeholderText={!obfuscatedCodeInput.trim() && !isLoadingAnalysis ? "Provide obfuscated code to see decompilation results." : "Decompilation results will appear here."}
                    minHeight="300px"
                     actionButton={
                        analysisOutput?.decompilationResult && !isLoadingSynthesize && (
                            <Button onClick={handleSynthesize} size="sm" variant="outline">
                                <Lightbulb className="mr-2 h-4 w-4" /> Synthesize Code
                            </Button>
                        )
                     }
                  >
                    {analysisOutput?.decompilationResult ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><FileCode className="w-4 h-4 mr-2 text-accent" /> Decompiled Code</h3>
                          <CodeBlock code={analysisOutput.decompilationResult.decompiledCode || "No code decompiled."} />
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><FileText className="w-4 h-4 mr-2 text-accent" /> Analysis Report</h3>
                          <p className="text-sm whitespace-pre-wrap">{analysisOutput.decompilationResult.analysisReport || "No analysis report."}</p>
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><Skull className="w-4 h-4 mr-2 text-accent" /> Potential Threats</h3>
                          <p className="text-sm whitespace-pre-wrap">{analysisOutput.decompilationResult.potentialThreats || "No potential threats identified."}</p>
                        </div>
                        {synthesizeError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Synthesis Error</AlertTitle><AlertDescription>{synthesizeError}</AlertDescription></Alert>}
                      </div>
                    ) : analysisError && obfuscatedCodeInput.trim() ? ( // Show error only if this part was attempted
                       <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Decompilation Failed</AlertTitle><AlertDescription>{analysisError.split(';').find(e => e.toLowerCase().includes('decompilation')) || analysisError}</AlertDescription></Alert>
                    ) : null}
                  </ResultDisplayCard>

                  <ResultDisplayCard
                    title="Binary Vulnerability Report"
                    icon={ShieldAlert}
                    isLoading={isLoadingAnalysis && !!binaryFileInput}
                    placeholderText={!binaryFileInput && !isLoadingAnalysis ? "Upload a binary file to see its analysis." : "Binary analysis results will appear here."}
                     minHeight="300px"
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
                    ) : analysisError && binaryFileInput ? ( // Show error only if this part was attempted
                       <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Failed</AlertTitle><AlertDescription>{analysisError.split(';').find(e => e.toLowerCase().includes('binary analysis')) || analysisError}</AlertDescription></Alert>
                    ) : null}
                  </ResultDisplayCard>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="p-4 h-full">
                  <ResultDisplayCard
                    title="Synthesized Readable Code"
                    icon={Lightbulb}
                    isLoading={isLoadingSynthesize}
                    placeholderText={!analysisOutput?.decompilationResult?.decompiledCode && !isLoadingAnalysis ? "Synthesized code will appear after successful decompilation and synthesis." : "Synthesized code will appear here."}
                     minHeight="250px"
                  >
                    {synthesizedCodeResult ? (
                      <CodeBlock code={synthesizedCodeResult.readableCode || "No code synthesized."} />
                    ) : synthesizeError ? (
                      <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Synthesis Failed</AlertTitle><AlertDescription>{synthesizeError}</AlertDescription></Alert>
                    ) : null}
                  </ResultDisplayCard>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
