import { supabase } from "@/lib/supabase";

const PROFILE_PHOTO_BUCKET = "profile-photos";

export async function uploadProfilePhoto(
  userId: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Failed to generate profile photo URL");
  }

  return data.publicUrl;
}
