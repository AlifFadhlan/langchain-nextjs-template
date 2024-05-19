import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import {
  PromptTemplate,
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
} from "@langchain/core/prompts";
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

const TEMPLATE2 = `Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan.
  Apa yang Anda minta hanya terdapat dalam daftar "ask_for" tersebut. 
  Setelah Anda memilih item dalam daftar "ask_for", Anda harus memperpanjangnya dengan 20 kata lagi dalam pertanyaan Anda dengan pemikiran lebih lanjut dan terpadu.
  Anda hanya boleh mengajukan satu pertanyaan pada satu waktu bahkan jika Anda tidak mendapatkan semua sesuai dengan daftar ask_for. 
  Jangan bertanya dalam bentuk daftar!
  Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan membuat jawaban.
  Jika daftar ask_for kosong, maka ucapkan terima kasih kepada mereka dan perintahkan mereka untuk mengklik tombol selesai.
  Jangan menyapa atau mengatakan hai.
  ###  Daftar ask_for: {ask_for}
  percakapan berlangsung: {chat_history}
  
  User: {input}
  AI:`;

// const TEMPLATE3 = `You are a job recruiter
// who only ask questions in indonesian. What you asking for are
// all about internship position for ui/ux designer for university
// students you should extend it with 20 more words in your questions with more thoughts and
// guide. You should only ask one question at a time. Don\'t ask as a list! ask only 1 questions per chat
// and ask 3 in total, finish the interview after 3 questions Wait for user\'s answers after each question.
// Don\'t make up answers. Don\'t greet or say hi. stop the interview and say thank you after the interviewee
//  said anything related to enough`;

const TEMPLATE4 = `Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan kepada user. Anda hanya boleh mengajukan satu pertanyaan pada satu waktu. Jangan menanyakan dalam bentuk list. 
    Anda akan mengajukan sepuluh pertanyaan setelah User mengetik "Halo", terdapat lima pertanyaan umum dan lima pertanyaan tentang UIUX. Tanyakan pertanyaan secara berurutan dari nomor 1. 
      Berikut list pertanyaan umum yang harus ditanyakan:
      1. Mengapa memilih perusahaan kami?
      2. Apakah kamu pernah mengikuti pelatihan?
      3. Apakah kamu pernah ikut lomba?
      4. Apakah kamu pernah bekerja secara tim?
      5. Apakah kamu pernah mengerjakan proyek dari nol?
      Untuk 5 pertanyaan tentang UIUX Anda dapat memilih nya di list "ask for".
      Jangan mengajukan pertanyaan yang sama.
      Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan membuat jawaban.
      Jika jawaban pengguna tidak sesuai dengan yang ditanyakan, lanjutkan ke pertanyaan berikutnya.
      Jika seluruh pertanyaan sudah Anda tanyakan, ucapkan terima kasih, beri tahu user untuk klik tombol submit untuk menyelesaikan wawancara, dan selesaikan percakapannya. Jangan menyapa.
      List ask_for: {ask_for}.
      Percakapan yang telah dilalui: {chat_history}.

      Contoh percakapan:
      AI: Mengapa anda memilih perusahaan kami?
      User: Karena perusahaan anda sudah terkenal.

      Sekarang giliran anda bertanya.

      User: {input}
  AI:`;

