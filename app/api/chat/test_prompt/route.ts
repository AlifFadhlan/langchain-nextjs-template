import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import {
  PromptTemplate,
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
} from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const examples = [
  {
    input:
      "Karena perusahaan Anda terkenal dan memiliki banyak proyek yang menarik",
    output: "Mengapa memilih perusahaan kami?",
  },
  {
    input: "Iya, saya pernah mengikuti pelatihan tentang UIUX",
    output: "Apakah kamu pernah mengikuti pelatihan?",
  },
  {
    input: "Tidak pernah",
    output: "Apakah kamu pernah ikut lomba?",
  },
  {
    input: "Ya, saya pernah bekerja secara tim",
    output: "Apakah kamu pernah bekerja secara tim?",
  },
  {
    input: "Iya, saat saya kuliah saya pernah mengerjakan proyek dari nol",
    output: "Apakah kamu pernah mengerjakan proyek dari nol?",
  },
];

const examplePrompt = ChatPromptTemplate.fromTemplate(`AI: {output}
User: {input}`);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const ask_for = [
      "1. Tools apa yang kamu gunakan untuk membuat desain UIUX?",
      "2. Apa yang kamu ketahui tentang desain UIUX?",
      "3. Apa yang kamu ketahui tentang user experience?",
      "4. Apa yang kamu ketahui tentang user interface?",
      "5. Apa yang kamu ketahui tentang user research?",
    ];

    const fewShotPrompt = new FewShotChatMessagePromptTemplate({
      prefix: `Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan. Anda akan mengajukan sepuluh pertanyaan setelah User mengetik "Halo", 
      terdapat lima pertanyaan umum dan lima pertanyaan tentang UIUX.
      Berikut list pertanyaan umum yang harus ditanyakan:
      1. Mengapa memilih perusahaan kami?
      2. Apakah kamu pernah mengikuti pelatihan?
      3. Apakah kamu pernah ikut lomba?
      4. Apakah kamu pernah bekerja secara tim?
      5. Apakah kamu pernah mengerjakan proyek dari nol?
      Untuk 5 pertanyaan tentang UIUX Anda dapat memilih nya di list "ask for".
      Anda hanya boleh mengajukan satu pertanyaan pada satu waktu.
      Anda tidak boleh mengajukan pertanyaan yang sama.
      Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan membuat jawaban.
      Jika jawaban pengguna tidak sesuai dengan yang ditanyakan, tetap lanjutkan ke pertanyaan berikutnya.
      Jika sudah 10 pertanyaan, ucapkan terima kasih dan selesaikan percakapannya. Jangan menyapa.
      ###  List ask_for: {ask_for}
      Percakapan berlangsung: {chat_history}`,
      suffix: "User : {input}",
      examplePrompt,
      examples,
      inputVariables: ["input", "ask_for", "chat_history"],
    });

    const model = new ChatOpenAI({
      temperature: 1,
      modelName: "gpt-3.5-turbo-1106",
    });

    const outputParser = new HttpResponseOutputParser();

    const chain = fewShotPrompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
      ask_for: ask_for.join(", "),
    });
    console.log(messages);
    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

// import { ChatOpenAI } from "@langchain/openai";
// import { RunnableSequence } from "@langchain/core/runnables";
// import { StringOutputParser } from "@langchain/core/output_parsers";

// const model = new ChatOpenAI({});

// const questionPrompt = PromptTemplate.fromTemplate(
//   "Ask the user about their work experience. Start with 'Can you tell me about your experience with...?'",
// );

// const chain = RunnableSequence.from([
//   {
//     input: "work_experience",
//     run: (input) => model.call(questionPrompt.format({ experience: input })),
//   },
//   new StringOutputParser(),
// ]);

// const result = await chain.invoke({ input: "software development" });
// console.log({ result });
