import fetch from 'node-fetch';

async function testServer() {
  try {
    const response = await fetch('http://localhost:5000/');
    const data = await response.json();
    console.log('✅ Server is running!');
    console.log('Response:', data);
    process.exit(0);
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

testServer();