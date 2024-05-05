import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const messages = body.messages ?? [];
      console.log(messages);
      // Save the messages to the database
      for (const message of messages) {
        await prisma.message.create({
          data: {
            role: message.role,
            content: message.content,
          },
        });
      }
  
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
    }
  }