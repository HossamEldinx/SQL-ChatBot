import { NextResponse } from "next/server";
import { QuerySqlTool } from "langchain/tools/sql";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

import {
  llm,
  datasource,
  database,
  writeQueryLc,
} from "@/app/helpers/DatabaseSetup";

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
    //handle creating the query
    const writeQuery = await writeQueryLc(db, "postgres");

    const executeQuery = new QuerySqlTool(db);

    //if you just want the query and sprated resutls
    /*
    const chain = writeQuery.pipe(executeQuery);
     const response = await chain.invoke({
      question: "How many albums are there?",
    });

    const dbResponse =await db.run(response);
    */

    /**Q&A  */
    //our prompt template that will give use final answer
    const answerPrompt =
      PromptTemplate.fromTemplate(`Given the following user question, corresponding SQL query, and SQL result, answer the user question.
    Question: {question}
    SQL Query: {query}
    SQL Result: {result}
    Answer: `);

    //use the template and give the llm
    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

    //make the sequence
    //first the query and resutls
    //give to our llm to get the final answer
    const chain = RunnableSequence.from([
      RunnablePassthrough.assign({ query: writeQuery }).assign({
        result: (i) => executeQuery.invoke(i.query),
      }),
      answerChain,
    ]);

    const sqlQuery = await writeQuery.invoke({
      question: question,
    });

    console.log("qqqqq" + JSON.stringify(sqlQuery));
    //excute the question
    const dbResponse = await chain.invoke({
      question: question,
    });

    return NextResponse.json({
      message: "done",
      table: db.allTables.map((t) => t.tableName),
      query: sqlQuery,
      results: dbResponse,
    });
  } catch (error) {
    console.log(error.message);
  }
}
