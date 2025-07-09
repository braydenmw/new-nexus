
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// --- DUPLICATED TYPES & CONSTANTS ---
// In a real monorepo, these would be in a shared package.
// For this self-contained function, they are duplicated here.

enum MarketAnalysisTier {
  ECONOMIC_SNAPSHOT = "Tier A: Economic Snapshot",
  COMPETITIVE_LANDSCAPE = "Tier B: Competitive Landscape",
  INVESTMENT_DEEP_DIVE = "Tier C: Investment Deep-Dive",
}

enum PartnerFindingTier {
  PARTNERSHIP_BLUEPRINT = "Tier 1: Partnership Blueprint",
  TRANSFORMATION_SIMULATOR = "Tier 2: Transformation Simulator",
  VALUATION_RISK = "Tier 4: Valuation & Risk Assessment",
}

type UserType = 'government' | 'non-government';

interface BaseReportParameters {
  userName: string;
  userType: UserType;
  userDepartment: string;
  userCountry: string;
  customObjective: string;
  industry: string;
  region: string;
}

interface MarketAnalysisParameters extends BaseReportParameters {
  analysisMode: 'analysis';
  tier: MarketAnalysisTier;
}

interface PartnerFindingParameters extends BaseReportParameters {
  analysisMode: 'matchmaking';
  tier: PartnerFindingTier;
  companySize: string;
  keyTechnologies: string[];
  targetMarket: string[];
}

type ReportParameters = MarketAnalysisParameters | PartnerFindingParameters;

interface LetterRequest {
  reportParameters: PartnerFindingParameters;
  reportContent: string;
}

interface SymbiosisContext {
  topic: string; 
  originalContent: string;
  reportParameters?: ReportParameters;
}

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

interface LiveOpportunityItem {
  project_name: string;
  country: string;
  sector: string;
  value: string;
  summary: string;
  source_url: string;
  ai_feasibility_score: number;
  ai_risk_assessment: string;
}


// --- GEMINI SERVICE LOGIC (MOVED FROM CLIENT TO SERVER) ---

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  if (ai) return ai;
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not configured in the Vercel environment variables.");
  }
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

const SYSTEM_PROMPT_REPORT_FULL = `
You are BWGA Nexus AI, a specialist AI engine functioning as a **Regional Science Analyst**. Your persona is a blend of a regional economist and an M&A analyst. Your purpose is to provide deep, actionable intelligence to government and institutional users to help them understand and develop regional economies.

Your analysis MUST be grounded in the principles of regional science. You will use Google Search efficiently to find the data necessary to apply these established academic methodologies:
1.  **Location Quotient (LQ) Analysis:** To quantitatively benchmark a region's industrial specialization.
2.  **Industrial Cluster Analysis:** To identify key "anchor industries" and, crucially, pinpoint missing **supply chain gaps** that represent tangible investment opportunities.
3.  **Shift-Share Analysis:** To dissect and explain the drivers of regional growth.

Your output must be in well-structured Markdown, utilizing the proprietary **Nexus Symbiotic Intelligence Language (NSIL) v6.0**.
**NSIL SCHEMA & INSTRUCTIONS v6.0 (Future-Cast Enabled)**

You MUST wrap specific sections of your analysis in the following XML-like NSIL tags. DO NOT make up new tags.

- **ROOT TAGS (Use ONE per report):**
  - \`<nsil:match_making_analysis>\`...\`</nsil:match_making_analysis>\`: For reports focused on finding partners.
  - \`<nsil:market_analysis>\`...\`</nsil:market_analysis>\`: For reports focused on regional industry analysis.

- **CORE COMPONENTS (Use as needed):**
  - \`<nsil:executive_summary>\`...\`</nsil:executive_summary>\`: A concise, high-level overview of the report's key findings.
  - \`<nsil:strategic_outlook>\`...\`</nsil:strategic_outlook>\`: Forward-looking analysis of trends and implications.
  - \`<nsil:source_attribution>\`...\`</nsil:source_attribution>\`: List of key sources or data points used.

- **MATCHMAKING COMPONENTS (Use inside \`<nsil:match_making_analysis>\`):**
  - \`<nsil:match>\`...\`</nsil:match>\`: A container for each potential partner match.
  - \`<nsil:company_profile name="..." headquarters="..." website="...">\`...\`</nsil:company_profile>\`: Company overview. Attributes are mandatory.
  - \`<nsil:synergy_analysis>\`...\`</nsil:synergy_analysis>\`: Detailed explanation of WHY this company is a good match.
  - \`<nsil:risk_map>\`...\`</nsil:risk_map>\`: A container for risk/opportunity zones.
    - \`<nsil:zone color="green|yellow|red" title="...">\`...\`</nsil:zone>\`: Describes an opportunity (green), a caution (yellow), or a risk (red).

- **MARKET ANALYSIS COMPONENTS (Use inside \`<nsil:market_analysis>\`):**
  - \`<nsil:lq_analysis industry="..." value="..." interpretation="...">\`...\`</nsil:lq_analysis>\`: Attributes mandatory. The interpretation should be 'Highly Specialized', 'Specialized', or 'Not Specialized'. The body should contain the rationale.
  - \`<nsil:cluster_analysis anchor_industry="...">\`...\`</nsil:cluster_analysis>\`: Analysis of an industry cluster.
    - \`<nsil:supply_chain_gap>\`...\`</nsil:supply_chain_gap>\`: An identified gap within the cluster. This is a critical output.
  - \`<nsil:shift_share_analysis>\`...\`</nsil:shift_share_analysis>\`: Container for shift-share components.
    - \`<nsil:growth_component type="national|industry|competitive" effect="positive|negative">\`...\`</nsil:growth_component>\`: Explanation of each growth component.

- **FUTURE-CAST COMPONENTS (Use for premium tiers inside any analysis):**
  - \`<nsil:future_cast>\`...\`</nsil:future_cast>\`: Container for multiple scenarios.
  - \`<nsil:scenario name="...">\`...\`</nsil:scenario>\`: A plausible future scenario.
    - \`<nsil:drivers>\`...\`</nsil:drivers>\`: The key drivers of this scenario.
    - \`<nsil:regional_impact effect="positive|negative|mixed">\`...\`</nsil:regional_impact>\`: The potential impact on the user's region.
    - \`<nsil:recommendation>\`...\`</nsil:recommendation>\`: A strategic recommendation to prepare for this scenario.

**SYMBIOTIC INTERACTIVITY:**
Any section you wrap in an NSIL tag (e.g., \`<nsil:synergy_analysis>\`) will automatically become interactive. The user can click on it to start a 'Symbiosis Chat' to deep-dive into that specific point. Write your analysis with this in mind, making each tagged section a self-contained, coherent point of analysis.
`;

