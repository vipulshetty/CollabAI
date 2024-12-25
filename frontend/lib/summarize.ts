interface Sentence {
  text: string;
  score: number;
}

interface KeyTopic {
  topic: string;
  details: string[];
}

function extractPersonalInfo(text: string): { name?: string; role?: string; institution?: string } {
  const info: { name?: string; role?: string; institution?: string } = {};
  
  // Extract name
  const nameMatch = text.match(/\bmy name is\s+([^.,!?\n]+)/i);
  if (nameMatch) {
    info.name = nameMatch[1].trim();
  }

  // Extract role/position
  const roleMatch = text.match(/\b(?:I am|I'm)\s+(?:a\s+)?([^.,!?\n]*(?:student|engineer|developer|professor|teacher))/i);
  if (roleMatch) {
    info.role = roleMatch[1].trim();
  }

  // Extract institution
  const institutionMatch = text.match(/\b(?:at|from|studying at|in)\s+([^.,!?\n]*(?:Institute|University|College|School))/i);
  if (institutionMatch) {
    info.institution = institutionMatch[1].trim();
  }

  return info;
}

function cleanTranscript(text: string): string {
  return text
    // Fix capitalization
    .replace(/\bi\b/g, "I")
    .replace(/\ba\b(?=\s+[A-Z])/g, "a")
    // Clean up spacing and punctuation
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/([.,!?])(?=[A-Za-z])/g, "$1 ")
    .trim();
}

function generateIntroductionSummary(text: string): string | null {
  const info = extractPersonalInfo(text);
  if (!Object.keys(info).length) return null;

  let summary = "Meeting Summary:\n";
  const points: string[] = [];

  if (info.name || info.role || info.institution) {
    let intro = "The speaker";
    if (info.name) {
      intro = info.name;
    }
    
    if (info.role) {
      summary += `${intro} introduced themselves as ${info.role}`;
      points.push(`Role: ${info.role}`);
    }
    
    if (info.institution) {
      if (info.role) {
        summary += ` at ${info.institution}`;
      } else {
        summary += `${intro} is from ${info.institution}`;
      }
      points.push(`Institution: ${info.institution}`);
    }
    
    summary += ".\n\n";
    
    if (points.length > 0) {
      summary += "Details:\n";
      points.forEach(point => summary += `• ${point}\n`);
    }
    
    return summary.trim();
  }
  
  return null;
}

function extractTopics(text: string): KeyTopic[] {
  const topics: KeyTopic[] = [];
  
  // Extract project-related information
  const projectMatches = text.match(/\b(?:project|build|develop|create)\b[^.!?]*(?:[.!?]|$)/gi) || [];
  if (projectMatches.length > 0) {
    topics.push({
      topic: "Project Discussion",
      details: projectMatches.map(m => cleanTranscript(m))
    });
  }

  // Extract technology mentions
  const techMatches = text.match(/\b(?:next\.?js|react|typescript|javascript|api|backend|frontend)\b[^.!?]*(?:[.!?]|$)/gi) || [];
  if (techMatches.length > 0) {
    topics.push({
      topic: "Technical Discussion",
      details: techMatches.map(m => cleanTranscript(m))
    });
  }

  // Extract action items or plans
  const actionMatches = text.match(/\b(?:will|plan|need to|should|must|going to)\b[^.!?]*(?:[.!?]|$)/gi) || [];
  if (actionMatches.length > 0) {
    topics.push({
      topic: "Action Items",
      details: actionMatches.map(m => cleanTranscript(m))
    });
  }

  return topics;
}

function generateStructuredSummary(text: string): string {
  const cleanedText = cleanTranscript(text);
  
  // Try introduction summary first
  const introSummary = generateIntroductionSummary(cleanedText);
  if (introSummary) {
    return introSummary;
  }

  // If not an introduction, try topic-based summary
  const topics = extractTopics(cleanedText);
  if (topics.length === 0) {
    // If no specific topics found, return a simple summary
    return `Meeting Summary:\n${cleanedText}`;
  }

  let summary = "Meeting Summary:\n";

  // Add overview paragraph
  const overview = topics.flatMap(t => t.details)
    .slice(0, 2)
    .join(" ");
  summary += overview + "\n\n";

  // Add detailed sections
  topics.forEach(topic => {
    if (topic.details.length > 0) {
      summary += `${topic.topic}:\n`;
      topic.details.forEach(detail => {
        const cleanDetail = detail
          .replace(/^(and|also|additionally)\s*/i, "")
          .replace(/^[^\w]+/, "")
          .trim();
        summary += `• ${cleanDetail}\n`;
      });
      summary += "\n";
    }
  });

  return summary.trim();
}

export function generateSummary(text: string): string {
  if (!text.trim()) {
    return "No transcript content available.";
  }
  
  return generateStructuredSummary(text);
}
