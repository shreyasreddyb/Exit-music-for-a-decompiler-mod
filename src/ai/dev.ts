import { config } from 'dotenv';
config();

import '@/ai/flows/decompile-malware';
import '@/ai/flows/analyze-binary-code';
import '@/ai/flows/synthesize-readable-code';
import '@/ai/flows/perform-analysis-flow';
