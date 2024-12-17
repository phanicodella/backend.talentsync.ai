// backend/src/services/openaiService.js
const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.maxRetries = 3;
        this.retryDelay = 1000;

        this.basePrompt = `You are an expert technical interviewer analyzing candidate responses.
Focus on:
1. Technical accuracy and depth
2. Problem-solving approach
3. Communication clarity
4. Best practices understanding
Provide structured analysis with specific scores and detailed feedback.`;
    }

    async analyzeAnswer(question, answer) {
        let attempts = 0;
        while (attempts < this.maxRetries) {
            try {
                const prompt = `
Question: "${question}"
Answer: "${answer}"

Provide analysis with:
1. Technical accuracy score (0-10)
2. Communication clarity score (0-10)
3. Problem-solving score (0-10)
4. Three main strengths
5. Three areas for improvement
6. Overall impression
`;

                const completion = await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { 
                            role: "system", 
                            content: this.basePrompt 
                        },
                        { 
                            role: "user", 
                            content: prompt 
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                });

                const analysis = this._parseAnalysis(completion.choices[0].message.content);
                logger.info('Answer analysis completed successfully');
                
                return {
                    scores: analysis.scores,
                    strengths: analysis.strengths,
                    improvements: analysis.improvements,
                    feedback: analysis.feedback,
                    overallScore: this._calculateOverallScore(analysis.scores)
                };
            } catch (error) {
                attempts++;
                logger.error(`OpenAI analysis attempt ${attempts} failed:`, error);
                
                if (attempts === this.maxRetries) {
                    logger.error('All OpenAI analysis attempts failed');
                    return this._getFallbackAnalysis();
                }
                
                await this._sleep(this.retryDelay * attempts);
            }
        }
    }

    async generateFinalReport(interview) {
        try {
            const answersPrompt = interview.answers
                .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
                .join('\n\n');

            const prompt = `
Analyze this complete interview:

${answersPrompt}

Provide:
1. Overall performance score (0-100)
2. Top 3 strengths
3. Top 3 areas for improvement
4. Technical skill assessment
5. Communication skill assessment
6. Final recommendations
`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: this.basePrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            return this._parseFinalReport(completion.choices[0].message.content);
        } catch (error) {
            logger.error('Final report generation failed:', error);
            return this._getFallbackReport();
        }
    }

    _parseAnalysis(content) {
        try {
            const scores = {};
            const scoreRegex = /(\w+)\s*(?:accuracy|clarity|solving)?\s*score:\s*(\d+)/gi;
            let match;
            
            while ((match = scoreRegex.exec(content)) !== null) {
                const category = match[1].toLowerCase();
                scores[category] = parseInt(match[2]);
            }

            const strengths = this._extractListItems(content, 'strengths');
            const improvements = this._extractListItems(content, 'improvements');

            return {
                scores: {
                    technical: scores.technical || 7,
                    clarity: scores.clarity || 7,
                    problemSolving: scores.solving || 7
                },
                strengths: strengths.length ? strengths : ["Shows basic understanding"],
                improvements: improvements.length ? improvements : ["Could provide more detail"],
                feedback: content
            };
        } catch (error) {
            logger.error('Analysis parsing failed:', error);
            return this._getFallbackAnalysis();
        }
    }

    _parseFinalReport(content) {
        try {
            const overallScoreMatch = content.match(/overall.*?(\d{1,3})/i);
            const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 70;

            return {
                overallScore,
                strengths: this._extractListItems(content, 'strengths'),
                improvements: this._extractListItems(content, 'improvements'),
                technicalAssessment: this._extractSection(content, 'technical skill assessment'),
                communicationAssessment: this._extractSection(content, 'communication skill assessment'),
                recommendations: this._extractListItems(content, 'recommendations')
            };
        } catch (error) {
            logger.error('Final report parsing failed:', error);
            return this._getFallbackReport();
        }
    }

    _extractListItems(content, section) {
        const sectionRegex = new RegExp(`${section}s?:([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
        const match = content.match(sectionRegex);
        
        if (!match) return ["Not available"];
        
        return match[1]
            .split('\n')
            .map(item => item.replace(/^[•\-\d.]\s*/, '').trim())
            .filter(item => item.length > 0)
            .slice(0, 3);
    }

    _extractSection(content, section) {
        const sectionRegex = new RegExp(`${section}:([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
        const match = content.match(sectionRegex);
        return match ? match[1].trim() : "Assessment not available";
    }

    _calculateOverallScore(scores) {
        const weights = {
            technical: 0.4,
            clarity: 0.3,
            problemSolving: 0.3
        };

        return Math.round(
            Object.entries(scores).reduce((sum, [key, value]) => {
                return sum + (value * (weights[key] || 0));
            }, 0) * 10
        );
    }

    _getFallbackAnalysis() {
        return {
            scores: {
                technical: 7,
                clarity: 7,
                problemSolving: 7
            },
            strengths: ["Response provided"],
            improvements: ["Could be more detailed"],
            feedback: "Analysis temporarily unavailable",
            overallScore: 70
        };
    }

    _getFallbackReport() {
        return {
            overallScore: 70,
            strengths: ["Completed the interview process"],
            improvements: ["Technical depth could be improved"],
            technicalAssessment: "Assessment temporarily unavailable",
            communicationAssessment: "Assessment temporarily unavailable",
            recommendations: ["Continue developing relevant skills"]
        };
    }

    async _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new OpenAIService();
