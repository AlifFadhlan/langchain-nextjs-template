import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    console.log(formattedPreviousMessages.join("\n"));
    // Save the messages to the database

    // satu message satu row
    for (const message of messages) {
      await prisma.message.create({
        data: {
          role: message.role,
          content: message.content,
        },
      });
    }

    // banyak message di satu row
    // await prisma.message.create({
    //   data: {
    //     role: "assistant",
    //     content: formattedPreviousMessages.join("\n"),
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
