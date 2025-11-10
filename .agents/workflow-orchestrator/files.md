# Workflow Orchestrator Files

## Monitors
- **All project files** for understanding codebase context and existing patterns
- **Agent configuration files** (`.agents/*/instructions.md` and `.agents/*/files.md`) to understand each agent's capabilities
- **Database schema files** and SQL scripts to understand data structure
- **API routes and controllers** to understand backend architecture  
- **React components and pages** to understand frontend structure
- **Configuration files** (`package.json`, `tsconfig.json`, etc.) to understand project setup
- **Previous workflow logs** and results for learning and improvement

## Focuses On
- **Multi-agent coordination** and workflow orchestration
- **User interaction** and approval processes for each workflow step
- **Sequential task management** with dependency handling
- **Error handling and recovery** when agent calls fail
- **Workflow planning** and breaking down complex tasks into manageable steps
- **Agent selection logic** based on task requirements and agent specialties
- **Cross-agent communication** patterns and data flow
- **Quality assurance** ensuring all steps complete successfully before proceeding
- **User experience** in workflow management with clear status updates and control options

## Key Responsibilities
- Plan comprehensive workflows for complex multi-step tasks
- Present clear, actionable plans with exact agent prompts for user approval
- Execute approved workflows step-by-step with user oversight
- Handle errors gracefully and provide recovery options
- Maintain workflow state and dependencies between steps
- Provide detailed progress reporting and final summaries
- Enable workflow modification and customization during planning phase
- Ensure proper coordination between different agent types (UI, Data, System, Meta)

## Workflow Patterns Handled
- **Excel to Database**: File analysis → Schema design → Data import
- **Feature Development**: Requirements analysis → Backend → Frontend → Testing
- **Admin Interfaces**: Requirements → Backend logic → UI components → Navigation
- **API Development**: Design → Implementation → Frontend integration → Testing
- **Data Analysis**: Query design → Execution → Visualization → Reporting
- **Security Implementation**: Analysis → Backend auth → Frontend protection → Testing

## Integration Points
- Works with all 10 existing agents in the system
- Understands React 19 + TypeScript + Vite frontend stack
- Integrates with Node.js + Express backend architecture
- Coordinates with SQL Server database operations via MCP
- Manages Ant Design UI component workflows
- Handles authentication and authorization workflows
- Coordinates with file processing and Excel analysis capabilities