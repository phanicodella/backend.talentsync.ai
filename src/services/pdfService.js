// backend/src/services/pdfService.js
const PDFDocument = require('pdfkit');
const moment = require('moment');
const logger = require('../utils/logger');

class PDFService {
    async generateInterviewReport(interview) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4'
                });

                let buffers = [];
                doc.on('data', buffer => buffers.push(buffer));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Header
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('Interview Results Report', { align: 'center' })
                   .moveDown();

                // Candidate Information
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Candidate Information')
                   .moveDown(0.5);

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Name: ${interview.candidateName}`)
                   .text(`Email: ${interview.candidate}`)
                   .text(`Date: ${moment(interview.startTime).format('MMMM Do YYYY, h:mm a')}`)
                   .text(`Duration: ${this.formatDuration(interview.endTime - interview.startTime)}`)
                   .moveDown();

                // Overall Score
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Overall Performance')
                   .moveDown(0.5);

                const overallScore = this.calculateOverallScore(interview.answers);
                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Overall Score: ${overallScore}%`)
                   .moveDown();

                // Question Analysis
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Question Analysis')
                   .moveDown(0.5);

                interview.answers.forEach((answer, index) => {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text(`Question ${index + 1}: ${answer.question}`)
                       .font('Helvetica')
                       .text(`Answer: ${answer.answer}`)
                       .text(`Duration: ${this.formatDuration(answer.duration)}`)
                       .text('Scores:')
                       .text(`  • Clarity: ${answer.analysis.clarity}/10`)
                       .text(`  • Relevance: ${answer.analysis.relevance}/10`)
                       .text(`  • Confidence: ${answer.analysis.confidence}/10`)
                       .moveDown();
                });

                // Strengths and Improvements
                doc.addPage();
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Strengths')
                   .moveDown(0.5);

                interview.feedback.strengths.forEach(strength => {
                    doc.fontSize(12)
                       .font('Helvetica')
                       .text(`• ${strength}`);
                });

                doc.moveDown()
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Areas for Improvement')
                   .moveDown(0.5);

                interview.feedback.improvements.forEach(improvement => {
                    doc.fontSize(12)
                       .font('Helvetica')
                       .text(`• ${improvement}`);
                });

                // Detailed Feedback
                doc.moveDown()
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Detailed Feedback')
                   .moveDown(0.5);

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(interview.feedback.aiAnalysis);

                // Footer
                doc.fontSize(10)
                   .text(
                       `Generated on ${moment().format('MMMM Do YYYY, h:mm:ss a')}`,
                       50,
                       doc.page.height - 50,
                       { align: 'center' }
                   );

                doc.end();

            } catch (error) {
                logger.error('PDF generation error:', error);
                reject(error);
            }
        });
    }

    calculateOverallScore(answers) {
        if (!answers.length) return 0;
        const totalScore = answers.reduce((sum, answer) => {
            const avgScore = (answer.analysis.clarity + 
                            answer.analysis.relevance + 
                            answer.analysis.confidence) / 3;
            return sum + avgScore;
        }, 0);
        return Math.round((totalScore / answers.length) * 10);
    }

    formatDuration(ms) {
        const duration = moment.duration(ms);
        const minutes = Math.floor(duration.asMinutes());
        const seconds = Math.floor(duration.seconds());
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = new PDFService();
