import { ClientOptions as OpenAiClientOptions } from 'openai';
import { ClientOptions as ClaudeClientOption } from '@anthropic-ai/sdk';
import { LLMProvider } from './llm.types';
import { Tool } from './action.types';
import { WorkflowCallback } from './workflow.types';

export interface ClaudeConfig {
  llm: 'claude';
  apiKey: string;
  modelName?: string;
  options?: ClaudeClientOption;
}

export interface OpenaiConfig {
  llm: 'openai';
  apiKey: string;
  modelName?: string;
  options?: OpenAiClientOptions;
}

export type ClaudeApiKey = string;

export type LLMConfig = ClaudeApiKey | ClaudeConfig | OpenaiConfig | LLMProvider;

export interface AwareConfig {
  workingWindowId?: number;
  chromeProxy?: typeof chrome;
  callback?: WorkflowCallback;
  patchServerUrl?: string;
}

export interface AwareInvokeParam {
  tools?: (Tool<any, any> | string)[];
}

export interface ExecutionContext {
  awareConfig: AwareConfig;
  llmProvider: LLMProvider;
  callback?: WorkflowCallback;
}

export interface WorkflowResult {
  success: boolean;
  error?: Error;
  data?: any;
}

export type WorkflowTranscript = string

export interface WorkflowArtifact {} // TODO
