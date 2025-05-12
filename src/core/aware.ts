import { LLMProviderFactory } from '../services/llm/provider-factory';
import { WorkflowGenerator } from '../services/workflow/generator';
import {
  LLMConfig,
  AwareConfig,
  AwareInvokeParam,
  LLMProvider,
  Tool,
  Workflow,
  WorkflowCallback,
  ExecutionContext,
  WorkflowResult
} from '../types';
import { ToolRegistry } from './tool-registry';

/**
 * Aware core
 */
export class Aware {
  public static tools: Map<string, Tool<any, any>> = new Map();

  private llmProvider: LLMProvider;
  private awareConfig: AwareConfig;
  private toolRegistry = new ToolRegistry();
  private workflowGeneratorMap = new Map<Workflow, WorkflowGenerator>();
  public prompt: string = "";
  public tabs: chrome.tabs.Tab[] = [];
  public workflow?: Workflow = undefined;

  constructor(llmConfig: LLMConfig, awareConfig?: AwareConfig) {
    console.info("using Aware@" + process.env.COMMIT_HASH);
    console.warn("this version is POC, should not used for production");
    this.llmProvider = LLMProviderFactory.buildLLMProvider(llmConfig);
    this.awareConfig = this.buildAwareConfig(awareConfig);
    this.registerTools();
  }

  private buildAwareConfig(awareConfig: Partial<AwareConfig> | undefined): AwareConfig {
    if (!awareConfig) {
      console.warn("`awareConfig` is missing when construct `Aware` instance");
    }
    const defaultAwareConfig: AwareConfig = {
      workingWindowId: undefined,
      chromeProxy: typeof chrome === 'undefined' ? undefined : chrome,
      callback: undefined,
      patchServerUrl: "http://127.0.0.1:8000/aware",
    };
    return {
      ...defaultAwareConfig,
      ...awareConfig,
    };
  }

  private registerTools() {
    let tools = Array.from(Aware.tools.entries()).map(([_key, tool]) => tool);

    // filter human tools by callbacks
    const callback = this.awareConfig.callback;
    if (callback) {
      const hooks = callback.hooks;

      // these tools could not work without corresponding hook
      const tool2isHookExists: { [key: string]: boolean } = {
        "human_input_text": Boolean(hooks.onHumanInputText),
        "human_input_single_choice": Boolean(hooks.onHumanInputSingleChoice),
        "human_input_multiple_choice": Boolean(hooks.onHumanInputMultipleChoice),
        "human_operate": Boolean(hooks.onHumanOperate),
      };
      tools = tools.filter(tool => {
        if (tool.name in tool2isHookExists) {
          let isHookExists = tool2isHookExists[tool.name]
          return isHookExists;
        } else {
          return true;
        }
      });
    } else {
      console.warn("`awareConfig.callback` is missing when construct `Aware` instance.")
    }
    
    tools.forEach(tool => this.toolRegistry.registerTool(tool));
  }

  public async generate(prompt: string, tabs: chrome.tabs.Tab[] = [], param?: AwareInvokeParam): Promise<Workflow> {
    this.prompt = prompt;
    this.tabs = tabs;
    let toolRegistry = this.toolRegistry;
    if (param && param.tools && param.tools.length > 0) {
      toolRegistry = new ToolRegistry();
      for (let i = 0; i < param.tools.length; i++) {
        let tool = param.tools[i];
        if (typeof tool == 'string') {
          toolRegistry.registerTool(this.getTool(tool));
        } else {
          toolRegistry.registerTool(tool);
        }
      }
    }
    const generator = new WorkflowGenerator(this.llmProvider, toolRegistry);
    const workflow = await generator.generateWorkflow(prompt, this.awareConfig);
    this.workflowGeneratorMap.set(workflow, generator);
    console.log("the workflow returned by generate");
    console.log(workflow);
    this.workflow = workflow;
    return workflow;
  }

  public async execute(workflow: Workflow): Promise<WorkflowResult> {
    let prompt = this.prompt;
    let description ="";
    workflow.nodes.forEach(node => {
      description += node.name + "\n";
    })
    const json = {
      "id": "workflow_id",
      "name": prompt,
      "description": prompt,
      "nodes": [
        {
          "id": "sub_task_id",
          "type": "action",
          "action": {
            "type": "prompt",
            "name": prompt,
            "description": description,
            "tools": [
              "browser_use",
              "document_agent",
              "export_file",
              "extract_content",
              "open_url",
              "tab_management",
              "web_search",
              "human_input_text",
              "human_input_single_choice",
              "human_input_multiple_choice",
              "human_operate",
            ],
          },
          "dependencies": []
        },
      ],
    };
    console.log("debug the workflow...");
    console.log(json);
    console.log("debug the workflow...done");
    
    console.log("debug the LLMProvider...");
    console.log(this.llmProvider);
    console.log("debug the LLMProvider...done");
    
    const generator = new WorkflowGenerator(this.llmProvider, this.toolRegistry);  
    workflow = await generator.generateWorkflowFromJson(json, this.awareConfig);
    this.workflow = workflow;

    // Inject LLM provider at workflow level
    workflow.llmProvider = this.llmProvider;

    // Process each node's action
    for (const node of workflow.nodes) {
      if (node.action.type === 'prompt') {
        // Inject LLM provider
        node.action.llmProvider = this.llmProvider;

        // Resolve tools
        node.action.tools = node.action.tools.map(tool => {
          if (typeof tool === 'string') {
            return this.toolRegistry.getTool(tool);
          }
          return tool;
        });
      }
    }

    const result = await workflow.execute(this.awareConfig.callback);
    console.log(result);
    return result;
  }

  public async cancel(): Promise<void> {
    if (this.workflow) {
      return await this.workflow.cancel();
    } else {
      throw Error("`Aware` instance do not have a `workflow` member");
    }
  }

  public async modify(workflow: Workflow, prompt: string): Promise<Workflow> {
    const generator = this.workflowGeneratorMap.get(workflow) as WorkflowGenerator;
    workflow = await generator.modifyWorkflow(prompt, this.awareConfig);
    this.workflowGeneratorMap.set(workflow, generator);
    return workflow;
  }

  private getTool(toolName: string) {
    let tool: Tool<any, any>;
    if (this.toolRegistry.hasTools([toolName])) {
      tool = this.toolRegistry.getTool(toolName);
    } else if (Aware.tools.has(toolName)) {
      tool = Aware.tools.get(toolName) as Tool<any, any>;
    } else {
      throw Error(`Tool with name "${toolName}" not found`);
    }
    return tool;
  }

  public async callTool(
    tool: Tool<any, any> | string,
    input: object,
    callback?: WorkflowCallback
  ): Promise<any> {
    if (typeof tool === 'string') {
      tool = this.getTool(tool);
    }
    const context: ExecutionContext = {
      awareConfig: this.awareConfig,
      llmProvider: this.llmProvider,
      callback: callback || this.awareConfig.callback,
    };
    return await tool.run(input, context);
  }

  public registerTool(tool: Tool<any, any>): void {
    Aware.tools.set(tool.name, tool);
  }

  public unregisterTool(toolName: string): void {
    Aware.tools.delete(toolName);
  }
}

export default Aware;
