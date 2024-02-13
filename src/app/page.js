"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [done, setDone] = useState(false);
  const [agent, setAgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question) return;

    setLoading(true);
    let result;
    if (agent) {
      result = await fetch(`/api/sqlagent/?q=${question}`);
    } else {
      result = await fetch(`/api/querychain/?q=${question}`);
    }
    const json = await result.json();

    setResult(json);
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-grow h-screen flex flex-col justify-between mx-auto max-w-4xl px-4 chat-area">
        {" "}
        <div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              class="sr-only peer"
              onChange={(e) => setAgent(!agent)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              Agent On
            </span>
          </label>
        </div>
        <div className="chat-space">
          {result && !loading && <Markdown content={result.results} />}
          {result && result.query && !loading && (
            <Markdown content={result.query} />
          )}
        </div>
        <form
          onSubmit={handleSend}
          className="flex items-center py-3 input-box"
        >
          <input
            type="text"
            className="flex-1 p-2 border rounded-l-md input"
            placeholder="Ask Question"
            value={question}
            onInput={(e) => {
              setQuestion(e.target.value);
            }}
          />
          <button
            type="submit"
            className="bg-orange-600 text-dark p-2 rounded-r-md hover:bg-orange-400"
          >
            send
          </button>
        </form>
        {loading && "Loading..."}
      </div>
    </div>
  );
}

const Markdown = ({ content }) => (
  <ReactMarkdown
    className="prose mt-1 w-full break-words prose-p:leading-relaxed  py-3 px-3 mark-down"
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, ...props }) => (
        <a {...props} style={{ color: "#27afcf", fontWeight: "bold" }} />
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);
