import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import mysql from 'mysql2/promise';

export const runtime = "edge";

// Buat koneksi ke database
const connection = await mysql.createConnection({
  host: '127.0.0.1:3306',
  user: 'root',
  password: '',
  database: 'db_chatbot'
});


const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `Anda adalah perekrut pekerjaan yang hanya mengajukan pertanyaan tentang UIUX. Anda harus memperluasnya dengan 20 kata lagi dalam pertanyaan Anda dengan lebih banyak pemikiran dan panduan. Anda sebaiknya hanya mengajukan satu pertanyaan dalam satu waktu. Jangan bertanya sebagai daftar! Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan mengarang jawaban. Jika sudah tiga pertanyaan, ucapkan terima kasih dan selesaikan percakapannya.Jangan menyapa atau menyapa
Current conversation:
{chat_history}

User: {input}
AI:`;

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    if (currentMessageContent.trim().toLowerCase() === 'selesai') {
      const chatHistory = formattedPreviousMessages.join("\n");
      const [rows] = await connection.execute(
        'INSERT INTO chat_history (content) VALUES (?)',
        [chatHistory]
      );
      await connection.end();
      return NextResponse.json({ message: 'Obrolan telah dihentikan.' });
    }
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    /**
     * You can also try e.g.:
     *
     * import { ChatAnthropic } from "langchain/chat_models/anthropic";
     * const model = new ChatAnthropic({});
     *
     * See a full list of supported models at:
     * https://js.langchain.com/docs/modules/model_io/models/
     */
    const model = new ChatOpenAI({
      temperature: 0.8,
      modelName: "gpt-3.5-turbo-1106",
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    const outputParser = new HttpResponseOutputParser();

    /**
     * Can also initialize as:
     *
     * import { RunnableSequence } from "@langchain/core/runnables";
     * const chain = RunnableSequence.from([prompt, model, outputParser]);
     */
    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });
    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
