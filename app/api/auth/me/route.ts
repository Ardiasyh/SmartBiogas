import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" });

  const uid = authHeader.replace("Bearer ", "").trim();

  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      return NextResponse.json({ error: "Not Found" });
    }

    return NextResponse.json(snap.data());
  } catch (e) {
    return NextResponse.json({ error: "Server Error" });
  }
}
