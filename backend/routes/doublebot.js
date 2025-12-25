import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import GroupReflection from '../models/GroupReflection.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';

const router = express.Router();

// Helper: Call Cerebras API
async function callCerebras(messages, systemPrompt) {
  const cerebrasMessages = [];
  
  if (systemPrompt) {
    cerebrasMessages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  
  cerebrasMessages.push(...messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  })));

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: cerebrasMessages,
      max_tokens: 300,
      temperature: 0.7,
      stream: false
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Cerebras API error');
  }

  return data.choices[0].message.content;
}

// Helper: Call heBERT for sentiment analysis
async function analyzeSentiment(text) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/avichr/heBERT_sentiment_analysis',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const data = await response.json();
    if (!response.ok) return null;
    return data[0];
  } catch (error) {
    console.error('Sentiment error:', error);
    return null;
  }
}

// Adaptive system prompt that changes based on conversation
function getAdaptiveSystemPrompt(conversationHistory, messageCount) {
  const basePrompt = `אתה בוט הערכה חכם שמנתח דינמיקה קבוצתית של סטודנטים.

תפקידך: לשאול שאלות מעמיקות שמתאימות לתשובות הקודמות.

נושאים לחקור (לא בהכרח בסדר הזה):
1. חלוקת תפקידים ומשימות
2. תקשורת בין חברי הקבוצה
3. קונפליקטים וחילוקי דעות
4. רמת שיתוף הפעולה
5. הרגשות של חברי הקבוצה
6. קבלת החלטות
7. מנהיגות ואחריות
8. נקודות חוזק וחולשה

חוקים:
- קרא את כל ההיסטוריה של השיחה
- זהה מה כבר נשאל ומה עוד חסר
- אם הסטודנט הזכיר קושי/בעיה - חקור את זה יותר עמוק
- אם הסטודנט מדבר בחיוב - שאל מה עוד עובד טוב
- אל תחזור על שאלות שכבר נשאלו
- שאל שאלה אחת בלבד בכל פעם
- היה אמפתי ותומך
- דבר בעברית בלבד

`;

  // Adapt based on conversation progress
  if (messageCount < 3) {
    return basePrompt + `\nמצב: תחילת השיחה - התחל בשאלות כלליות על חלוקת עבודה ותקשורת בסיסית.`;
  } else if (messageCount < 6) {
    return basePrompt + `\nמצב: אמצע השיחה - עכשיו חפש עומק - קונפליקטים, רגשות, דינמיקות נסתרות.`;
  } else {
    return basePrompt + `\nמצב: סיום השיחה - סכם את מה שלמדת ושאל שאלה אחרונה מעמיקה על שיפור או חזון.`;
  }
}

