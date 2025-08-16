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

interface CoverLetterRequest {
  role: string;
  companyName: string;
  companyWebsite?: string;
  purpose?: string;
  tone?: string;
  length?: string;
  template?: string; 
}

interface CoverLetterResponse {
  letter: string;
  success: boolean;
  metadata: {
    role: string;
    companyName: string;
    purpose?: string;
    tone?: string;
    length?: string;
    generatedAt: string;
  };
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CoverLetterResponse | ErrorResponse>> {
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

    const body: CoverLetterRequest = await request.json();
    const { 
      role, 
      companyName, 
      companyWebsite,
      purpose, 
      tone,
      length,
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
${personalSummary ? `Professional Summary: ${personalSummary}` : ''}

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
      prompt = `You are an expert at personalizing cover letter templates for job applications. You have the candidate's complete background and need to intelligently select and emphasize the most relevant experiences, skills, and achievements for this specific role and company.

${userContext}

TEMPLATE TO CUSTOMIZE:
${template}

JOB APPLICATION DETAILS:
- Position applying for: ${role}
- Target company: ${companyName}
${companyWebsite ? `- Company website: ${companyWebsite}` : ''}
- Application purpose: ${purpose || 'Application'}
- Tone: ${tone || 'Professional'}
- Length: ${length || 'Medium'}

INSTRUCTIONS:
1. INTELLIGENTLY ANALYZE the candidate's background and SELECT ONLY the most relevant experiences for the ${role} position at ${companyName}
2. Consider what experiences, skills, and achievements would be most valuable for this specific role and company
3. Use the template as the foundation but personalize it completely with the candidate's MOST RELEVANT details
4. Replace ALL placeholders with actual details:
   - [Company Name] → ${companyName}
   - [Role] or [Position] → ${role}
   - [Your Name] → ${user.name}
   - [Date] → ${new Date().toLocaleDateString()}
5. Focus on 3-4 most relevant work experiences that demonstrate clear fit for this role
6. Highlight specific achievements, skills, and qualifications that directly relate to what this position requires
7. Research ${companyName} and incorporate specific knowledge about their business/mission
8. Use concrete examples from the candidate's background that showcase relevant capabilities
9. Keep the overall structure and format of the template but make it completely personalized
10. Match the specified tone: ${tone || 'professional'}
11. Adjust length to match: ${length || 'medium'}
    - Short: 2-3 paragraphs (150-200 words)
    - Medium: 3-4 paragraphs (250-350 words)  
    - Full: 4-5 paragraphs (400-500 words)
12. Be selective and strategic - don't mention everything, just the most relevant and impressive details

${purpose === 'referral' ? 'IMPORTANT: This is a referral application - mention being referred by a mutual connection and how you learned about the opportunity.' : ''}
${purpose === 'internship' ? 'IMPORTANT: This is for an internship - focus on learning opportunities, academic background, and eagerness to gain experience.' : ''}

The goal is to demonstrate clear alignment between the candidate's background and this specific opportunity.`;
    } else {
      // Use AI generation without template but with intelligent content selection
      prompt = `You are an expert at writing compelling, professional cover letters. You have the candidate's complete background and need to intelligently select and emphasize the most relevant experiences, skills, and achievements for this specific role and company.

${userContext}

JOB APPLICATION DETAILS:
- Position applying for: ${role}
- Target company: ${companyName}
${companyWebsite ? `- Company website: ${companyWebsite}` : ''}
- Application purpose: ${purpose || 'Application'}
- Tone: ${tone || 'Professional'}
- Length: ${length || 'Medium'}

INSTRUCTIONS:
1. INTELLIGENTLY ANALYZE the candidate's background and SELECT ONLY the most relevant experiences for the ${role} position at ${companyName}
2. Consider what would be most impressive and relevant for this specific role and company
3. Write a compelling cover letter highlighting the candidate's MOST RELEVANT qualifications
4. Focus on 3-4 work experiences that best demonstrate fit for this role
5. Emphasize specific achievements, skills, and qualifications that directly relate to what this position requires
6. Use concrete examples from the candidate's background with quantifiable results where possible
7. Show genuine enthusiasm for ${companyName} and knowledge about their business
8. Connect the candidate's experience directly to what this role would require
9. Use a ${tone || 'professional'} tone throughout
10. Write a ${length || 'medium'} length letter:
    - Short: 2-3 paragraphs (150-200 words)
    - Medium: 3-4 paragraphs (250-350 words)  
    - Full: 4-5 paragraphs (400-500 words)
11. Include proper business letter formatting
12. End with a strong closing that requests an interview
13. Be strategic - select the most compelling and relevant details to create a strong impression

${purpose === 'referral' ? 'IMPORTANT: This is a referral application - mention being referred by a mutual connection and how you learned about the opportunity.' : ''}
${purpose === 'internship' ? 'IMPORTANT: This is for an internship - focus on learning opportunities, academic background, and eagerness to gain experience.' : ''}

FORMATTING REQUIREMENTS:
- Include proper header with placeholders for applicant contact info
- Include date and company address placeholders
- Use "Dear Hiring Manager," or "Dear [Department] Team," as greeting
- Professional business letter structure
- Sign off with "Sincerely," and name

CONTENT REQUIREMENTS:
- Opening: State the position and express strong interest with a compelling hook
- Body: Highlight most relevant qualifications, experience, and achievements specific to ${role}
- Company connection: Show knowledge of ${companyName} and why you want to work there specifically
- Closing: Request interview and thank them for consideration

Focus on quality over quantity - demonstrate clear fit between the candidate's background and the ${role} position at ${companyName}.`;
    }

    // Generate cover letter with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: template 
            ? "You are a professional career counselor and expert cover letter writer who intelligently analyzes candidates' backgrounds to select and highlight only the most relevant experiences for each specific role and company, creating highly personalized and compelling cover letters."
            : "You are a professional career counselor and expert cover letter writer who intelligently analyzes candidates' backgrounds to select and highlight only the most relevant experiences for each specific role and company, creating compelling cover letters that demonstrate clear job fit."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: length === 'short' ? 400 : length === 'full' ? 800 : 600,
    });

    const generatedLetter = completion.choices[0].message.content;

    if (!generatedLetter) {
      throw new Error('No content generated');
    }

    const response: CoverLetterResponse = {
      letter: generatedLetter,
      success: true,
      metadata: {
        role,
        companyName,
        purpose,
        tone,
        length,
        generatedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Cover letter generation error:', error);
    
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
      { error: 'Failed to generate cover letter. Please try again.' },
      { status: 500 }
    );
  }
}