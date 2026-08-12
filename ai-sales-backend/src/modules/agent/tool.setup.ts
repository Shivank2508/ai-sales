import { ToolRegistry } from "./tool.registry";
import { AnswerTool } from "./tools/answer.tool";
import { CompareProductsTool } from "./tools/compare-products.tool";
import { ListDocumentsTool } from "./tools/list-documents.tool";

import { SearchKnowledgeTool } from "./tools/search-knowledge.tool";
import { SearchLeadsTool } from "./tools/search-leads.tool";
import { SearchProductTool } from "./tools/search-product.tool";

export const toolRegistry =
    new ToolRegistry();

toolRegistry.register(
    new SearchKnowledgeTool()
);

toolRegistry.register(
    new SearchProductTool()
);

toolRegistry.register(
    new SearchLeadsTool()
);

toolRegistry.register(
    new ListDocumentsTool()
);

toolRegistry.register(
    new CompareProductsTool()
);

toolRegistry.register(
    new AnswerTool()
);
