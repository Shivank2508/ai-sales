import { Tool } from "./tools/tool.interface";

export class ToolRegistry {
    private readonly tools = new Map<string, Tool>()


    register(tool: Tool) {
        this.tools.set(tool.name, tool)
    }

    get(name: string) {
        return this.tools.get(name)
    }

    getAll() {
        return Array.from(
            this.tools.values()
        )
    }
}