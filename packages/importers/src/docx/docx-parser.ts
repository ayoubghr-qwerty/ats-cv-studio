import { XMLParser, type X2jOptions } from "fast-xml-parser"
import JSZip from "jszip"

import type { DocxParagraph } from "../types"

const XML_OPTIONS: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
}

function collectText(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") {
    out.push(node)
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, out)
    return out
  }
  if (node === null || typeof node !== "object") return out
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "w:t" || key === "t") {
      collectText(value, out)
    } else if (key === "w:br" || key === "br") {
      out.push("\n")
    } else if (key === "w:tab" || key === "tab") {
      out.push("\t")
    } else if (key.startsWith("@_")) {
      continue
    } else {
      collectText(value, out)
    }
  }
  return out
}

function paragraphFromNode(node: Record<string, unknown>): DocxParagraph | null {
  const pPr = (node["w:pPr"] ?? node["pPr"]) as Record<string, unknown> | undefined
  const styleNode = pPr?.["w:pStyle"] ?? pPr?.["pStyle"]
  const style =
    typeof styleNode === "object" && styleNode !== null
      ? String((styleNode as Record<string, unknown>)["@_w:val"] ?? "")
      : ""
  const bullet = Boolean(pPr?.["w:numPr"] ?? pPr?.["numPr"])
  const text = stripNullChars(collectText(node).join("")).trim()
  return { text, style: style || undefined, bullet }
}

function paragraphsFromBody(body: unknown): DocxParagraph[] {
  if (!body || typeof body !== "object") return []
  const pNodes = (body as Record<string, unknown>)["w:p"] ?? (body as Record<string, unknown>)["p"]
  if (!pNodes) return []
  const nodes = Array.isArray(pNodes) ? pNodes : [pNodes]
  return nodes
    .filter((node): node is Record<string, unknown> => node !== null && typeof node === "object")
    .map(paragraphFromNode)
    .filter((p): p is DocxParagraph => p !== null)
}

function stripNullChars(value: string): string {
  return [...value].filter((ch) => ch.charCodeAt(0) !== 0).join("")
}

export async function parseDocx(buffer: ArrayBuffer | Uint8Array): Promise<DocxParagraph[]> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new Error("The file is not a valid DOCX archive")
  }
  const docXml = zip.file("word/document.xml")
  if (!docXml) throw new Error("The DOCX file does not contain word/document.xml")
  const xml = await docXml.async("string")
  const parsed = new XMLParser(XML_OPTIONS).parse(xml)
  const documentNode = parsed["w:document"] ?? parsed["document"]
  const body =
    documentNode?.["w:body"] ?? documentNode?.["body"] ?? parsed["w:body"] ?? parsed["body"]
  return paragraphsFromBody(body)
}
