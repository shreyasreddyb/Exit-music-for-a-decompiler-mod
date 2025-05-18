import { config } from 'dotenv';
config();

import '@/ai/flows/decompile-malware.ts';
import '@/ai/flows/analyze-binary-code.ts';
import '@/ai/flows/synthesize-readable-code.ts';