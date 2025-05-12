# Aware Framework

A powerful AI agent workflow framework designed for building and orchestrating complex AI-driven automation tasks.

## Features

- 🚀 **Workflow-Based Architecture**: Build complex AI tasks using a modular workflow system
- 🔄 **Dynamic Execution**: Support for conditional branching and parallel execution
- 🛠 **Extensible Tools**: Rich set of built-in tools with easy extension capabilities
- 🤖 **LLM Integration**: Seamless integration with various LLM providers
- 🔍 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 📊 **Monitoring**: Built-in logging and monitoring capabilities

## Quick Start

### Prerequisites

- Node.js (>= 18.0.0)
- npm (latest stable version)

### Installation

```bash
npm install @aware/framework
```

### Basic Usage

```typescript
import { Workflow, WorkflowBuilder } from '@aware/framework';

// Create a simple workflow
const workflow = new WorkflowBuilder()
  .addNode('search', {
    type: 'action',
    action: {
      type: 'script',
      name: 'webSearch',
      params: {
        query: '${searchQuery}'
      }
    }
  })
  .build();

// Execute the workflow
const result = await workflow.execute({
  variables: {
    searchQuery: 'AI frameworks comparison'
  }
});
```

## Architecture

Aware is built on a modular architecture with several key components:

- **Workflow Engine**: Core execution engine for managing workflow states
- **Node System**: Extensible node types for different operations
- **Tool Registry**: Plugin system for adding new capabilities
- **Type System**: Comprehensive type definitions for safety
- **Context Management**: Workflow context and variable management

## Documentation

For detailed documentation, please visit:

- [Getting Started](docs/getting-started.md)
- [Core Concepts](docs/core-concepts.md)
- [API Reference](docs/api-reference.md)
- [Tool Development](docs/tool-development.md)
- [Advanced Usage](docs/advanced-usage.md)

## Examples

Check out our [examples directory](examples/) for various use cases:

- Basic workflow creation
- Complex branching logic
- Tool integration
- Custom node types
- Error handling patterns

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/aware.git
cd aware

# Install dependencies
npm install

# Run tests
npm test

# Start development mode
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](docs/)
- 💬 [Discussions](https://github.com/your-org/aware/discussions)
- 🐛 [Issue Tracker](https://github.com/your-org/aware/issues)

## Acknowledgments

Special thanks to all contributors and the open source community for making this project possible.

---

Built with ❤️ by the Aware Team

