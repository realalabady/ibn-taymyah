"use server";

import { updateTag } from "next/cache";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseConfig } from "@/lib/firebase/config";
import { CONTENT_TAG } from "@/lib/data";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const projectId = firebaseConfig.projectId;

// Called by the admin panel after every change so the public pages show it right away.
export async function refreshContent(idToken: string): Promise<{ ok: boolean }> {
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const uid = payload.sub;
    if (!uid) return { ok: false };

    // Ask Firestore, as this user, whether they are a manager. The rules only let a user read their own admins doc.
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admins/${uid}`,
      { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" },
    );
    if (!res.ok) return { ok: false };

    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
