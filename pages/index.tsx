import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { VibeType } from "../components/DropDown";
import Footer from "../components/Footer";
import Github from "../components/GitHub";
import Header from "../components/Header";
import LoadingDots from "../components/LoadingDots";
import Namespace, { NamespaceType } from "../components/Namespace";
import { OpenAI } from "langchain/llms/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { loadQAStuffChain, loadQAMapReduceChain } from "langchain/chains";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [generatedAnswers, setGeneratedAnswers] = useState<String>("");
  const [namespace, setNamespace] = useState<NamespaceType>("Earnings");
  const index_name='strategy-genius'
  const bioRef = useRef<null | HTMLDivElement>(null);

  const scrollToBios = () => {
    if (bioRef.current !== null) {
      bioRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  


  const generateBio = async (e: any) => {
    e.preventDefault();
    setGeneratedAnswers("");
    setLoading(true);

     var pinecone_client = new PineconeClient();
    await pinecone_client.init({
      environment: "asia-southeast1-gcp",
      apiKey: "ccbcc607-b94d-4f10-a339-7fa65aeebeeb",
    });
    const index=pinecone_client.Index(index_name);
    const llm = new OpenAI({
      openAIApiKey: "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",
      temperature: 0.9
    });
  
    const chainA = loadQAStuffChain(llm);

    const queryRequest = {
      topK: 10,
      includeValues: true,
      includeMetadata: true,
      namespace: 'earnings',
    };
    const queryResponse=await index.query({queryRequest})
    console.log(queryResponse)
    let x=await chainA.run(queryResponse)
  


    const prompt = `Based on the content below, answer the question ${question}` +  queryResponse;
  
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setGeneratedAnswers((prev) => prev + chunkValue);
    }
    scrollToBios();
    setLoading(false);
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>Twitter Bio Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
{/*         <a
          className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
          href="https://github.com/Nutlope/twitterbio"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github />
          <p>Star on GitHub</p>
        </a> */}
        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
          Ask me a Q
        </h1>
{/*         <p className="text-slate-500 mt-5">47,118 bios generated so far.</p>
 */}        <div className="max-w-xl w-full">
          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Ask me a Q{" "}
              <span className="text-slate-500">
                (like What is VF Corp's Revenue)
              </span>
              .
            </p>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
            placeholder={
              "What is VF Corp's Revenue?, Show me the easy-peel coffee product etc."
            }
          />
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Select your namespace.</p>
          </div>
        {/*   <div className="block">
            <DropDown vibe={vibe} setVibe={(newVibe) => setVibe(newVibe)} />
          </div> */}
          <div className="block">
            <Namespace namespace={namespace} setNamespace={(newNamespace) => setNamespace(newNamespace)} />
          </div>

          {!loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              onClick={(e) => generateBio(e)}
            >
              Generate your answer &rarr;
            </button>
          )}
          {loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              disabled
            >
              <LoadingDots color="white" style="large" />
            </button>
          )}
        </div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <div className="space-y-10 my-10">
          {generatedAnswers && (
            <>
              <div>
                <h2
                  className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
                  ref={bioRef}
                >
                  Your generated bios
                </h2>
              </div>
              <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
                {generatedAnswers
                  .substring(generatedAnswers.indexOf("1") + 3)
                  .split("2.")
                  .map((generatedAnswer) => {
                    return (
                      <div
                        className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedAnswer);
                          toast("Bio copied to clipboard", {
                            icon: "✂️",
                          });
                        }}
                        key={generatedAnswer}
                      >
                        <p>{generatedAnswer}</p>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
