// backend/src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.password
            }
        });
    }

    async sendInterviewResults(email, interviewData, pdfBuffer) {
        try {
            const mailOptions = {
                from: config.email.from,
                to: email,
                subject: 'Your Interview Results - TalentSync',
                html: this.generateEmailTemplate(interviewData),
                attachments: [{
                    filename: `interview-results-${interviewData._id}.pdf`,
                    content: pdfBuffer
                }]
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Email sent successfully', { messageId: info.messageId });
            return info;
        } catch (error) {
            logger.error('Failed to send email:', error);
            throw error;
        }
    }

    generateEmailTemplate(interview) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your TalentSync Interview Results</h2>
                <p>Dear ${interview.candidateName},</p>
                <p>Thank you for completing your interview with TalentSync. Your results are attached to this email.</p>
                
                <h3>Interview Summary</h3>
                <ul>
                    <li>Date: ${new Date(interview.startTime).toLocaleDateString()}</li>
                    <li>Duration: ${Math.round((interview.endTime - interview.startTime) / 60000)} minutes</li>
                    <li>Questions Answered: ${interview.answers.length}</li>
                </ul>

                <p>Please find your detailed results in the attached PDF.</p>
                
                <p>Best regards,<br>TalentSync Team</p>
            </div>
        `;
    }
}

module.exports = new EmailService();
