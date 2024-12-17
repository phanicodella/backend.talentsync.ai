// backend/tests/openai-integration.test.js
const assert = require('assert');
const openaiService = require('../src/services/openaiService');
const Interview = require('../src/models/interview');
const interviewController = require('../src/controllers/interviewController');

const testQuestions = [
    {
        question: "Tell me about your experience with Node.js",
        answer: "I have been working with Node.js for 3 years, building RESTful APIs and real-time applications. I've used Express.js extensively and have experience with MongoDB and WebSocket implementations."
    },
    {
        question: "How do you handle error handling in async/await?",
        answer: "I use try-catch blocks around async operations. For promise chains, I ensure proper error handling in .catch() blocks. I also implement global error handlers for uncaught exceptions."
    }
];

async function runOpenAITests() {
    console.log('🧪 Starting OpenAI Integration Tests\n');

    try {
        // Test 1: Single Answer Analysis
        console.log('Test 1: Single Answer Analysis');
        const analysis = await openaiService.analyzeAnswer(
            testQuestions[0].question,
            testQuestions[0].answer
        );

        assert(analysis.scores, 'Analysis should contain scores');
        assert(analysis.strengths.length > 0, 'Analysis should contain strengths');
        assert(analysis.improvements.length > 0, 'Analysis should contain improvements');
        console.log('✅ Single Answer Analysis Test Passed\n');

        // Test 2: Complete Interview Report
        console.log('Test 2: Complete Interview Report');
        const mockInterview = {
            answers: testQuestions.map(q => ({
                question: q.question,
                answer: q.answer,
                timestamp: new Date()
            }))
        };

        const report = await openaiService.generateFeedbackReport(mockInterview);
        assert(report.overallScore >= 0 && report.overallScore <= 100, 'Overall score should be between 0 and 100');
        assert(report.strengths.length > 0, 'Report should contain strengths');
        assert(report.improvements.length > 0, 'Report should contain improvements');
        console.log('✅ Complete Interview Report Test Passed\n');

        // Test 3: Integration with Interview Controller
        console.log('Test 3: Interview Controller Integration');
        const mockReq = {
            body: {
                interviewId: 'mock-id',
                question: testQuestions[0].question,
                answer: testQuestions[0].answer
            }
        };

        const mockRes = {
            json: (data) => {
                assert(data.success, 'Response should indicate success');
                assert(data.data.answer.analysis, 'Response should contain answer analysis');
                return data;
            },
            status: (code) => ({
                json: (data) => ({ status: code, ...data })
            })
        };

        // Mock Interview.findById
        Interview.findById = async () => ({
            _id: 'mock-id',
            answers: [],
            save: async () => ({ _id: 'mock-id' })
        });

        await interviewController.submitAnswer(mockReq, mockRes);
        console.log('✅ Controller Integration Test Passed\n');

        // Test 4: Error Handling
        console.log('Test 4: Error Handling');
        const analysisWithInvalidInput = await openaiService.analyzeAnswer('', '');
        assert(analysisWithInvalidInput.scores, 'Should provide fallback scores on error');
        assert(analysisWithInvalidInput.strengths, 'Should provide fallback strengths on error');
        console.log('✅ Error Handling Test Passed\n');

        console.log('🎉 All OpenAI Integration Tests Passed!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
        throw error;
    }
}

// Run the tests
runOpenAITests().catch(console.error);
