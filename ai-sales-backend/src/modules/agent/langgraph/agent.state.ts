import { Annotation, } from "@langchain/langgraph";
export const AgentState = Annotation.Root({
    question: Annotation<string>(),
    conversationId: Annotation<string>(),
})