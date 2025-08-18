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

interface EmailRequest {
  role: string;
  companyName: string;
  companyWebsite?: string;
  recipientName?: string;
  recipientTitle?: string;
  purpose?: string;
  tone?: string;
  template?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body: EmailRequest = await request.json();
    const { 
      role, 
      companyName, 
      companyWebsite,
      recipientName, 
      recipientTitle, 
      purpose, 
      tone,
      template
    } = body;

    // Validate required fields
    if (!role || !companyName) {
      return NextResponse.json(
        { error: 'Role and company name are required' },
        { status: 400 }
      );
    }

    // Get user profile data
    const userProfile = user.profile || {};
    const workExperience = userProfile.workExperience || [];
    const education = userProfile.education || [];
    const skills = userProfile.skills || [];
    const personalSummary = userProfile.personalSummary || '';

    // Build complete user context for AI to analyze
    let userContext = `CANDIDATE PROFILE:
Name: ${user.name}
${personalSummary ? `Summary: ${personalSummary}` : ''}

WORK EXPERIENCE:`;

    workExperience.forEach((exp: any) => {
      userContext += `
- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description}`;
    });

    if (education.length > 0) {
      userContext += `

EDUCATION:`;
      education.forEach((edu: any) => {
        userContext += `
- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})`;
      });
    }

    if (skills.length > 0) {
      userContext += `

SKILLS: ${skills.join(', ')}`;
    }

    let prompt: string;

    if (template) {
      // Use template-based generation with intelligent content selection
      prompt = `You are an expert at personalizing email templates for job applications. You have the candidate's complete background and need to intelligently select and emphasize the most relevant experiences, skills, and achievements for this specific role and company.

${userContext}

TEMPLATE TO CUSTOMIZE:
${template}

JOB APPLICATION DETAILS:
- Position applying for: ${role}
- Target company: ${companyName}
${companyWebsite ? `- Company website: ${companyWebsite}` : ''}
${recipientName ? `- Recipient: ${recipientName}` : ''}
${recipientTitle ? `- Recipient title: ${recipientTitle}` : ''}
- Email purpose: ${purpose || 'Introduction'}
- Tone: ${tone || 'Professional'}

INSTRUCTIONS:
1. INTELLIGENTLY ANALYZE the candidate's background and SELECT ONLY the most relevant experiences that align with the ${role} position at ${companyName}
2. Consider what skills, experiences, and achievements would be most valuable for this specific role and company
3. Use the template as the foundation but personalize it completely with the candidate's MOST RELEVANT details. Also, the template might have instructions such as user specifying certain topics that you should talk about so lease analyse carefully and ensure whatever is asked in the template is implemented.
4. Replace ALL placeholders with actual details:
   - [Company Name] → ${companyName}
   - [Role] or [Position] → ${role}
   - [Your Name] → ${user.name}
   - [Recipient Name] → ${recipientName || 'Hiring Manager'}
5. Focus on 2-3 most relevant work experiences that demonstrate fit for this role
6. Highlight skills and achievements that directly relate to what this position requires
7. Research ${companyName} and incorporate specific knowledge about their business
8. Don't mention irrelevant experiences - be selective and strategic
9. Make it feel like it was written specifically for this exact role and company
10. Keep the overall tone and structure of the template but make it completely personalized

The goal is to show clear alignment between the candidate's background and this specific opportunity.`;
    } else {
      // Use AI generation without template but with intelligent content selection
      prompt = `You are an expert at writing personalized, compelling cold emails for job applications. You have the candidate's complete background and need to intelligently select and emphasize the most relevant experiences, skills, and achievements for this specific role and company.

${userContext}

JOB APPLICATION DETAILS:
- Position applying for: ${role}
- Target company: ${companyName}
${companyWebsite ? `- Company website: ${companyWebsite}` : ''}
${recipientName ? `- Recipient: ${recipientName}` : '- Recipient: Hiring Manager'}
${recipientTitle ? `- Recipient title: ${recipientTitle}` : ''}
- Email purpose: ${purpose || 'Introduction'}
- Tone: ${tone || 'Professional'}

INSTRUCTIONS:
1. INTELLIGENTLY ANALYZE the candidate's background and SELECT ONLY the most relevant experiences for the ${role} position at ${companyName}
2. Consider what would be most impressive and relevant for this specific role and company
3. Write a compelling cold email highlighting the candidate's MOST RELEVANT qualifications
4. Focus on 2-3 work experiences that best demonstrate fit for this role
5. Emphasize skills and achievements that directly relate to what this position requires
6. Show genuine interest in ${companyName} and knowledge about their business
7. Use a ${tone || 'professional'} tone throughout
8. Keep it concise but impactful (under 200 words)
9. Include a compelling subject line
10. End with a clear call to action
11. Be strategic - don't mention everything, just the most relevant and impressive details
12. Make a clear connection between the candidate's background and this specific opportunity

${purpose === 'referral' ? 'IMPORTANT: This is a referral email - mention being referred by a mutual connection.' : ''}
${purpose === 'coffee' ? 'IMPORTANT: This is for a coffee chat - focus on learning about the company rather than applying directly.' : ''}
${purpose === 'followup' ? 'IMPORTANT: This is a follow-up email - reference a previous application or interaction.' : ''}

FORMAT:
Subject: [Write a compelling subject line]

[Email body - personalized to the company, role, and candidate's most relevant background]

Best regards,
${user.name}

Focus on quality over quantity - select the most compelling and relevant details to create a strong impression.`;
    }

    // Generate email with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: template 
            ? "You are a professional email writing expert who intelligently analyzes candidates' backgrounds to select and highlight only the most relevant experiences for each specific role and company, creating highly personalized and compelling emails."
            : "You are a professional email writing expert who intelligently analyzes candidates' backgrounds to select and highlight only the most relevant experiences for each specific role and company, creating highly personalized cold emails that get responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const generatedEmail = completion.choices[0].message.content;

    if (!generatedEmail) {
      throw new Error('No content generated');
    }

    const response = {
      email: generatedEmail,
      success: true,
      metadata: {
        role,
        companyName,
        purpose,
        tone,
        generatedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Email generation error:', error);
    
    // Handle specific OpenAI errors
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
      { error: 'Failed to generate email. Please try again.' },
      { status: 500 }
    );
  }
}