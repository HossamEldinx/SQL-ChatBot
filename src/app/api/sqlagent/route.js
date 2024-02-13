import { NextResponse } from "next/server";
import { DataSource } from "typeorm";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  datasource,
  database,
  writeQueryLc,
  
} from "@/app/helpers/DatabaseSetup";
import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";
import { SqlToolkit } from "langchain/agents/toolkits/sql";
//import { AIMessage } from "langchain/schema";
import { AIMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 });

export async function GET(request) {
  try {
    const question = request.nextUrl.searchParams.get("q");
    if (!question) {
      return NextResponse.json(
        {
          error: "Missing question parameter",
        },
        { status: 400 }
      );
    }

    const db = await database();
    const sqlToolKit = new SqlToolkit(db, llm);
    const tools = sqlToolKit.getTools();
    const SQL_PREFIX = `You are an agent designed to interact with a SQL database.
                        Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
                        Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT clause.
                        You can order the results by a relevant column to return the most interesting examples in the database.
                        Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
                        You have access to tools for interacting with the database.
                        Only use the below tools.
                        Only use the information returned by the below tools to construct your final answer.
                        You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.

                        DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.

                        If the question does not seem related to the database, just return "I don't know" as the answer.`;
    const SQL_SUFFIX = `Begin!

                        Question: {input}
                        Thought: I should look at the tables in the database to see what I can query.
                        {agent_scratchpad}`;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SQL_PREFIX],
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new AIMessage(SQL_SUFFIX.replace("{agent_scratchpad}", "")),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const newPrompt = await prompt.partial({
      dialect: sqlToolKit.dialect,
      top_k: "10",
    });

    const runnableAgent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt: newPrompt,
    });

    const agentExecutor = new AgentExecutor({
      agent: runnableAgent,
      tools,
    });
    //. Which county customers bought the most?
    //"List the  artist per album

    const result = await agentExecutor.invoke({
      input: question,
    });
    console.log(result);
    return NextResponse.json({
      message: "done",
      results:result.output,
    });
  } catch (error) {
    console.log(error);
  }
}
