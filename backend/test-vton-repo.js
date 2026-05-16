import vtonRepo from './src/repositories/vton.repository.js';

async function test() {
  try {
    const model = await vtonRepo.getOrCreateAIModel(
      'IDM-VTON',
      '1.0',
      'Virtual try-on model'
    );
    console.log('✅ AI Model created:', model);
    const session = await vtonRepo.createSession({
      userId: 1, // Thay bằng user ID thật
      inputImage: '/uploads/test.jpg',
      status: 'PENDING'
    });
    console.log('✅ Session created:', session);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
