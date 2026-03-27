export type IdCardExtractionResult = {
  name: string;
  residentId: string;
  address: string;
  raw: string;
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

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function pickFirstMatch(patterns: RegExp[], text: string) {
  for (const pattern of patterns) {
    const matched = text.match(pattern);
    if (matched?.[1]) {
      return normalizeWhitespace(matched[1]);
    }
  }
  return "";
}

function parseLooseText(raw: string) {
  const residentId = normalizeResidentId(
    pickFirstMatch(
      [
        /resident(?:No|Id)?["']?\s*[:=]\s*"?(?:\d{6}-?\d{7})"?/i,
        /주민(?:등록)?번호["']?\s*[:=]\s*"?(?:\d{6}-?\d{7})"?/i,
        /(\d{6}-?\d{7})/
      ].map((pattern) =>
        pattern.source.includes("(") ? pattern : new RegExp(`(${pattern.source})`, pattern.flags)
      ),
      raw
    )
  );

  const name = pickFirstMatch(
    [
      /"name"\s*:\s*"([^"]+)"/i,
      /성명\s*[:=]\s*([^\n,}]+)/i,
      /이름\s*[:=]\s*([^\n,}]+)/i
    ],
    raw
  );

  const address = pickFirstMatch(
    [
      /"address"\s*:\s*"([^"]+)"/i,
      /주소\s*[:=]\s*([^\n}]+)/i
    ],
    raw
  );

  return {
    name,
    residentId,
    address
  };
}

export async function extractIdCardInfo(file: File): Promise<IdCardExtractionResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  if (!apiKey) {
    return null;
  }

  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const sourceBlock =
    file.type === "application/pdf"
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf",
            data: base64
          }
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: file.type,
            data: base64
          }
        };

  const prompt = [
    "이 문서는 한국 신분증 사본입니다.",
    "문서에서 아래 항목만 읽어 JSON 하나만 반환하세요.",
    '{"name":"성명","residentId":"주민번호(예: 800101-1234567)","address":"주소 전체"}',
    "규칙:",
    "1. 주민번호는 반드시 13자리면 000000-0000000 형태로 맞춰주세요.",
    "2. 확실하지 않은 값은 추측하지 말고 빈 문자열로 두세요.",
    "3. 설명 문장 없이 JSON만 반환하세요.",
    "4. 성명, 주민번호, 주소 외 다른 값은 넣지 마세요."
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: "당신은 한국 신분증 OCR 추출기입니다. 반드시 지정된 JSON만 반환합니다.",
      messages: [
        {
          role: "user",
          content: [
            sourceBlock,
            {
              type: "text",
              text: prompt
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
  const raw = extractTextFromAnthropicResponse(data);
  if (!raw) {
    return null;
  }

  let parsedValues = {
    name: "",
    residentId: "",
    address: ""
  };

  try {
    const parsed = JSON.parse(stripJsonFence(raw)) as { name?: string; residentId?: string; address?: string };
    parsedValues = {
      name: normalizeWhitespace(String(parsed.name ?? "")),
      residentId: normalizeResidentId(String(parsed.residentId ?? "")),
      address: normalizeWhitespace(String(parsed.address ?? ""))
    };
  } catch {
    parsedValues = parseLooseText(raw);
  }

  const fallbackValues = parseLooseText(raw);
  const name = parsedValues.name || fallbackValues.name;
  const residentId = parsedValues.residentId || fallbackValues.residentId;
  const address = parsedValues.address || fallbackValues.address;

  if (!name && !residentId && !address) {
    return {
      name: "",
      residentId: "",
      address: "",
      raw
    };
  }

  return {
    name,
    residentId,
    address,
    raw
  };
}