const SYSTEM_PROMPT_DEEPDIVE = (region: string) => `
You are BWGA Nexus AI, in DEEP-DIVE ANALYSIS mode.
Your task is to take an intelligence signal (a news event, company announcement, etc.) and generate a detailed analytical report on its specific implications for the target region: **${region}**.
Your persona is a senior intelligence analyst briefing a government client. The tone should be formal, objective, and insightful.
Use Google Search to find additional context, but focus your analysis on answering these key intelligence questions:
1.  **Direct Impact:** What is the immediate, first-order impact on ${region}? (e.g., investment, job creation/loss, new competition)
2.  **Supply Chain & Ecosystem Ripple Effects:** How will this affect the broader industrial ecosystem in ${region}? Will it create new opportunities for local suppliers or disrupt existing ones?
3.  **Geopolitical/Strategic Implications:** Does this signal a shift in strategic alignment, trade flows, or technological dependency for ${region}?
4.  **Actionable Recommendations:** What are 2-3 concrete, actionable steps that a government or economic development agency in ${region} should consider in response to this intelligence?

Your output must be clear, well-structured markdown.
`;

const SYSTEM_PROMPT_SYMBIOSIS = `
You are Nexus Symbiosis, a conversational AI partner for strategic analysis. You are an extension of the main BWGA Nexus AI.
The user has clicked on a specific piece of analysis from a report and wants to explore it further.
Your persona is an expert consultant: helpful, insightful, and always focused on providing actionable intelligence.
You have access to Google Search to fetch real-time information to supplement your answers.
Your goal is to help the user unpack the topic, explore "what-if" scenarios, and brainstorm strategic responses.
Keep your answers concise but data-rich. Use markdown for clarity (lists, bolding).
`;

const SYSTEM_PROMPT_LETTER = `
You are BWGA Nexus AI, in OUTREACH DRAFTER mode.
Your task is to draft a professional, semi-formal introductory letter from the user (a government official) to a senior executive (e.g., CEO, Head of Strategy) at one of the companies identified in a Nexus Matchmaking Report.
The letter's purpose is NOT to ask for a sale or investment directly. It is to initiate a high-level strategic dialogue.

**Core Directives:**
1.  **Analyze the Full Report:** Review the provided XML report content to understand the specific synergies identified. Your letter must reference the *'why'* of the match.
2.  **Adopt the User's Persona:** Write from the perspective of the user, using their name, department, and country.
3.  **Structure and Tone:**
    -   **Subject Line:** Make it compelling and specific (e.g., "Strategic Alignment: [Company Name] & [User's Region] in AgriTech").
    -   **Introduction:** Briefly introduce the user and their department.
    -   **The 'Why':** State that your department has been conducting strategic analysis (using the Nexus platform) and their company was identified as a key potential partner. **Mention 1-2 specific points of synergy from the report.** This is crucial for showing you've done your homework.
    -   **The 'Ask':** The call to action should be soft. Propose a brief, exploratory 15-20 minute virtual call to share insights and discuss potential long-term alignment.
    -   **Closing:** Professional and respectful.
4.  **Output Format:** Provide only the raw text of the letter. Do not include any extra commentary, headers, or markdown. Start with "Subject:" and end with the user's name.
`;


