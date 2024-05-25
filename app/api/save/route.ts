import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const history = formattedPreviousMessages.join("\n");
    console.log(formattedPreviousMessages.join("\n"));

    const model = new ChatOpenAI({
      temperature: 1,
      modelName: "gpt-3.5-turbo-1106",
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      "Buat kesimpulan dari percakapan berikut:\n\n${history}",
    );
    const chain = promptTemplate.pipe(model);

    const result = await chain.invoke({ history: history });
    const content = result.content;
    // Save the messages to the database

    // satu message satu row
    // for (const message of messages) {
    //   await prisma.message.create({
    //     data: {
    //       role: message.role,
    //       content: message.content,
    //     },
    //   });
    // }

    // banyak message di satu row
    await prisma.message.create({
      data: {
        role: JSON.stringify(content),
        content: formattedPreviousMessages.join("\n"),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
