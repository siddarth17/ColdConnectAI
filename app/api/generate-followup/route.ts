import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface JWTPayload {
  userId: string;
  email: string;
}

interface FollowUpRequest {
  type: 'followup' | 'linkedin'
  contactId?: string
  originalMessage?: string
  contactName: string
  company: string
  position: string
  lastMessageType?: 'email' | 'cover_letter'
  followUpCount?: number
  // Follow-up specific
  purpose?: string
  tone?: string
  additionalContext?: string
  // LinkedIn specific
  connectionReason?: string
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: FollowUpRequest = await request.json()
    const { 
      type,
      originalMessage, 
      contactName, 
      company, 
      position,
      lastMessageType,
      followUpCount,
      purpose,
      tone,
      additionalContext,
      connectionReason
    } = body

    // Build user context
    const userProfile = user.profile || {}
    const workExperience = userProfile.workExperience || []
    
    let userContext = `CANDIDATE PROFILE:
Name: ${user.name}
${userProfile.personalSummary ? `Summary: ${userProfile.personalSummary}` : ''}

WORK EXPERIENCE:`;

    workExperience.forEach((exp: any) => {
      userContext += `
- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`;
    });

    let prompt: string

    if (type === 'linkedin') {
      // LinkedIn connection message prompt
      prompt = `You are an expert at writing professional LinkedIn connection messages. Generate a personalized LinkedIn connection message.

${userContext}

CONTACT INFORMATION:
Name: ${contactName}
Position: ${position}
Company: ${company}

CONNECTION DETAILS:
Reason: ${connectionReason}
Tone: ${tone}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}
${originalMessage ? `Background: Previously sent a ${lastMessageType} to this contact` : ''}

REQUIREMENTS:
1. Keep it under 300 characters (LinkedIn connection message limit)
2. Use a ${tone || 'friendly'} tone
3. Be professional and genuine
4. Focus on ${connectionReason} as the connection reason
5. Do NOT mention the original email/letter directly
6. Make it appropriate for a LinkedIn connection request
7. Be specific about interest in ${company} or their role
8. Include a soft call-to-action for connecting

PURPOSE: This is for sending with a LinkedIn connection request to build professional network.

Generate ONLY the message text, no subject line or extra formatting.`;

    } else {
      // Follow-up email prompt
      if (!originalMessage) {
        return NextResponse.json({ error: 'Original message required for follow-up generation' }, { status: 400 })
      }

      prompt = `You are an expert at writing professional follow-up emails. Generate a personalized follow-up email based on the original outreach.

${userContext}

ORIGINAL OUTREACH CONTEXT:
Contact: ${contactName}, ${position} at ${company}
Original Message Type: ${lastMessageType}
Follow-up Number: ${(followUpCount || 0) + 1}

ORIGINAL MESSAGE SENT:
${originalMessage}

FOLLOW-UP DETAILS:
Purpose: ${purpose}
Tone: ${tone}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

REQUIREMENTS:
1. Create a polite, professional follow-up email with subject line
2. Use a ${tone || 'professional'} tone throughout
3. Address the purpose: ${purpose}
4. Reference the original message briefly without being pushy
5. Add new value or insight based on the purpose
6. Use a different angle or hook than the original message
7. Remain concise and respectful (150-200 words max)
8. Include a soft call-to-action
9. Show continued interest in ${company}
${additionalContext ? `10. Incorporate: ${additionalContext}` : ''}

PURPOSE GUIDELINES:
- follow_up_no_response: Polite follow-up acknowledging they may be busy
- check_in: General check-in to see how things are going
- new_opportunity: Mention a new role or opportunity
- thank_you: Thank them for their time/consideration

Format: Subject: [subject line]

[email body]

Best regards,
${user.name}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: type === 'linkedin' 
            ? "You are a professional networking expert who writes compelling LinkedIn connection messages that get accepted while maintaining professionalism."
            : "You are a professional career counselor and networking expert who writes compelling follow-up emails that get responses while maintaining professionalism."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: type === 'linkedin' ? 150 : 400,
    });

    const generatedContent = completion.choices[0].message.content;
    if (!generatedContent) {
      throw new Error('No content generated');
    }

    return NextResponse.json({ content: generatedContent });

  } catch (error: unknown) {
    console.error('Generation error:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your API key.' },
          { status: 402 }
        );
      }
      
      if (error.code === 'invalid_api_key') {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your configuration.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}