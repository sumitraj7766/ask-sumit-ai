import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import ChatHistory from "@/models/ChatHistory";
import Conversation from "@/models/Conversation";
import { connectDB } from "@/lib/mongodb";

import publicProfile from "../../../data/public_profile.json";
import privateProfile from "../../../data/private_profile.json";
import Document from "@/models/Document";

const privateKeywords = [
  "phone",
  "mobile",
  "number",
  "address",
  "home",
  "father",
  "mother",
  "brother",
  "sister",
  "family",
  "aadhaar",
  "aadhar",
  "pan",
  "document",
  "password",
  "bank",
  "private",
  "personal",
];

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "GROQ_API_KEY is missing. Add it in .env.local and restart the server.",
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    let userId = "";

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };

        userId = decoded.userId;
      } catch {
        console.log("Invalid token");
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          reply: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

  const body = await req.json();

const message = body.message || "";
const adminPassword = body.adminPassword || "";
let conversationId = body.conversationId || "";
const language = body.language || "en-US";
const tool = body.tool || "chat";

let languageInstruction = "";

switch (language) {
  case "hi-IN":
    languageInstruction = "Reply only in Hindi.";
    break;

  case "en-US":
    languageInstruction = "Reply only in English.";
    break;

  case "es-ES":
    languageInstruction = "Reply only in Spanish.";
    break;

  case "fr-FR":
    languageInstruction = "Reply only in French.";
    break;

  default:
    languageInstruction = "Reply only in English.";
}

let toolInstruction = "";

switch (tool) {
  case "email":
    toolInstruction =
      toolInstruction = `
You are a professional email writing assistant.

Your job is to directly write complete emails.

Never ask unnecessary follow-up questions unless essential information is missing.

If the user says:
- "write email"
- "write an email"
- "email to HR"
- "leave application"
- "internship request"
- "job application"

Generate a complete professional email immediately.

Always include:
- Subject
- Greeting
- Body
- Closing
- Signature placeholder

Return only the email in a clean format.
`;
    break;

  case "code":
    toolInstruction =
      toolInstruction = `
You are an expert software engineer.

Generate complete, working code.

Explain the code after writing it.

Use best practices and comments.
`;
    break;

  case "resume":
    toolInstruction =
      toolInstruction = `
You are an ATS Resume Expert.

Improve the resume directly.

Rewrite weak sentences.

Suggest improvements.

Return the improved resume.
`;
    break;

  case "translate":
    toolInstruction =
      toolInstruction = `
You are a professional translator.

Translate the user's text directly.

Do not explain the translation.

Return only the translated text.
`;
    break;

  case "pdf":
    toolInstruction =
      toolInstruction = `
You are a PDF summarization assistant.

Summarize the uploaded PDF immediately.

If the user asks a question about the PDF, answer directly using the document.
`;
    break;

  case "analyze":
    toolInstruction =
      toolInstruction = `
You are a document analysis expert.

Analyze the uploaded document.

Return:
- Summary
- Key Points
- Important Findings
- Recommendations
`;
    break;

  default:
    toolInstruction =
      "You are AskSumit AI, a helpful AI assistant.";
}

    

    if (!message.trim()) {
      return NextResponse.json({
        reply: "Please ask a question.",
      });
    }

    // Fetch previous conversation memory
    const previousMessages: {
      role: "user" | "assistant";
      content: string;
    }[] = [];

    if (conversationId) {
      const history = await ChatHistory.find({
        conversationId,
      })
        .sort({ createdAt: 1 })
        .limit(10);

      history.forEach((chat) => {
        previousMessages.push({
          role: "user",
          content: chat.message,
        });

        previousMessages.push({
          role: "assistant",
          content: chat.response,
        });
      });
    }

    const isAdmin =
      adminPassword.trim() !== "" &&
      adminPassword.trim() === process.env.ADMIN_PASSWORD?.trim();

    if (!conversationId) {
      const newConversation = await Conversation.create({
        userId,
        title:
          message.length > 30
            ? message.substring(0, 30) + "..."
            : message || "New Chat",
      });

      conversationId = newConversation._id.toString();
    }

    const lowerMessage = message.toLowerCase();

    const isPrivateQuestion = privateKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (isPrivateQuestion && !isAdmin) {
      return NextResponse.json({
        reply:
          "Sorry, this is private information. Admin authentication is required. I can only share Sumit's public profile information such as skills, projects, achievements, college, GitHub, portfolio, and career goals.",
        conversationId,
      });
    }

    // Build profile context once (removed the earlier duplicate declaration
    // that was causing a "Cannot redeclare block-scoped variable" build error)
    const profileContext = isAdmin
      ? {
          accessLevel: "ADMIN_AUTHENTICATED",
          publicProfile,
          privateProfile,
        }
      : {
          accessLevel: "PUBLIC_USER",
          publicProfile,
        };

    // Fetch latest uploaded document
    const latestDocument = await Document.findOne({
      userId,
      status: "ready",
    }).sort({ createdAt: -1 });

    console.log("===== DOCUMENT =====");
console.log(latestDocument);
console.log("====================");

    const documentContext = latestDocument
      ? `
Uploaded PDF:
Filename: ${latestDocument.filename}

Document Name:
${latestDocument.filename}

Document Text:

"""
${latestDocument.extractedText}
${toolInstruction}
"""
`
      : "No PDF uploaded.";

    const systemPrompt = isAdmin
    
      ? `
You are AskSumit AI, a personal AI agent for Sumit Kumar.

The current user is ADMIN_AUTHENTICATED.

Rules:
- If the user asks about the uploaded PDF, answer ONLY using the uploaded PDF.
- Never say you cannot access the PDF because it has already been provided below.
- Do NOT copy the whole PDF unless the user explicitly asks for it.
- Instead, summarize it naturally.
- Quote only small relevant sections when necessary.
- If the answer is not found in the uploaded PDF, clearly say so.
Profile Data:
${JSON.stringify(profileContext, null, 2)}

Uploaded Document:
${documentContext}
`
      : `
You are AskSumit AI, a personal AI agent for Sumit Kumar.

The current user is PUBLIC_USER.

Rules:
- Use only publicProfile.
- Do not reveal private information such as phone number, exact home address, family details, Aadhaar, PAN, personal documents, passwords, or bank details.
- If a public user asks for private information, politely refuse.
- Do not make up information.
- Answer clearly and professionally.


Profile Data:
${JSON.stringify(profileContext, null, 2)}

Uploaded Document:
${documentContext}
`;

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content: systemPrompt,
    },
    ...previousMessages,
    {
      role: "user",
      content: `${languageInstruction}

User Question:
${message}`,
    },
  ],
});

    const aiReply =
      completion.choices[0]?.message?.content || "No response generated.";

    await ChatHistory.create({
      userId,
      conversationId,
      message,
      response: aiReply,
    });

    return NextResponse.json({
      reply: aiReply,
      conversationId,
    });
  } catch (error) {
    console.error("ASKSUMIT_API_ERROR:", error);

    return NextResponse.json(
      {
        reply:
          "AskSumit AI backend error. Check terminal for ASKSUMIT_API_ERROR.",
      },
      { status: 500 }
    );
  }
}