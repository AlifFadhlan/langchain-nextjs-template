import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
// import prisma from "@/libs/prisma";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

// const TEMPLATE = `Anda adalah perekrut pekerjaan yang hanya mengajukan pertanyaan tentang UIUX. Anda harus memperluasnya dengan 20 kata lagi dalam pertanyaan Anda dengan lebih banyak pemikiran dan panduan. Anda sebaiknya hanya mengajukan satu pertanyaan dalam satu waktu. Jangan bertanya sebagai daftar! Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan mengarang jawaban. Jika sudah tiga pertanyaan, ucapkan terima kasih dan selesaikan percakapannya. Jangan menyapa
// Current conversation:
// {chat_history}

// User: {input}
// AI:`;

// const TEMPLATE2 =
//   `Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan.
//   Apa yang Anda minta hanya terdapat dalam daftar "ask_for" tersebut. 
//   Setelah Anda memilih item dalam daftar "ask_for", Anda harus memperpanjangnya dengan 20 kata lagi dalam pertanyaan Anda dengan pemikiran lebih lanjut dan terpadu.
//   Anda hanya boleh mengajukan satu pertanyaan pada satu waktu bahkan jika Anda tidak mendapatkan semua sesuai dengan daftar minta. 
//   Jangan bertanya dalam bentuk daftar!
//   Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan membuat jawaban.
//   Jika daftar ask_for kosong, maka ucapkan terima kasih kepada mereka dan perintahkan mereka untuk mengklik tombol selesai.
//   Jangan menyapa atau mengatakan hai.
//   ###  ask_for list: {ask_for}`;

  const TEMPLATE3 = `You are a job recruiter 
  who only ask questions in indonesian. What you asking for are 
  all about internship position for ui/ux designer for university 
  students you should extend it with 20 more words in your questions with more thoughts and 
  guide. You should only ask one question at a time. Don\'t ask as a list! ask only 1 questions per chat 
  and ask 3 in total, finish the interview after 3 questions Wait for user\'s answers after each question. 
  Don\'t make up answers. Don\'t greet or say hi. stop the interview and say thank you after the interviewee
   said anything related to enough`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const ask_for = ["pemahamaman Front-end", "pengalaman dalam membuat front-end website"];
    const prompt = PromptTemplate.fromTemplate(TEMPLATE3);

    const model = new ChatOpenAI({
      temperature: 0.8,
      modelName: "gpt-3.5-turbo-1106",
    });

   
    const outputParser = new HttpResponseOutputParser();

    
    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
      ask_for: ask_for.join(", "),
    });
    console.log(currentMessageContent);
    // for (const message of messages) {
    //   await prisma.message.create({
    //     data: {
    //       role: message.role,
    //       content: message.content,
    //     },
    //   });
    // } untuk ke database, masih error
    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
