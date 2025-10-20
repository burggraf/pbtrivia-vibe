import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Disable auto-cancellation for better experience in React
pb.autoCancellation(false);

export default pb;