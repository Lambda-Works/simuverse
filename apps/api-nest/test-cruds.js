const API_URL = 'http://localhost:5001/api';

async function run() {
  console.log('Testing Authentication...');
  const authRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@simuverse.edu', password: 'Admin123!' })
  });
  
  if (!authRes.ok) {
    console.error('Auth failed', await authRes.text());
    return;
  }
  const authData = await authRes.json();
  const token = authData.token || authData.access_token;
  
  if (!token) {
    console.error('No token returned', authData);
    return;
  }
  
  console.log('Auth OK, token obtained.');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Test GET /courses
  console.log('\n--- Testing GET /courses ---');
  const getCourses = await fetch(`${API_URL}/courses`, { headers });
  console.log('GET /courses status:', getCourses.status);
  if (getCourses.ok) {
    console.log('GET /courses success');
  } else {
    console.error('GET /courses error:', await getCourses.text());
  }

  // Test POST /courses
  console.log('\n--- Testing POST /courses ---');
  const postCourse = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      course_id: 'test-course-001',
      title: 'Test Course',
      category: 'test',
      modules: [],
      categories: [],
      eval_criteria: [],
      crisis_events: []
    })
  });
  console.log('POST /courses status:', postCourse.status);
  let createdCourse;
  if (!postCourse.ok) {
    console.error('POST /courses error:', await postCourse.text());
  } else {
      createdCourse = await postCourse.json();
      console.log('POST /courses success, id:', createdCourse.id);
  }

  // Test GET /scenarios
  console.log('\n--- Testing GET /scenarios ---');
  const getScenarios = await fetch(`${API_URL}/scenarios`, { headers });
  console.log('GET /scenarios status:', getScenarios.status);
  if (!getScenarios.ok) {
    console.error('GET /scenarios error:', await getScenarios.text());
  }

  const actualCourseId = createdCourse ? createdCourse.id : 'fallback-id';

  console.log('\n--- Test 3: POST /scenarios ---');
  const postScenario = await fetch(`${API_URL}/scenarios`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Scenario',
      course_id: actualCourseId,
      difficulty: 'medium'
    })
  });
  console.log('POST /scenarios status:', postScenario.status);
  if (!postScenario.ok) {
    console.error('POST /scenarios error:', await postScenario.text());
  }
}

run().catch(console.error);
