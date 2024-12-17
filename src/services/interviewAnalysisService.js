// backend/src/services/interviewAnalysisService.js
const openai = require('../config/openai');
const logger = require('../utils/logger');

class InterviewAnalysisService {
    constructor() {
        this.analysisPrompt = `
            As an AI interviewer, analyze the following interview response. Consider:
            1. Relevance to the question (0-10)
            2. Clarity of communication (0-10)
            3. Content depth (0-10)
            4. Professional language (0-10)
            5. Key strengths
            6. Areas for improvement
            
            Provide a structured analysis with scores and specific feedback.
        `;
    }

    async analyzeResponse(question, answer) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { 
                        role: "system", 
                        content: this.analysisPrompt 
                    },
                    { 
                        role: "user", 
                        content: `Question: ${question}\nAnswer: ${answer}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            const analysis = this._parseAnalysis(completion.choices[0].message.content);
            
            // Calculate confidence score based on various metrics
            const confidenceScore = (
                analysis.scores.relevance +
                analysis.scores.clarity +
                analysis.scores.contentDepth +
                analysis.scores.professionalLanguage
            ) / 4;

            return {
                scores: analysis.scores,
                feedback: analysis.feedback,
                confidence: confidenceScore,
                strengths: analysis.strengths,
                improvements: analysis.improvements,
                aiAnalysis: completion.choices[0].message.content
            };

        } catch (error) {
            logger.error('Interview analysis failed:', error);
            // Provide graceful fallback
            return {
                scores: {
                    relevance: 7,
                    clarity: 7,
                    contentDepth: 7,
                    professionalLanguage: 7
                },
                feedback: "Analysis temporarily unavailable. Please try again later.",
                confidence: 7,
                strengths: ["Unable to analyze strengths at this moment"],
                improvements: ["Unable to analyze improvements at this moment"],
                aiAnalysis: "Detailed analysis unavailable"
            };
        }
    }

    async generateFinalReport(interview) {
        try {
            const answers = interview.answers || [];
            const overallAnalysisPrompt = `
                Review this complete interview:
                ${answers.map(a => `Q: ${a.question}\nA: ${a.answer}\n`).join('\n')}
                
                Provide:
                1. Overall performance summary
                2. Key strengths (3-5 points)
                3. Areas for improvement (3-5 points)
                4. Overall score (0-100)
                5. Specific recommendations for development
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert interviewer providing detailed feedback." 
                    },
                    { 
                        role: "user", 
                        content: overallAnalysisPrompt 
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            });

            return this._parseFinalReport(completion.choices[0].message.content);

        } catch (error) {
            logger.error('Final report generation failed:', error);
            return {
                summary: "Report generation temporarily unavailable",
                overallScore: 70,
                strengths: ["Report generation is currently unavailable"],
                improvements: ["Please try again later"],
                recommendations: ["System is temporarily unable to provide recommendations"]
            };
        }
    }

    _parseAnalysis(content) {
        // Implement robust parsing of OpenAI response
        try {
            // Extract scores using regex
            const scores = {
                relevance: this._extractScore(content, 'relevance') || 7,
                clarity: this._extractScore(content, 'clarity') || 7,
                contentDepth: this._extractScore(content, 'content depth') || 7,
                professionalLanguage: this._extractScore(content, 'professional language') || 7
            };

            // Extract feedback sections
            const strengths = this._extractListItems(content, 'strengths');
            const improvements = this._extractListItems(content, 'improvement');

            return {
                scores,
                strengths: strengths.length ? strengths : ["Analysis pending"],
                improvements: improvements.length ? improvements : ["Analysis pending"],
                feedback: content
            };
        } catch (error) {
            logger.error('Analysis parsing failed:', error);
            return {
                scores: { relevance: 7, clarity: 7, contentDepth: 7, professionalLanguage: 7 },
                strengths: ["Analysis pending"],
                improvements: ["Analysis pending"],
                feedback: "Analysis parsing temporarily unavailable"
            };
        }
    }

    _extractScore(content, metric) {
        const regex = new RegExp(`${metric}.*?([0-9]{1,2})`, 'i');
        const match = content.match(regex);
        return match ? parseInt(match[1]) : null;
    }

    _extractListItems(content, section) {
        const sectionRegex = new RegExp(`${section}s?:?([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
        const sectionMatch = content.match(sectionRegex);
        
        if (!sectionMatch) return [];
        
        return sectionMatch[1]
            .split('\n')
            .map(item => item.replace(/^[•\-\d.]\s*/, '').trim())
            .filter(item => item.length > 0);
    }

    _parseFinalReport(content) {
        try {
            const overallScore = this._extractScore(content, 'overall score') || 70;
            const strengths = this._extractListItems(content, 'strength');
            const improvements = this._extractListItems(content, 'improvement');
            const recommendations = this._extractListItems(content, 'recommendation');

            return {
                summary: content,
                overallScore,
                strengths,
                improvements,
                recommendations
            };
        } catch (error) {
            logger.error('Final report parsing failed:', error);
            return {
                summary: "Report parsing temporarily unavailable",
                overallScore: 70,
                strengths: ["Report parsing is currently unavailable"],
                improvements: ["Please try again later"],
                recommendations: ["System is temporarily unable to provide recommendations"]
            };
        }
    }
}

module.exports = new InterviewAnalysisService();