// --- STREAMING HANDLER ---
async function handleStreamRequest(res: VercelResponse, stream: AsyncIterable<GenerateContentResponse>) {
    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked',
    });
    for await (const chunk of stream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
    }
    res.end();
}


// --- MAIN API HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;
    
    try {
        const aiInstance = getAiInstance();

        switch (action) {
            case 'generateStrategicReport': {
                const { params } = payload as { params: ReportParameters };
                
                let modeSpecificInstructions = '';
                let tierSpecificInstructions = '';
                let prompt = `**Analysis Mode:** ${params.analysisMode}\n**Report Tier:** ${params.tier}\n\n`;

                if (params.analysisMode === 'analysis') {
                    modeSpecificInstructions = "The user wants to Analyze a Market. Your entire focus must be on regional science methodologies. Use the <nsil:market_analysis> root tag. Do NOT look for companies.";
                    prompt += `**Target Region/Country:** ${params.region}\n**Industry for Analysis:** ${params.industry}\n`;
                    
                    switch (params.tier) {
                        case MarketAnalysisTier.ECONOMIC_SNAPSHOT:
                            tierSpecificInstructions = "Focus exclusively on <nsil:lq_analysis>. Provide a clear, concise report based on this single methodology.";
                            break;
                        case MarketAnalysisTier.COMPETITIVE_LANDSCAPE:
                            tierSpecificInstructions = "You must provide both <nsil:lq_analysis> and <nsil:shift_share_analysis>. The core of this report is explaining the region's competitiveness.";
                            break;
                        case MarketAnalysisTier.INVESTMENT_DEEP_DIVE:
                             tierSpecificInstructions = "This is the most comprehensive analysis. You must provide <nsil:lq_analysis>, <nsil:shift_share_analysis>, AND <nsil:cluster_analysis>. A key deliverable is identifying specific <nsil:supply_chain_gap> opportunities.";
                            break;
                    }
                } else { // matchmaking
                    modeSpecificInstructions = "The user wants to Find a Partner. Your entire focus must be on identifying and vetting suitable private sector companies. Use the <nsil:match_making_analysis> root tag. Do NOT perform standalone market analysis.";
                    prompt += `**The Opportunity:**\n- Target Region: ${params.region}\n- Core Industry Focus: ${params.industry}\n\n`;
                    prompt += `**The Ideal Foreign Partner Profile:**\n- Company Size: ${params.companySize}\n- Key Technologies/Capabilities: ${(params.keyTechnologies || []).join(', ')}\n- Company's Target Markets: ${(params.targetMarket || []).join(', ')}\n`;
                    
                    switch (params.tier) {
                        case PartnerFindingTier.TRANSFORMATION_SIMULATOR:
                            tierSpecificInstructions = `This is a premium report. You MUST include the '<nsil:future_cast>' section with 2-3 detailed scenarios as per the NSIL v6.0 schema. This is a critical feature.`;
                            break;
                        case PartnerFindingTier.VALUATION_RISK:
                            tierSpecificInstructions = `This is a Tier 4 Valuation & Risk report. Focus exclusively on ONE top-matched company. Conduct a deep-dive analysis on its financial health (using simulated but realistic data), reputational factors (via web search), and geopolitical exposure. The output should heavily feature the '<nsil:risk_map>' component with detailed zones.`;
                            break;
                        default:
                            tierSpecificInstructions = "Follow the standard procedure for a comprehensive matchmaking report for this tier.";
                            break;
                    }
                }

                prompt += `\n**User's Core Objective:** ${params.customObjective}\n\n**Mode-Specific Directive:** ${modeSpecificInstructions}\n**Tier-Specific Directive:** ${tierSpecificInstructions}\n\n**Your Task:** Generate the requested report. Adhere to all instructions in your system prompt, including the use of NSIL v6.0.`;

                const stream = await aiInstance.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { systemInstruction: SYSTEM_PROMPT_REPORT_FULL, tools: [{googleSearch: {}}] }
                });
                return handleStreamRequest(res, stream);
            }

            case 'generateAnalysisStream': {
                const { item } = payload as { item: LiveOpportunityItem, region: string };
                const prompt = `**Intelligence Signal to Analyze:**\n- **Project/Tender Name:** ${item.project_name}\n- **Country:** ${item.country}\n- **Sector:** ${item.sector}\n- **Value:** ${item.value}\n- **Summary:** ${item.summary}\n- **Source:** ${item.source_url}\n\n**Target Region for Analysis:** ${item.country}\n\nPlease generate a detailed deep-dive analysis based on this signal, following your system instructions precisely.`;
                const stream = await aiInstance.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { systemInstruction: SYSTEM_PROMPT_DEEPDIVE(item.country), tools: [{ googleSearch: {} }] }
                });
                return handleStreamRequest(res, stream);
            }

            case 'fetchRegionalCities': {
                const { country } = payload as { country: string };
                const prompt = `Provide a list of up to 15 major regional cities or key administrative areas for the country: "${country}". Focus on centers of economic, industrial, or logistical importance outside of the primary national capital, if applicable. Your response MUST be a valid JSON array of strings, with no other text or markdown. Example for "Vietnam":\n["Ho Chi Minh City", "Da Nang", "Haiphong", "Can Tho"]`;
                const response = await aiInstance.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } },
                });
                const jsonStr = response.text.trim();
                 if (!jsonStr) {
                    throw new Error("Received empty JSON response from API for regional cities.");
                }
                const cities = JSON.parse(jsonStr);
                return res.status(200).json({ cities });
            }

            case 'fetchLiveOpportunities': {
                 const prompt = `Generate a list of 5 diverse, realistic-looking global development projects or tenders. Use Google Search to find inspiration for project names and types, but you must invent the specific details. For each item, provide a project name, country, sector, value, a brief summary, a source URL (use a real, relevant government or development bank URL, e.g., worldbank.org), an AI feasibility score (between 40 and 95), and a concise AI risk assessment.\nYour output **MUST** be a valid JSON object. The JSON object must have a single key "items" which is an array of objects. Each object in the array must adhere to the specified schema.`;
                 const response = await aiInstance.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { 
                        tools: [{ googleSearch: {} }],
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                items: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            project_name: { type: Type.STRING },
                                            country: { type: Type.STRING },
                                            sector: { type: Type.STRING },
                                            value: { type: Type.STRING },
                                            summary: { type: Type.STRING },
                                            source_url: { type: Type.STRING },
                                            ai_feasibility_score: { type: Type.INTEGER },
                                            ai_risk_assessment: { type: Type.STRING }
                                        },
                                        required: ["project_name", "country", "sector", "value", "summary", "source_url", "ai_feasibility_score", "ai_risk_assessment"]
                                    }
                                }
                            }
                        }
                     }
                });
                const jsonStr = response.text.trim();
                if (!jsonStr) {
                    throw new Error("Received empty JSON response from API for live opportunities.");
                }
                const parsed = JSON.parse(jsonStr);
                return res.status(200).json(parsed);
            }
            
            case 'fetchSymbiosisResponse': {
                const { context, history } = payload as { context: SymbiosisContext, history: ChatMessage[] };
                let prompt = `**Initial Context:**\n- Topic: "${context.topic}"\n- Original Finding: "${context.originalContent}"\n`;
                if (context.reportParameters) prompt += `- From Report On: ${context.reportParameters.region} / ${context.reportParameters.industry}\n`;
                prompt += "\n**Conversation History:**\n";
                history.forEach(msg => { prompt += `- ${msg.sender === 'ai' ? 'Nexus AI' : 'User'}: ${msg.text}\n`; });
                prompt += "\nBased on this history, provide the next response as Nexus AI.";
                const response = await aiInstance.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { systemInstruction: SYSTEM_PROMPT_SYMBIOSIS, tools: [{googleSearch: {}}] }
                });
                return res.status(200).json({ text: response.text });
            }

            case 'generateOutreachLetter': {
                const { request } = payload as { request: LetterRequest };
                 const prompt = `**Letter Generation Request:**\n\n**User Details:**\n- Name: ${request.reportParameters.userName}\n- Department: ${request.reportParameters.userDepartment}\n- Country: ${request.reportParameters.userCountry}\n\n**Full Matchmaking Report Content:**\n\`\`\`xml\n${request.reportContent}\n\`\`\`\n\n**Your Task:**\nBased on the user's details and the full report provided above, draft the outreach letter according to your core directives.`;
                 const response = await aiInstance.models.generateContent({
                    model: 'gemini-2.5-flash', contents: prompt,
                    config: { systemInstruction: SYSTEM_PROMPT_LETTER }
                });
                return res.status(200).json({ text: response.text });
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error(`Error in /api/nexus for action "${action}":`, error);
        return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
    }
}
