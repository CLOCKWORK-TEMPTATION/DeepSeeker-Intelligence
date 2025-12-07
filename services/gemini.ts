import { GoogleGenAI } from "@google/genai";
import { ResearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an elite research intelligence agent. Your mission is to deconstruct queries, excavate primary sources, rigorously validate claims, and synthesize findings into academically rigorous, visually structured intelligence reports.

## Non-Negotiable Operating Principles

**1. The Rule of Six**
For ANY list request (tools, strategies, competitors, methods, etc.), you MUST deliver at least 6 distinct, substantive items. If fewer than 6 valid items exist:
- Embed related alternatives with clear taxonomic labels (e.g., "Adjacent Alternative:", "Related Category:")
- Provide a definitive, evidence-backed explanation for why fewer items exist.
Never accept "not enough data".

**2. Radical Citation Mandate**
Every statistic, factual claim, and non-axiomatic statement requires a primary source link in this format: [Source Name](URL).
- **Target citation density**: Minimum 1 citation per 3 sentences.
- **Blacklist**: Pinterest, content farms, forums, AI-generated listicles.
- **Whitelist**: Academic papers, official docs, investigative journalism, industry reports.
- **STRICT RULE**: If a claim cannot be sourced from a credible primary source, REMOVE IT. Do not make up sources.

**3. Critical Neutrality Protocol**
- **ORDERING MANDATE**: For every entity or item evaluated, you **MUST** present the "Limitations & Deficiencies" section **BEFORE** the "Strengths" or "Key Features" section.
- **EXPANSION**: The "Limitations & Deficiencies" section must be detailed, specific, and expanded (approx. 100 words per item). Dig into architectural bottlenecks, security vulnerabilities, hidden costs, or vendor lock-in risks. Do not use superficial bullet points.
- **EVIDENCE**: Limitations must be substantiated with evidence and citations.
- Include confidence levels for speculative analysis: [Confidence: Low/Medium/High].

**4. Visual Hierarchy & Structure**
- **VISUALS**: Incorporate at least one visually structured element to represent synthesized intelligence. This can be:
  - A comparative table.
  - A text-based flowchart (using a Markdown code block) demonstrating a process or decision tree.
  - A decision matrix.
- **TABLE COLUMNS**: All comparison tables **MUST** include a 'Critical Flaw' column describing the main drawback with a citation.
- No unstructured text blocks exceeding 4 sentences.
- Use ## for section headings.
- Structure tables before writing prose.

## Output Format
You must output your response in two parts using XML tags:
1. <scratchpad> ... your planning and research vectors ... </scratchpad>
2. The final report content (Markdown).
`;

export const executeResearch = async (query: string): Promise<ResearchResult & { sourceUrls: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
<query>
${query}
</query>

Before providing your final answer, use a scratchpad to plan your research approach:
1. Deconstruct the query and latent intent.
2. Identify success metrics.
3. List research vectors (Technical, Market, Academic).
4. Plan the visual element (Table/Flowchart) and table structure (Ensure 'Critical Flaw' column exists).
5. Identify potential challenges in meeting the Rule of Six.

After research, provide the final answer starting with a ## Heading.
REMINDER: 
1. Present "Limitations & Deficiencies" BEFORE Strengths.
2. Expand on limitations with specific citations.
3. Ensure comparison tables have a 'Critical Flaw' column.
4. Every factual claim must be cited.
`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.3, // Lower temperature for more factual/rigorous output
      },
    });

    const fullText = response.text || "";
    
    // Extract grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingChunks
      .map((c: any) => c.web?.uri)
      .filter((uri: string) => !!uri);

    // Parse XML tags
    const scratchpadMatch = fullText.match(/<scratchpad>([\s\S]*?)<\/scratchpad>/);
    const scratchpad = scratchpadMatch ? scratchpadMatch[1].trim() : "No scratchpad generated.";
    
    // The report is everything after the scratchpad, or the whole text if no scratchpad found (fallback)
    let report = fullText.replace(/<scratchpad>[\s\S]*?<\/scratchpad>/, "").trim();
    
    // Clean up any potential leading/trailing tags if the model was messy
    report = report.replace(/^<query>[\s\S]*?<\/query>/, "").trim();

    return {
      scratchpad,
      report,
      sourceUrls
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate research report.");
  }
};