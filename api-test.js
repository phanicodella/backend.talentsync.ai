const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';
let testInterviewId = null;
let authToken = null;

async function runAPITests() {
    try {
        // Authentication Test
        console.log('🔐 Authentication Test');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testcandidate@example.com',
            name: 'Test Candidate'
        });
        assert(loginResponse.data.token, 'Authentication failed');
        authToken = loginResponse.data.token;
        console.log('✅ Authentication Successful');

        // Interview Creation Test
        console.log('🎬 Interview Creation Test');
        const createInterviewResponse = await axios.post(`${BASE_URL}/interviews/create`, 
            {
                email: 'testcandidate@example.com',
                name: 'Test Candidate'
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        assert(createInterviewResponse.data._id, 'Interview creation failed');
        testInterviewId = createInterviewResponse.data._id;
        console.log('✅ Interview Created Successfully');

        // Answer Submission Test
        console.log('💬 Answer Submission Test');
        const answerSubmissionResponse = await axios.post(`${BASE_URL}/interviews/answer`, 
            {
                interviewId: testInterviewId,
                question: 'Tell me about yourself',
                answer: 'I am a software engineer with 5 years of experience in full-stack development.'
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        assert(answerSubmissionResponse.data.answers, 'Answer submission failed');
        console.log('✅ Answer Submitted Successfully');

        // Get Interview Details Test
        console.log('🔍 Get Interview Details Test');
        const getInterviewResponse = await axios.get(`${BASE_URL}/interviews/${testInterviewId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        assert(getInterviewResponse.data._id === testInterviewId, 'Get interview details failed');
        console.log('✅ Interview Details Retrieved Successfully');

        // End Interview Test
        console.log('🏁 End Interview Test');
        const endInterviewResponse = await axios.post(`${BASE_URL}/interviews/${testInterviewId}/end`, 
            {},
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        assert(endInterviewResponse.data.status === 'completed', 'Interview end failed');
        console.log('✅ Interview Ended Successfully');

        console.log('\n🎉 All API Tests Passed Successfully! 🎉');
    } catch (error) {
        console.error('❌ API Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

runAPITests();