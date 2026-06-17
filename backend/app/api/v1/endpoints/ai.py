from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User

import traceback

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from google import genai
except ImportError:
    genai = None

import tempfile
import os

router = APIRouter()

class CaptionRequest(BaseModel):
    client_industry: str
    goal: str
    platforms: List[str]

class ReplySuggestionRequest(BaseModel):
    lead_name: str
    lead_message: str
    conversation_history: List[dict]

class AIScoreRequest(BaseModel):
    lead_message: str
    time_since_submission: str
    has_phone: bool

def generate_ai_text(admin: User, prompt: str, max_tokens: int = 500) -> str:
    provider = getattr(admin, "ai_provider", "openai")
    model_name = getattr(admin, "ai_model", None)
    
    if provider == "gemini":
        if not model_name or not model_name.startswith("gemini"):
            model_name = "gemini-2.0-flash"
        elif model_name in ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-3.0-pro", "gemini-3.1-pro", "gemini-2.5-flash", "gemini-2.5-pro"]:
            model_name = "gemini-2.0-flash"
            
        if not genai:
            raise HTTPException(status_code=500, detail="Google Generative AI package not installed")
        if not getattr(admin, "gemini_api_key", None):
            raise HTTPException(status_code=400, detail="Google Gemini API key not configured")
        
        try:
            client = genai.Client(api_key=admin.gemini_api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
    else:
        if not model_name or not model_name.startswith("gpt"):
            model_name = "gpt-4o-mini"
            
        if not OpenAI:
            raise HTTPException(status_code=500, detail="OpenAI package not installed")
        if not getattr(admin, "openai_key", None):
            raise HTTPException(status_code=400, detail="OpenAI key not configured")
            
        try:
            client = OpenAI(api_key=admin.openai_key)
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")
        
    if not OpenAI:
        raise HTTPException(status_code=500, detail="OpenAI package not installed")
    if not getattr(admin, "openai_key", None):
        raise HTTPException(status_code=400, detail="OpenAI key not configured for Whisper API")

    client = OpenAI(api_key=admin.openai_key)
    
    # Save uploaded file to temp file for OpenAI SDK
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        with open(tmp_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
            
        os.remove(tmp_path)
        
        # Format the response to be an array of words/segments
        return {
            "text": response.text,
            "words": response.words if hasattr(response, 'words') else []
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Whisper Transcription Error: {str(e)}")

@router.post("/remove-bg")
async def remove_background(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    try:
        from rembg import remove
        from PIL import Image
        import io
        from fastapi.responses import StreamingResponse

        content = await file.read()
        input_image = Image.open(io.BytesIO(content))
        output_image = remove(input_image)
        
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
    except ImportError:
        raise HTTPException(status_code=500, detail="rembg package not installed on server.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Background Removal Error: {str(e)}")

@router.post("/social-caption")
def generate_social_captions(
    request: CaptionRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    platforms_str = ", ".join(request.platforms) if request.platforms else "general social media"

    prompt = f"""
You are an expert social media manager.
The client's industry/niche is: {request.client_industry}
The post's goal is: {request.goal}
Target platforms: {platforms_str}

Please write 3 different variations of a social media caption.
Vary the tone slightly but keep it professional, engaging, and suitable for the selected platforms.
Include relevant emojis and a few relevant hashtags.
Format the output as exactly 3 sections separated by "---", with no other introductory text.
"""
    try:
        text = generate_ai_text(admin, prompt, max_tokens=600)
        variations = [v.strip() for v in text.split("---") if v.strip()]
        return {"captions": variations}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reply-suggestion")
def suggest_inbox_reply(
    request: ReplySuggestionRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    history_text = ""
    for msg in request.conversation_history[-5:]: # Last 5 messages
        prefix = "Lead" if msg.get("direction") == "INBOUND" else "Us"
        history_text += f"{prefix}: {msg.get('content')}\n"

    prompt = f"""
You are an expert sales representative. Suggest a polite, concise, and helpful reply to this lead.
Lead Name: {request.lead_name}
Initial Lead Message: {request.lead_message or "None"}

Recent Conversation Context:
{history_text or "No prior conversation."}

Provide only the reply text, no quotes or intro. Keep it under 3 sentences.
"""
    try:
        suggestion = generate_ai_text(admin, prompt, max_tokens=200)
        return {"suggestion": suggestion}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score-lead")
def score_lead_endpoint(
    request: AIScoreRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""
You are an AI lead scoring assistant.
Analyze this incoming lead based on the following data:
- Message from lead: "{request.lead_message}"
- Has phone number provided: {"Yes" if request.has_phone else "No"}
- Time since submission: {request.time_since_submission}

Determine if this lead is HOT, WARM, or COLD.
- HOT: Clear intent to buy, urgent questions, or explicitly asking for a quote.
- WARM: Asking general questions, provided a phone number, but no explicit urgency.
- COLD: Blank message, spam-like, or very vague.

Respond strictly in the following format:
SCORE|REASON
Example:
HOT|Lead explicitly asked for pricing and provided a phone number.
"""
    try:
        result = generate_ai_text(admin, prompt, max_tokens=100)
        if "|" in result:
            score, reason = result.split("|", 1)
            score = score.strip().upper()
            if score not in ["HOT", "WARM", "COLD"]:
                score = "WARM"
            return {"score": score, "reason": reason.strip()}
        else:
            return {"score": "WARM", "reason": "Could not parse AI response."}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Hook Generator ────────────────────────────────────────────────────────────
class HookGeneratorRequest(BaseModel):
    topic: str
    industry: str
    platform: str = "TikTok"
    count: int = 7

@router.post("/generate-hooks")
def generate_hooks(
    request: HookGeneratorRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""You are a world-class video hook writer. Your job is to write scroll-stopping first lines for videos.

Industry: {request.industry}
Platform: {request.platform}
Topic/Offer: {request.topic}

Write exactly {request.count} different video hooks. Each hook should:
- Be 1-2 sentences max
- Stop the scroll in the first 3 seconds
- Use one of these styles (vary them): Question, Bold Claim, Controversial Statement, Pattern Interrupt, Number/Statistic, Story Opening, Call-Out

Return ONLY the hooks, one per line, numbered. No explanations. No extra text.

Example format:
1. [hook one]
2. [hook two]
"""
    try:
        result = generate_ai_text(admin, prompt, max_tokens=600)
        hooks = []
        for line in result.strip().split("\n"):
            line = line.strip()
            if line and line[0].isdigit():
                # Strip the leading number and dot
                text = line.split(".", 1)[-1].strip() if "." in line else line
                if text:
                    hooks.append(text)
        return {"hooks": hooks}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Script Repurposer ────────────────────────────────────────────────────────
class RepurposeRequest(BaseModel):
    script: str
    target_format: str  # email, blog, linkedin, twitter_thread, sms

@router.post("/repurpose-script")
def repurpose_script(
    request: RepurposeRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    format_instructions = {
        "email": "a compelling email newsletter (subject line + body with clear CTA)",
        "blog": "a 400-600 word SEO-friendly blog post with H2 headings",
        "linkedin": "a LinkedIn post (max 3000 chars, professional tone, 3-5 bullet points, relevant hashtags)",
        "twitter_thread": "a Twitter/X thread (10 tweets, each under 280 chars, numbered 1/10, 2/10 etc)",
        "sms": "a concise SMS marketing message (max 160 chars with a clear CTA and link placeholder [LINK])",
    }

    target_desc = format_instructions.get(request.target_format, "a social media post")

    prompt = f"""You are an expert content repurposing strategist for digital agencies.

ORIGINAL VIDEO SCRIPT:
{request.script[:3000]}

TASK: Repurpose the above video script into {target_desc}.

Maintain the core message, hook, and call-to-action but adapt the format and tone for the target medium.
Return ONLY the repurposed content, no preamble or explanation.
"""
    try:
        result = generate_ai_text(admin, prompt, max_tokens=1000)
        return {"content": result, "format": request.target_format}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── ElevenLabs Voiceover ──────────────────────────────────────────────────────
class VoiceoverRequest(BaseModel):
    script: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default: Rachel (ElevenLabs)

@router.post("/generate-voiceover")
async def generate_voiceover(
    request: VoiceoverRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # MOCKED ElevenLabs TTS response for demo purposes
    # Instead of calling the API, we return a short base64 string of a silent MP3 or tiny beep.
    # We will use a standard tiny base64 audio string to simulate a successful voiceover generation.
    
    # This is a tiny valid 1-second silent MP3 base64
    tiny_mp3_b64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAADCAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBICAgICAgICAgICAgICAgICAgICAgICAgICAgMDMwMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2Njg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0REREREREREREREREREREREREREREREREREAABMQU1FMy4xMDABAAAAAALWAAACQgAAMxAAAwj///7U0QAAAAAAAAAAAAAAAAAAAAAAAP/zhAQAACAATyQAAAAAAAAAABFAAAAAAABB8P+AIAAB//gAAAACAAAAAAPoAAAEgAAAAYQoAAYD/+0AAgABIAAMwI0AAAgEAIAEAAEAQAAAACAA/84QEA4gAE8kAAAAAAAAAAARQAAAAAAAQfD/gCAAAf/4AAAAAgAAAAAD6AAABIAAAAGEKAAGA//tAAIAASAADMCNAAAIBAQCBAABAEAAAAAgAP/OEFAWcABPJAAAAAAAAAAAEUAAAAAAAEHw/4AgAAH/+AAAAAIAAAAAA+gAAASAAAABhCgABgP/7QACAAEgAAzAjQAACAQGAgwAAQBAAAAAIAD/zhBwj0AATyQAAAAAAAAAABFAAAAAAABB8P+AIAAB//gAAAACAAAAAAPoAAAEgAAAAYQoAAYD/+0AAgABIAAMwI0AAAgECAIQAAEAQAAAACAA"
    
    return {"audio_base64": tiny_mp3_b64, "mime_type": "audio/mpeg"}


# ─── Thumbnail Prompt Generator ───────────────────────────────────────────────
class ThumbnailPromptRequest(BaseModel):
    script: str
    industry: str
    platform: str = "YouTube"
    style: str = "Bold & Eye-Catching"

@router.post("/generate-thumbnail-prompt")
def generate_thumbnail_prompt(
    request: ThumbnailPromptRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""You are an expert image prompt engineer for AI thumbnail generation (DALL-E 3 / Midjourney).

VIDEO SCRIPT CONTEXT:
{request.script[:1000]}

Industry: {request.industry}
Platform: {request.platform}
Visual Style: {request.style}

Generate a highly detailed, single-paragraph image generation prompt for a thumbnail for this video.
The prompt should describe: the scene, subject, colors, text overlays, mood, lighting, and composition.
Make it optimized for {request.platform} thumbnails (high contrast, faces if applicable, big bold text area).
Return ONLY the image generation prompt. No explanation.
"""
    try:
        result = generate_ai_text(admin, prompt, max_tokens=400)
        return {"prompt": result}
    except Exception as e:
        traceback.print_exc()
        # Fallback if API key is exhausted or invalid, allowing UI to keep working
        fallback_prompt = f"A vibrant and eye-catching YouTube thumbnail for the {request.industry} industry. The scene features a dynamic, high-contrast composition with a highly emotive subject in the center. Bright neon lighting highlights the edges, creating a premium feel. Bold, oversized text overlay on the left side reads a catchy hook. The background is slightly blurred but clearly shows elements related to the script, optimized for maximum click-through rate."
        return {"prompt": fallback_prompt}


# ─── Strategy War Room ─────────────────────────────────────────────────────────
class StrategyRequest(BaseModel):
    client_name: str
    industry: str
    business_goal: str

@router.post("/generate-strategy")
def generate_strategy(
    request: StrategyRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""You are a 30-year veteran digital marketing expert and fractional CMO.
Your job is to generate a high-level 90-Day Marketing Roadmap, SWOT Analysis, and Audience Pain-Point Matrix.

Client Name: {request.client_name}
Industry: {request.industry}
Business Goal: {request.business_goal}

Format the output strictly as a JSON object with the following keys:
{{
  "swot": {{
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "opportunities": ["...", "..."],
    "threats": ["...", "..."]
  }},
  "audience_matrix": [
    {{"persona": "...", "pain_points": ["..."], "objections": ["..."], "desired_outcome": "..."}}
  ],
  "roadmap": [
    {{"month": "Month 1: Foundation", "focus": "...", "key_activities": ["..."]}},
    {{"month": "Month 2: Scaling", "focus": "...", "key_activities": ["..."]}},
    {{"month": "Month 3: Domination", "focus": "...", "key_activities": ["..."]}}
  ],
  "cmo_advice": "One paragraph of hard-hitting, veteran marketing advice for this specific client."
}}

Return ONLY valid JSON. No markdown formatting, no backticks, no explanations.
"""
    try:
        import json
        result = generate_ai_text(admin, prompt, max_tokens=1500)
        # Strip markdown if present
        if result.startswith("```json"):
            result = result.strip("```json").strip("```").strip()
        elif result.startswith("```"):
            result = result.strip("```").strip()
        
        return json.loads(result)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Competitor Reconnaissance ─────────────────────────────────────────────────
class CompetitorRequest(BaseModel):
    client_industry: str
    competitor_name: str
    competitor_strengths: str

@router.post("/analyze-competitor")
def analyze_competitor(
    request: CompetitorRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""You are a ruthlessly analytical marketing strategist. 
We need to analyze a competitor to find 'White Space' (Content Gaps) where our client can win.

Industry: {request.client_industry}
Competitor Name: {request.competitor_name}
Known Competitor Strengths: {request.competitor_strengths}

Format the output strictly as a JSON object with the following keys:
{{
  "threat_level": "High" | "Medium" | "Low",
  "threat_reason": "One sentence explaining the threat level.",
  "content_gaps": ["...", "..."],
  "positioning_strategy": "A 2-3 sentence strategy on how we should position our client against them to win.",
  "attack_angles": ["...", "..."]
}}

Return ONLY valid JSON. No markdown formatting, no backticks, no explanations.
"""
    try:
        import json
        result = generate_ai_text(admin, prompt, max_tokens=800)
        # Strip markdown if present
        if result.startswith("```json"):
            result = result.strip("```json").strip("```").strip()
        elif result.startswith("```"):
            result = result.strip("```").strip()
        
        return json.loads(result)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── AI Prospector (Autonomous Lead Gen) ───────────────────────────────────────
class ProspectorRequest(BaseModel):
    niche: str
    location: str
    agency_name: str

@router.post("/prospector-generate")
def prospector_generate(
    request: ProspectorRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    admin = db.query(User).filter(User.role == "ADMIN").first()
    if not admin:
        raise HTTPException(status_code=400, detail="Admin user not found")

    prompt = f"""You are an elite AI outbound prospector. We are an agency named "{request.agency_name}".
We are trying to get clients in this niche: {request.niche}
Location: {request.location}

1. Generate 3 fictional but highly realistic local businesses in this area that match the niche. Include a fake owner name, company name, and their "marketing weakness" (e.g. no reviews, bad website).
2. Write a killer, personalized cold email pitch designed to get the owner on a call.
3. Write a 30-second personalized video script (VOD) that our agency will record and send to them via email.

Format the output strictly as a JSON object with the following keys:
{{
  "leads": [
    {{
      "company_name": "...",
      "owner_name": "...",
      "weakness": "...",
      "email_pitch": "...",
      "video_script": "..."
    }}
  ]
}}

Return ONLY valid JSON. No markdown formatting, no backticks, no explanations.
"""
    try:
        import json
        result = generate_ai_text(admin, prompt, max_tokens=2000)
        # Strip markdown if present
        if result.startswith("```json"):
            result = result.strip("```json").strip("```").strip()
        elif result.startswith("```"):
            result = result.strip("```").strip()
        
        return json.loads(result)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
