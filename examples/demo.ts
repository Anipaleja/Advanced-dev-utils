import { 
  SmartCache, 
  StringUtils, 
  CryptoUtils, 
  MathUtils, 
  ArrayUtils,
  AsyncQueue,
  PerformanceMonitor 
} from '../src/index';

async function demonstrateAdvancedUtils() {
  console.log('Advanced Dev Utils - Demo\n');

  // 1. Smart Caching Demo
  console.log('Smart Caching:');
  const cache = new SmartCache({ maxSize: 100, ttl: 60000 });
  
  await cache.set('user:123', { name: 'John Doe', age: 30 });
  const user = await cache.get('user:123');
  console.log('Cached user:', user);

  // 2. String Utils Demo
  console.log('\nString Utils:');
  const text1 = 'Hello World';
  const text2 = 'Hello Universe';
  const similarity = StringUtils.similarity(text1, text2);
  console.log(`Similarity between "${text1}" and "${text2}": ${similarity.toFixed(2)}`);
  
  const camelCase = StringUtils.toCamelCase('hello_world_example');
  console.log(`Camel case: ${camelCase}`);

  // 3. Crypto Utils Demo
  console.log('\nCrypto Utils:');
  const randomString = CryptoUtils.randomString(16);
  console.log(`Random string: ${randomString}`);
  
  const uuid = CryptoUtils.uuid();
  console.log(`UUID: ${uuid}`);

  const hash = await CryptoUtils.hash('Hello World');
  console.log(`SHA-256 hash: ${hash.substring(0, 20)}...`);

  // 4. Math Utils Demo
  console.log('\nMath Utils:');
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const mean = MathUtils.average(numbers);
  const median = MathUtils.median(numbers);
  const stdDev = MathUtils.standardDeviation(numbers);
  console.log(`Statistics for [1..10]:`, {
    mean: mean,
    median: median,
    stdDev: stdDev.toFixed(2)
  });

  // 5. Array Utils Demo
  console.log('\nArray Utils:');
  const data = [1, 2, 3, 4, 5];
  const chunks = ArrayUtils.chunk(data, 2);
  console.log(`Chunked array:`, chunks);

  const unique = ArrayUtils.unique([1, 2, 2, 3, 3, 4]);
  console.log(`Unique values:`, unique);

  // 6. Async Queue Demo
  console.log('\nAsync Queue:');
  const queue = new AsyncQueue({ concurrency: 2 });
  
  const tasks = [
    () => new Promise(resolve => setTimeout(() => resolve('Task 1'), 100)),
    () => new Promise(resolve => setTimeout(() => resolve('Task 2'), 200)),
    () => new Promise(resolve => setTimeout(() => resolve('Task 3'), 150))
  ];

  console.log('Processing tasks...');
  for (const task of tasks) {
    queue.add(task);
  }
  
  await queue.drain();
  console.log('All tasks completed!');

  // 7. Performance Monitor Demo
  console.log('\nPerformance Monitor:');
  const monitor = new PerformanceMonitor();
  
  // Monitor a function
  const result = monitor.monitor(() => {
    // Simulate some work
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  }, 'calculation');
  
  console.log('Calculation result:', result);
  
  // Get analytics
  const analytics = monitor.getAnalytics();
  console.log('Average execution time:', analytics.summary.averageExecutionTime.toFixed(2) + 'ms');

  console.log('\nDemo completed successfully!');
}

// Run the demo
demonstrateAdvancedUtils().catch(console.error);