// POST /api/doublebot/start - Start conversation
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { reflectionId } = req.body;

    const reflection = await GroupReflection.findOne({
      _id: reflectionId,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    const systemPrompt = getAdaptiveSystemPrompt([], 0);
    const openingPrompt = `אתה מתחיל שיחה עם קבוצת סטודנטים שעובדים על: "${reflection.projectTopic}".
    
שאל שאלת פתיחה ידידותית על איך הקבוצה מתארגנת ומחלקת את העבודה ביניהם.
שאלה אחת בלבד. דבר בעברית.`;

    const botMessage = await callCerebras([], systemPrompt + '\n\n' + openingPrompt);

    reflection.conversationHistory.push({
      role: 'assistant',
      content: botMessage
    });

    reflection.stage = 'conversation';
    await reflection.save();

    res.json({
      message: 'Conversation started',
      botMessage,
      reflection
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/doublebot/message - Adaptive follow-up questions
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { reflectionId, userMessage } = req.body;

    const reflection = await GroupReflection.findOne({
      _id: reflectionId,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    // Add user message
    reflection.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const messageCount = reflection.conversationHistory.length;
    const systemPrompt = getAdaptiveSystemPrompt(reflection.conversationHistory, messageCount);

    // Adaptive instructions based on user's message
    let adaptiveInstruction = `\nהסטודנט אמר: "${userMessage}"\n\n`;
    
    // Check for keywords and adapt
    if (userMessage.includes('בעיה') || userMessage.includes('קושי') || userMessage.includes('קשה')) {
      adaptiveInstruction += 'הסטודנט הזכיר קושי או בעיה. חקור את זה עמוק יותר - מה הסיבה? איך זה משפיע? מה אפשר לעשות?';
    } else if (userMessage.includes('טוב') || userMessage.includes('מצוין') || userMessage.includes('עובד')) {
      adaptiveInstruction += 'הסטודנט חיובי. שאל מה עוד עובד טוב ומהי נקודת החוזק של הקבוצה.';
    } else if (userMessage.includes('לא') || userMessage.includes('כולם') || userMessage.includes('מישהו')) {
      adaptiveInstruction += 'יש רמז לדינמיקה מעניינת. חקור את התפקידים והמעורבות של חברי הקבוצה.';
    } else if (messageCount > 8) {
      adaptiveInstruction += 'השיחה ארוכה - זמן לסכום. שאל שאלה מסכמת על מה הקבוצה למדה או רוצה לשפר.';
    } else {
      adaptiveInstruction += 'המשך לחקור את הדינמיקה הקבוצתית בהתבסס על מה שכבר נאמר.';
    }

    const botMessage = await callCerebras(
      reflection.conversationHistory, 
      systemPrompt + adaptiveInstruction
    );

    reflection.conversationHistory.push({
      role: 'assistant',
      content: botMessage
    });

    await reflection.save();

    res.json({
      message: 'Message sent',
      botMessage,
      reflection
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/doublebot/analyze - Deep analysis
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { reflectionId } = req.body;

    const reflection = await GroupReflection.findOne({
      _id: reflectionId,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

        const conversationText = reflection.conversationHistory
      .map(m => m.content)
      .join(' ');

    const sentimentResults = await analyzeSentiment(conversationText);

    // GET CONVERSATION HISTORY for this team
    const previousReflections = await GroupReflection.find({
      teamId: reflection.teamId,
      _id: { $ne: reflection._id },
      stage: 'completed'
    }).sort({ createdAt: -1 }).limit(5);

    let historyContext = '';
    if (previousReflections.length > 0) {
      historyContext = `\n\nהיסטוריית שיחות קודמות של הצוות:
${previousReflections.map((ref, idx) => `
שיחה ${idx + 1} (${new Date(ref.createdAt).toLocaleDateString('he-IL')}):
- ניקוד: ${ref.scores?.overallScore || 'N/A'}
- ניתוח: ${ref.finalAnalysis?.substring(0, 200)}...
`).join('\n')}

חשוב: השווה את השיחה הנוכחית לשיחות הקודמות. האם יש שיפור? האם הבעיות נפתרו? תן המלצות בהתאם להתקדמות.`;
    } else {
      historyContext = '\n\nזוהי השיחה הראשונה של הצוות.';
    }

    // Enhanced analysis prompt with history
    const analysisPrompt = `נתח את השיחה הבאה בין בוט לקבוצת סטודנטים:

${conversationText}
${historyContext}

ספק ניתוח מעמיק (4-5 משפטים) על:
1. **תקשורת ושיתוף פעולה**: איך הקבוצה עובדת ביחד?
2. **נקודות חוזק**: מה עובד טוב בדינמיקה?
3. **אזורי שיפור**: איפה יש מקום להתפתחות?
${previousReflections.length > 0 ? '4. **התקדמות**: האם יש שיפור לעומת שיחות קודמות?' : ''}
5. **המלצה קונקרטית**: פעולה אחת ספציפית שהקבוצה צריכה לעשות השבוע.

דבר בעברית בלבד. היה ספציפי ומעשי.`;

    const analysisText = await callCerebras([], analysisPrompt);

    // Smart scoring based on conversation depth and sentiment
    let scores = {
      conversationQuality: 5,
      criticalThinking: 5,
      teamDynamics: 5,
      participationLevel: 'Low',
      insights: []
    };

    const messageCount = reflection.conversationHistory.length;
    
    // Conversation quality based on length and depth
    scores.conversationQuality = Math.min(10, 3 + Math.floor(messageCount / 2));
    scores.criticalThinking = Math.min(10, 4 + Math.floor(messageCount / 2.5));

    if (sentimentResults) {
      const sorted = sentimentResults.sort((a, b) => b.score - a.score);
      const dominant = sorted[0];

      if (dominant.label === 'positive') {
        scores.teamDynamics = 8 + Math.floor(dominant.score * 2);
        scores.participationLevel = 'High';
        scores.insights.push('🟢 אווירה חיובית ושיתוף פעולה טוב');
      } else if (dominant.label === 'neutral') {
        scores.teamDynamics = 6 + Math.floor(dominant.score);
        scores.participationLevel = 'Medium';
        scores.insights.push('🟡 שיחה מאוזנת ואובייקטיבית');
      } else {
        scores.teamDynamics = 4 + Math.floor(dominant.score);
        scores.participationLevel = 'Low';
        scores.insights.push('🔴 יש מתח או קושי בקבוצה - צריך תשומת לב');
      }

      scores.insights.push(`רגש דומיננטי: ${dominant.label} (${(dominant.score * 100).toFixed(0)}%)`);
    }

    // Bonus for deep conversations
    if (messageCount >= 8) {
      scores.insights.push('⭐ רפלקציה מעמיקה - השתתפות גבוהה');
      scores.conversationQuality = Math.min(10, scores.conversationQuality + 1);
    }

    scores.overallScore = Number(
      ((scores.conversationQuality + scores.criticalThinking + scores.teamDynamics) / 3).toFixed(1)
    );

    reflection.finalAnalysis = analysisText;
    reflection.scores = scores;
    reflection.stage = 'completed';
    await reflection.save();

    // Smart task generation
    const tasks = [];
    
    if (sentimentResults) {
      const sorted = sentimentResults.sort((a, b) => b.score - a.score);
      const dominant = sorted[0];

      if (dominant.label === 'negative' || dominant.score < 0.5) {
        tasks.push({
          teamId: reflection.teamId || reflection.groupName,
          title: 'פגישת חירום לשיפור האווירה',
          description: 'קיימו פגישת קבוצה דחופה לדון בקשיים ולשפר את התקשורת',
          category: 'communication',
          priority: 10,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });
      } else if (dominant.label === 'neutral') {
        tasks.push({
          teamId: reflection.teamId || reflection.groupName,
          title: 'הגדירו תפקידים ברורים',
          description: 'וודאו שכל חבר קבוצה יודע בדיוק מה התפקיד שלו',
          category: 'planning',
          priority: 8,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });
      }
    }

    if (messageCount < 6) {
      tasks.push({
        teamId: reflection.teamId || reflection.groupName,
        title: 'רפלקציה מעמיקה יותר',
        description: 'בפעם הבאה ענו על יותר שאלות (מינימום 8 הודעות)',
        category: 'communication',
        priority: 7,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    // Always add a follow-up task
    tasks.push({
      teamId: reflection.teamId || reflection.groupName,
      title: 'יישמו את ההמלצות',
      description: 'קראו את הניתוח והמלצות הבוט ויישמו לפחות המלצה אחת השבוע',
      category: 'other',
      priority: 9,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    for (const taskData of tasks) {
      const task = new Task(taskData);
      await task.save();
    }

    // Update team status
    if (reflection.teamId) {
      const team = await Team.findOne({ teamId: reflection.teamId });
      if (team) {
        const avgSentiment = sentimentResults?.[0]?.score || 0;
        
        if (avgSentiment > 0.5) {
          team.status = 'green';
        } else if (avgSentiment > 0.2) {
          team.status = 'yellow';
        } else {
          team.status = 'red';
        }
        
        team.averageSentiment = avgSentiment;
        team.lastActivity = new Date();
        team.sessionCount = (team.sessionCount || 0) + 1;
        await team.save();
      }
    }

    res.json({
      message: 'Analysis completed',
      analysis: analysisText,
      scores,
      sentimentResults,
      tasks,
      reflection
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


