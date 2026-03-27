type IdCardExtractionResult = {
  name: string;
  residentId: string;
};

function normalizeResidentId(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) {
    return "";
  }
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function stripJsonFence(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractTextFromAnthropicResponse(data: unknown) {
  if (!data || typeof data !== "object" || !("content" in data)) {
    return "";
  }

  const content = (data as { content?: Array<{ type?: string; text?: string }> }).content ?? [];
  return content
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export async function extractIdCardInfo(file: File): Promise<IdCardExtractionResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  if (!apiKey) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type,
                data: base64
              }
            },
            {
              type: "text",
              text:
                "이 이미지는 한국 신분증 사본입니다. 문서에서 이름과 주민등록번호를 읽어 JSON만 반환해주세요. 형식: {\"name\":\"\",\"residentId\":\"000000-0000000\"}. 불확실하면 빈 문자열로 두세요."
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Claude OCR 요청에 실패했습니다. ${errorText}`.trim());
  }

  const data = (await response.json().catch(() => null)) as unknown;
  const text = extractTextFromAnthropicResponse(data);
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(stripJsonFence(text)) as { name?: string; residentId?: string };
    const residentId = normalizeResidentId(parsed.residentId ?? "");
    const name = String(parsed.name ?? "").trim();

    if (!name && !residentId) {
      return null;
    }

    return {
      name,
      residentId
    };
  } catch {
    return null;
  }
}