const TEMPLATE6 = `Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan kepada user. Anda hanya boleh mengajukan satu pertanyaan pada satu waktu. Jangan menanyakan dalam bentuk list. 
    Anda akan mengajukan pertanyaan-pertanyaan setelah User mengetik "Halo", terdapat pertanyaan umum dan pertanyaan tentang spesifik. Tanyakan pertanyaan secara berurutan dimulai dari pertanyaan yang pertama. 
      Berikut list pertanyaan umum yang harus ditanyakan:
      1. Bisakah Anda menyebutkan Nama, dan Asal anda dari mana?
      2. a. Mengapa Anda tertarik untuk bergabung dengan perusahaan kami sebagai magang? b. Apakah Anda memiliki pemahaman khusus tentang industri atau visi kami?
      3. Mengapa anda memilih magang dalam bidang UI/UX?
      4. a. Apakah Anda pernah mengikuti pelatihan, lomba, atau terlibat dalam organisasi yang relevan dengan bidang magang yang Anda lamar? b.Jika pernah, berapa lama dan peran anda sebagai apa? c. Apa yang Anda dapatkan dari pengalaman tersebut?
      5. Bagaimana Anda menilai keterampilan (Skill) yang Anda miliki saat ini? (1 Sangat Kurang, 2 Kurang, 3 Cukup, 4 Baik , 5 Mahir) 
      6. a. Jika Anda sebagai anggota di dalam sebuah tim, Bagaimana cara anda berkoordinasi dengan anggota tim lainnya? b. Bagaimana cara Anda menangani perbedaan pendapat dengan anggota tim lainnya?
      Untuk pertanyaan spesifik terdapat di list "ask for".
      Jangan mengajukan pertanyaan yang sama.
      Tunggu jawaban pengguna setelah setiap pertanyaan. Jangan membuat jawaban.
      Jika jawaban pengguna tidak sesuai dengan yang ditanyakan, lanjutkan ke pertanyaan berikutnya.
      Jika seluruh pertanyaan sudah Anda tanyakan, ucapkan terima kasih, beri tahu user untuk klik tombol submit untuk menyelesaikan wawancara, dan selesaikan percakapannya. Jika user merespons lagi tetap selesaikan percakapan dan minta user menekan tombol submit.
      List ask_for: {ask_for}.
      Percakapan yang telah dilalui: {chat_history}.

      Contoh percakapan:
      AI: Bisakah Anda menyebutkan Nama, dan Asal anda dari mana?
      User: Nama saya Andi, saya berasal dari Jakarta.

      Sekarang giliran anda bertanya.

      User: {input}
  AI:`;

const TEMPLATE5 = `you are an internship recruiter who only asks questions in Indonesian. you only allowed questions one at a time, don't ask in a list. you will ask 10 questions after the user says "halo", there are 5 general questions and 5 specific questions about UI/UX. asks in order from question number 1 
      here are the general questions you need to ask:
      1. why choose our company?
      2. have you ever participated in a course or boot camp?
      3. have you ever been in a competition?
      4. have you ever worked in a team before?
      5. have you ever started a project from scratch?
      for the 5 specific questions about UI/UX you can ask in order from the "ask for" list
      you are not allowed to ask the same questions
      wait for the answer before asking another one. don't answer the questions you ask.
      if the answers from the user doesn't quite as you expected, just continue to the next questions
      if you already asked 10 questions, say thank you and end the conversation. don't greet 
      ###  List ask_for: {ask_for}
      current conversation: {chat_history}
      User: {input}
  AI:`;
const examples = [
  {
    input: " ",
    output: " ",
  },
];

const examplePrompt = ChatPromptTemplate.fromTemplate(`
AI:
Anda adalah seorang rekruter magang yang hanya mengajukan pertanyaan. Anda akan mengajukan sepuluh pertanyaan setelah User mengetik "Halo", 
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
      Percakapan berlangsung: {chat_history}
      
      Human : {input}`);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const ask_for = [
      "6. Tools apa yang kamu gunakan untuk membuat desain UIUX?",
      "7. Apa yang kamu ketahui tentang desain UIUX?",
      "8. Apa yang kamu ketahui tentang user experience?",
      "9. Apa yang kamu ketahui tentang user interface?",
      "10. Apa yang kamu ketahui tentang user research?",
    ];
    // const ask_for = [
    //   "7. a. Apakah pernah memiliki pengalaman desain UI/UX? (Opsi jawaban ; Pernah, Tidak Pernah). b. Jika pernah, ceritakan proyek desain UI/UX sebelumnya yang Anda banggakan dan mengapa Anda merasa demikian?",
    //   "8. Apa alat (tools) atau perangkat lunak yang Anda kuasai dalam desain UI/UX?",
    //   "9. a. Bagaimana cara Anda menganalisis kebutuhan pengguna dalam proses desain UI/UX Anda? b. Bisakah Anda menjelaskan langkah-langkah konkret yang Anda ambil untuk memahami kebutuhan pengguna?",
    //   "10. Bagaimana Anda memastikan konsistensi desain antara berbagai halaman atau fitur dalam sebuah aplikasi atau situs web?",
    // ];
    const prompt = PromptTemplate.fromTemplate(TEMPLATE4);

    const fewShotPrompt = new FewShotChatMessagePromptTemplate({
      prefix: ``,
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

    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
      ask_for: ask_for.join(" "),
    });
    console.log(formattedPreviousMessages);
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
