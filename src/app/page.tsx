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

import { decompileMalware, type DecompileMalwareInput, type DecompileMalwareOutput } from "@/ai/flows/decompile-malware";
import { analyzeBinaryCode, type AnalyzeBinaryCodeInput, type AnalyzeBinaryCodeOutput } from "@/ai/flows/analyze-binary-code";
import { synthesizeReadableCode, type SynthesizeReadableCodeInput, type SynthesizeReadableCodeOutput } from "@/ai/flows/synthesize-readable-code";

import { FileCode, Binary, Lightbulb, ShieldAlert, Skull, FileText, AlertTriangle, UploadCloud, Loader2, Wand2 } from "lucide-react";

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
  const [obfuscatedCode, setObfuscatedCode] = useState<string>("");
  const [binaryFile, setBinaryFile] = useState<File | null>(null);
  const [binaryFileName, setBinaryFileName] = useState<string>("");


  // Outputs
  const [decompiledResult, setDecompiledResult] = useState<DecompileMalwareOutput | null>(null);
  const [binaryAnalysisResult, setBinaryAnalysisResult] = useState<AnalyzeBinaryCodeOutput | null>(null);
  const [synthesizedCodeResult, setSynthesizedCodeResult] = useState<SynthesizeReadableCodeOutput | null>(null);

  // Loading states
  const [isLoadingDecompile, setIsLoadingDecompile] = useState<boolean>(false);
  const [isLoadingAnalyze, setIsLoadingAnalyze] = useState<boolean>(false);
  const [isLoadingSynthesize, setIsLoadingSynthesize] = useState<boolean>(false);

  // Errors
  const [decompileError, setDecompileError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBinaryFile(event.target.files[0]);
      setBinaryFileName(event.target.files[0].name);
      setAnalyzeError(null); // Clear previous errors
      setBinaryAnalysisResult(null); // Clear previous results
    }
  };

  const handleDecompile = useCallback(async () => {
    if (!obfuscatedCode.trim()) {
      toast({ title: "Error", description: "Obfuscated code cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoadingDecompile(true);
    setDecompileError(null);
    setDecompiledResult(null);
    setSynthesizedCodeResult(null); // Clear previous synthesis
    try {
      const input: DecompileMalwareInput = { obfuscatedCode };
      const result = await decompileMalware(input);
      setDecompiledResult(result);
      toast({ title: "Decompilation Successful", description: "Malware code decompiled and analyzed." });
    } catch (error) {
      console.error("Decompilation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during decompilation.";
      setDecompileError(errorMessage);
      toast({ title: "Decompilation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingDecompile(false);
    }
  }, [obfuscatedCode, toast]);

  const handleAnalyzeBinary = useCallback(async () => {
    if (!binaryFile) {
      toast({ title: "Error", description: "Please select a binary file to analyze.", variant: "destructive" });
      return;
    }
    setIsLoadingAnalyze(true);
    setAnalyzeError(null);
    setBinaryAnalysisResult(null);
    try {
      const binaryCode = await fileToDataURI(binaryFile);
      const input: AnalyzeBinaryCodeInput = { binaryCode };
      const result = await analyzeBinaryCode(input);
      setBinaryAnalysisResult(result);
      toast({ title: "Binary Analysis Successful", description: "Binary file analyzed for vulnerabilities." });
    } catch (error) {
      console.error("Binary analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during binary analysis.";
      setAnalyzeError(errorMessage);
      toast({ title: "Binary Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingAnalyze(false);
    }
  }, [binaryFile, toast]);

  const handleSynthesize = useCallback(async () => {
    if (!decompiledResult?.decompiledCode) {
      toast({ title: "Error", description: "No decompiled code available to synthesize.", variant: "destructive" });
      return;
    }
    setIsLoadingSynthesize(true);
    setSynthesizeError(null);
    setSynthesizedCodeResult(null);
    try {
      const input: SynthesizeReadableCodeInput = { decompiledCode: decompiledResult.decompiledCode };
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
  }, [decompiledResult, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-150px)] rounded-lg border border-border shadow-xl">
          <ResizablePanel defaultSize={35} minSize={25}>
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                {/* Decompilation Input */}
                <ResultDisplayCard title="Decompile Malware" icon={FileCode} minHeight="auto" placeholderText="">
                  <div className="space-y-3">
                    <Label htmlFor="obfuscatedCode" className="text-sm font-medium">Obfuscated Code</Label>
                    <Textarea
                      id="obfuscatedCode"
                      placeholder="Paste obfuscated malware code here..."
                      value={obfuscatedCode}
                      onChange={(e) => setObfuscatedCode(e.target.value)}
                      rows={10}
                      className="font-mono text-xs"
                      disabled={isLoadingDecompile}
                    />
                    <Button onClick={handleDecompile} disabled={isLoadingDecompile || !obfuscatedCode.trim()} className="w-full">
                      {isLoadingDecompile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Decompile & Analyze
                    </Button>
                    {decompileError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{decompileError}</AlertDescription></Alert>}
                  </div>
                </ResultDisplayCard>

                {/* Binary Analysis Input */}
                <ResultDisplayCard title="Analyze Binary" icon={Binary} minHeight="auto" placeholderText="">
                   <div className="space-y-3">
                    <Label htmlFor="binaryFile" className="text-sm font-medium">Upload Binary File</Label>
                    <div className="relative flex items-center">
                        <Input
                            id="binaryFile"
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isLoadingAnalyze}
                            accept=".exe,.dll,.bin,application/octet-stream"
                        />
                        <Label 
                            htmlFor="binaryFile"
                            className="flex items-center justify-center w-full h-20 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer border-accent text-accent hover:bg-accent/10 transition-colors"
                        >
                            <UploadCloud className="w-8 h-8 mr-2" />
                            <span className="text-sm font-medium">
                                {binaryFileName ? binaryFileName : "Click or drag to upload file"}
                            </span>
                        </Label>
                    </div>
                    <Button onClick={handleAnalyzeBinary} disabled={isLoadingAnalyze || !binaryFile} className="w-full">
                      {isLoadingAnalyze ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                      Analyze Binary
                    </Button>
                    {analyzeError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{analyzeError}</AlertDescription></Alert>}
                  </div>
                </ResultDisplayCard>
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={25}>
                {/* Decompilation & Binary Analysis Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
                  <ResultDisplayCard
                    title="Decompilation Analysis"
                    icon={FileText}
                    isLoading={isLoadingDecompile}
                    placeholderText="Decompilation results will appear here."
                    minHeight="300px"
                     actionButton={
                        decompiledResult && !isLoadingSynthesize && (
                            <Button onClick={handleSynthesize} size="sm" variant="outline">
                                <Lightbulb className="mr-2 h-4 w-4" /> Synthesize Code
                            </Button>
                        )
                     }
                  >
                    {decompiledResult ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><FileCode className="w-4 h-4 mr-2 text-accent" /> Decompiled Code</h3>
                          <CodeBlock code={decompiledResult.decompiledCode || "No code decompiled."} />
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><FileText className="w-4 h-4 mr-2 text-accent" /> Analysis Report</h3>
                          <p className="text-sm whitespace-pre-wrap">{decompiledResult.analysisReport || "No analysis report."}</p>
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><Skull className="w-4 h-4 mr-2 text-accent" /> Potential Threats</h3>
                          <p className="text-sm whitespace-pre-wrap">{decompiledResult.potentialThreats || "No potential threats identified."}</p>
                        </div>
                        {synthesizeError && <Alert variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertTitle>Synthesis Error</AlertTitle><AlertDescription>{synthesizeError}</AlertDescription></Alert>}
                      </div>
                    ) : decompileError ? (
                       <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Decompilation Failed</AlertTitle><AlertDescription>{decompileError}</AlertDescription></Alert>
                    ) : null}
                  </ResultDisplayCard>

                  <ResultDisplayCard
                    title="Binary Vulnerability Report"
                    icon={ShieldAlert}
                    isLoading={isLoadingAnalyze}
                    placeholderText="Binary analysis results will appear here."
                     minHeight="300px"
                  >
                    {binaryAnalysisResult ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><ShieldAlert className="w-4 h-4 mr-2 text-accent" /> Identified Vulnerabilities</h3>
                          {binaryAnalysisResult.vulnerabilities?.length > 0 ? (
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {binaryAnalysisResult.vulnerabilities.map((vuln, i) => <li key={i}>{vuln}</li>)}
                            </ul>
                          ) : <p className="text-sm italic">No vulnerabilities identified.</p>}
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><Skull className="w-4 h-4 mr-2 text-accent" /> Malicious Behavior</h3>
                           {binaryAnalysisResult.maliciousBehavior?.length > 0 ? (
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {binaryAnalysisResult.maliciousBehavior.map((behav, i) => <li key={i}>{behav}</li>)}
                            </ul>
                          ) : <p className="text-sm italic">No malicious behavior identified.</p>}
                        </div>
                         <div>
                          <h3 className="text-md font-semibold mb-1 flex items-center"><FileText className="w-4 h-4 mr-2 text-accent" /> Analysis Summary</h3>
                          <p className="text-sm whitespace-pre-wrap">{binaryAnalysisResult.summary || "No summary provided."}</p>
                        </div>
                      </div>
                    ) : analyzeError ? (
                       <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Failed</AlertTitle><AlertDescription>{analyzeError}</AlertDescription></Alert>
                    ) : null}
                  </ResultDisplayCard>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={20}>
                {/* Synthesized Code Results */}
                <div className="p-4 h-full">
                  <ResultDisplayCard
                    title="Synthesized Readable Code"
                    icon={Lightbulb}
                    isLoading={isLoadingSynthesize}
                    placeholderText="Synthesized code will appear here after successful decompilation and synthesis."
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
