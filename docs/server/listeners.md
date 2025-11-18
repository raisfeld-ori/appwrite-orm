# Realtime Listeners

ServerORM provides powerful realtime event listeners that enable you to build responsive, real-time server applications. React to database changes instantly and keep your application state synchronized.

## Overview

Server-side realtime listeners allow you to:

- React to database changes in real-time
- Automatically invalidate cache when data changes
- Build real-time APIs and WebSocket servers
- Process background jobs triggered by data changes
- Sync data across multiple server instances

## Basic Usage

### Listen to Document Changes

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'orders',
  schema: {
    userId: { type: 'string', required: true },
    status: { type: 'string', required: true },
    total: { type: 'float', required: true }
  }
}]);

const ordersTable = db.table('orders');

// Listen to all document changes in the collection
const unsubscribe = ordersTable.listenToDocuments((event) => {
  console.log('Order changed:', event.payload);
  console.log('Event type:', event.events);
  
  // Cache is automatically invalidated
  // Process the order change
  processOrderChange(event.payload);
});

// Clean up when shutting down
process.on('SIGTERM', () => {
  unsubscribe();
});
```

### Listen to Specific Document

```typescript
const orderId = 'order-123';

const unsubscribe = ordersTable.listenToDocument(orderId, (event) => {
  console.log('Specific order changed:', event.payload);
  
  if (event.events.includes('databases.*.collections.*.documents.*.update')) {
    handleOrderUpdate(event.payload);
  }
  
  if (event.events.includes('databases.*.collections.*.documents.*.delete')) {
    handleOrderDeletion(event.payload);
  }
});
```

### Listen to Collection Events

```typescript
// Listen to collection-level changes
const unsubscribe = ordersTable.listenToCollection((event) => {
  console.log('Orders collection changed:', event);
  // Triggered by collection structure changes, permissions, etc.
});
```

### Listen to Database Events

```typescript
// Listen to database-level changes
const unsubscribe = ordersTable.listenToDatabase((event) => {
  console.log('Database changed:', event);
  // Triggered by any change in the database
});
```

## WebSocket Server Integration

### Real-time API Server

```typescript
import { WebSocketServer } from 'ws';
import { ServerORM } from 'appwrite-orm/server';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

// Initialize ORM
const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'messages',
  schema: {
    roomId: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    text: { type: 'string', required: true },
    timestamp: { type: 'datetime', default: new Date() }
  }
}]);

// Track WebSocket connections by room
wss.on('connection', (ws, req) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'join-room') {
      if (!clients.has(message.roomId)) {
        clients.set(message.roomId, new Set());
      }
      clients.get(message.roomId).add(ws);
      
      ws.roomId = message.roomId;
      ws.userId = message.userId;
    }
  });

  ws.on('close', () => {
    if (ws.roomId && clients.has(ws.roomId)) {
      clients.get(ws.roomId).delete(ws);
    }
  });
});

// Listen for real-time message changes
db.table('messages').listenToDocuments((event) => {
  const message = event.payload;
  const roomClients = clients.get(message.roomId);
  
  if (roomClients) {
    const broadcastData = JSON.stringify({
      type: 'message-update',
      data: message,
      event: event.events[0]
    });
    
    roomClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(broadcastData);
      }
    });
  }
});

console.log('WebSocket server running on port 8080');
```

### Express.js with Server-Sent Events

```typescript
import express from 'express';
import { ServerORM } from 'appwrite-orm/server';

const app = express();
app.use(express.json());

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'notifications',
  schema: {
    userId: { type: 'string', required: true },
    message: { type: 'string', required: true },
    read: { type: 'boolean', default: false }
  }
}]);

// Store SSE connections
const sseClients = new Map();

// SSE endpoint
app.get('/notifications/stream/:userId', (req, res) => {
  const userId = req.params.userId;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Store client connection
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    if (sseClients.has(userId)) {
      sseClients.get(userId).delete(res);
    }
  });
});

// Listen for new notifications
db.table('notifications').listenToDocuments((event) => {
  const notification = event.payload;
  const userClients = sseClients.get(notification.userId);
  
  if (userClients && event.events.includes('create')) {
    const eventData = JSON.stringify({
      type: 'new-notification',
      data: notification
    });
    
    userClients.forEach(client => {
      try {
        client.write(`data: ${eventData}\n\n`);
      } catch (error) {
        console.error('Error sending SSE:', error);
        userClients.delete(client);
      }
    });
  }
});

// API to create notifications
app.post('/notifications', async (req, res) => {
  try {
    const notification = await db.table('notifications').create(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Background Job Processing

### Job Queue with Realtime Triggers

```typescript
import { ServerORM } from 'appwrite-orm/server';

const db = await orm.init([
  {
    name: 'jobs',
    schema: {
      type: { type: 'string', required: true },
      status: { type: 'string', default: 'pending' },
      data: { type: 'string', required: true },
      result: { type: 'string' },
      attempts: { type: 'integer', default: 0 },
      maxAttempts: { type: 'integer', default: 3 }
    }
  },
  {
    name: 'job_logs',
    schema: {
      jobId: { type: 'string', required: true },
      level: { type: 'string', required: true },
      message: { type: 'string', required: true },
      timestamp: { type: 'datetime', default: new Date() }
    }
  }
]);

class JobProcessor {
  private jobsTable = db.table('jobs');
  private logsTable = db.table('job_logs');

  constructor() {
    this.setupJobListener();
  }

  private setupJobListener() {
    // Listen for new jobs
    this.jobsTable.listenToDocuments(async (event) => {
      const job = event.payload;
      
      if (job.status === 'pending' && event.events.includes('create')) {
        await this.processJob(job);
      }
    });
  }

  private async processJob(job: any) {
    try {
      await this.logJob(job.$id, 'info', `Starting job ${job.type}`);
      
      // Update job status to processing
      await this.jobsTable.update(job.$id, { 
        status: 'processing',
        attempts: job.attempts + 1
      });

      // Process based on job type
      let result;
      switch (job.type) {
        case 'send-email':
          result = await this.sendEmail(JSON.parse(job.data));
          break;
        case 'generate-report':
          result = await this.generateReport(JSON.parse(job.data));
          break;
        case 'process-payment':
          result = await this.processPayment(JSON.parse(job.data));
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      await this.jobsTable.update(job.$id, {
        status: 'completed',
        result: JSON.stringify(result)
      });

      await this.logJob(job.$id, 'info', 'Job completed successfully');

    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  private async handleJobError(job: any, error: any) {
    await this.logJob(job.$id, 'error', error.message);

    if (job.attempts >= job.maxAttempts) {
      // Mark as failed
      await this.jobsTable.update(job.$id, {
        status: 'failed',
        result: error.message
      });
    } else {
      // Retry later
      await this.jobsTable.update(job.$id, {
        status: 'pending' // Will trigger reprocessing
      });
    }
  }

  private async logJob(jobId: string, level: string, message: string) {
    await this.logsTable.create({
      jobId,
      level,
      message,
      timestamp: new Date()
    });
  }

  private async sendEmail(data: any) {
    // Implement email sending
    console.log('Sending email:', data);
    return { sent: true, messageId: 'msg-123' };
  }

  private async generateReport(data: any) {
    // Implement report generation
    console.log('Generating report:', data);
    return { reportId: 'report-123', url: '/reports/report-123.pdf' };
  }

  private async processPayment(data: any) {
    // Implement payment processing
    console.log('Processing payment:', data);
    return { transactionId: 'txn-123', status: 'success' };
  }

  // Public method to queue jobs
  async queueJob(type: string, data: any, maxAttempts = 3) {
    return await this.jobsTable.create({
      type,
      data: JSON.stringify(data),
      maxAttempts,
      status: 'pending'
    });
  }
}

const jobProcessor = new JobProcessor();

// Example: Queue a job
await jobProcessor.queueJob('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Welcome to our service!'
});
```

### Order Processing Pipeline

```typescript
class OrderProcessor {
  private ordersTable = db.table('orders');
  private paymentsTable = db.table('payments');
  private inventoryTable = db.table('inventory');

  constructor() {
    this.setupOrderListener();
    this.setupPaymentListener();
  }

  private setupOrderListener() {
    this.ordersTable.listenToDocuments(async (event) => {
      const order = event.payload;
      
      switch (order.status) {
        case 'pending':
          await this.processNewOrder(order);
          break;
        case 'paid':
          await this.fulfillOrder(order);
          break;
        case 'shipped':
          await this.notifyCustomer(order);
          break;
      }
    });
  }

  private setupPaymentListener() {
    this.paymentsTable.listenToDocuments(async (event) => {
      const payment = event.payload;
      
      if (payment.status === 'completed') {
        // Update order status
        await this.ordersTable.update(payment.orderId, {
          status: 'paid'
        });
      }
    });
  }

  private async processNewOrder(order: any) {
    console.log(`Processing new order: ${order.$id}`);
    
    // Check inventory
    const items = JSON.parse(order.items);
    for (const item of items) {
      const inventory = await this.inventoryTable.get(item.productId);
      if (inventory.quantity < item.quantity) {
        await this.ordersTable.update(order.$id, {
          status: 'insufficient_inventory'
        });
        return;
      }
    }

    // Reserve inventory
    for (const item of items) {
      await this.inventoryTable.update(item.productId, {
        reserved: item.quantity
      });
    }

    // Update order status
    await this.ordersTable.update(order.$id, {
      status: 'inventory_reserved'
    });
  }

  private async fulfillOrder(order: any) {
    console.log(`Fulfilling order: ${order.$id}`);
    
    // Update inventory
    const items = JSON.parse(order.items);
    for (const item of items) {
      const inventory = await this.inventoryTable.get(item.productId);
      await this.inventoryTable.update(item.productId, {
        quantity: inventory.quantity - item.quantity,
        reserved: inventory.reserved - item.quantity
      });
    }

    // Create shipping label
    const shippingLabel = await this.createShippingLabel(order);
    
    // Update order
    await this.ordersTable.update(order.$id, {
      status: 'shipped',
      trackingNumber: shippingLabel.trackingNumber
    });
  }

  private async notifyCustomer(order: any) {
    console.log(`Notifying customer for order: ${order.$id}`);
    
    // Send notification
    await this.sendShippingNotification(order);
  }

  private async createShippingLabel(order: any) {
    // Implement shipping label creation
    return { trackingNumber: 'TRK-' + Date.now() };
  }

  private async sendShippingNotification(order: any) {
    // Implement customer notification
    console.log(`Shipping notification sent for order ${order.$id}`);
  }
}

const orderProcessor = new OrderProcessor();
```

## Multi-Instance Coordination

### Redis-Based Event Distribution

```typescript
import Redis from 'ioredis';
import { ServerORM } from 'appwrite-orm/server';

class DistributedEventHandler {
  private redis = new Redis(process.env.REDIS_URL);
  private instanceId = `server-${Date.now()}-${Math.random()}`;

  constructor(private db: any) {
    this.setupRealtimeListeners();
    this.setupRedisSubscription();
  }

  private setupRealtimeListeners() {
    // Listen to user changes
    this.db.table('users').listenToDocuments(async (event) => {
      // Broadcast to other instances
      await this.redis.publish('user-events', JSON.stringify({
        instanceId: this.instanceId,
        event,
        timestamp: Date.now()
      }));

      // Process locally
      await this.handleUserEvent(event);
    });
  }

  private setupRedisSubscription() {
    this.redis.subscribe('user-events');
    
    this.redis.on('message', async (channel, message) => {
      const data = JSON.parse(message);
      
      // Ignore events from this instance
      if (data.instanceId === this.instanceId) {
        return;
      }

      console.log(`Received event from ${data.instanceId}`);
      
      // Process event from other instance
      await this.handleUserEvent(data.event);
    });
  }

  private async handleUserEvent(event: any) {
    const user = event.payload;
    
    if (event.events.includes('create')) {
      await this.onUserCreated(user);
    } else if (event.events.includes('update')) {
      await this.onUserUpdated(user);
    } else if (event.events.includes('delete')) {
      await this.onUserDeleted(user);
    }
  }

  private async onUserCreated(user: any) {
    console.log(`User created: ${user.$id}`);
    // Send welcome email, create user profile, etc.
  }

  private async onUserUpdated(user: any) {
    console.log(`User updated: ${user.$id}`);
    // Update search index, sync with external services, etc.
  }

  private async onUserDeleted(user: any) {
    console.log(`User deleted: ${user.$id}`);
    // Clean up user data, cancel subscriptions, etc.
  }
}

const eventHandler = new DistributedEventHandler(db);
```

## Error Handling and Resilience

### Robust Event Processing

```typescript
class ResilientEventProcessor {
  private retryQueue = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(private db: any) {
    this.setupEventListeners();
    this.startRetryProcessor();
  }

  private setupEventListeners() {
    this.db.table('orders').listenToDocuments(async (event) => {
      await this.processEventWithRetry('order', event);
    });

    this.db.table('payments').listenToDocuments(async (event) => {
      await this.processEventWithRetry('payment', event);
    });
  }

  private async processEventWithRetry(type: string, event: any, attempt = 1) {
    try {
      await this.processEvent(type, event);
    } catch (error) {
      console.error(`Error processing ${type} event (attempt ${attempt}):`, error);

      if (attempt < this.maxRetries) {
        // Schedule retry
        const retryKey = `${type}-${event.payload.$id}-${Date.now()}`;
        this.retryQueue.set(retryKey, {
          type,
          event,
          attempt: attempt + 1,
          retryAt: Date.now() + (this.retryDelay * attempt)
        });
      } else {
        // Send to dead letter queue or log for manual intervention
        await this.handleFailedEvent(type, event, error);
      }
    }
  }

  private async processEvent(type: string, event: any) {
    switch (type) {
      case 'order':
        await this.processOrderEvent(event);
        break;
      case 'payment':
        await this.processPaymentEvent(event);
        break;
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
  }

  private async processOrderEvent(event: any) {
    // Simulate processing that might fail
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated processing error');
    }
    
    console.log('Order event processed successfully:', event.payload.$id);
  }

  private async processPaymentEvent(event: any) {
    // Simulate processing
    console.log('Payment event processed successfully:', event.payload.$id);
  }

  private startRetryProcessor() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, retry] of this.retryQueue.entries()) {
        if (retry.retryAt <= now) {
          this.retryQueue.delete(key);
          this.processEventWithRetry(retry.type, retry.event, retry.attempt);
        }
      }
    }, 1000); // Check every second
  }

  private async handleFailedEvent(type: string, event: any, error: any) {
    console.error(`Failed to process ${type} event after ${this.maxRetries} attempts:`, {
      eventId: event.payload.$id,
      error: error.message
    });

    // Log to database for manual review
    await this.db.table('failed_events').create({
      type,
      eventData: JSON.stringify(event),
      error: error.message,
      timestamp: new Date()
    });
  }
}

const processor = new ResilientEventProcessor(db);
```

## Performance Optimization

### Event Batching

```typescript
class BatchedEventProcessor {
  private eventBatches = new Map();
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds

  constructor(private db: any) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.db.table('analytics').listenToDocuments((event) => {
      this.addToBatch('analytics', event);
    });

    this.db.table('logs').listenToDocuments((event) => {
      this.addToBatch('logs', event);
    });
  }

  private addToBatch(type: string, event: any) {
    if (!this.eventBatches.has(type)) {
      this.eventBatches.set(type, {
        events: [],
        timer: null
      });
    }

    const batch = this.eventBatches.get(type);
    batch.events.push(event);

    // Process batch if it reaches the size limit
    if (batch.events.length >= this.batchSize) {
      this.processBatch(type);
    } else if (!batch.timer) {
      // Set timer for timeout-based processing
      batch.timer = setTimeout(() => {
        this.processBatch(type);
      }, this.batchTimeout);
    }
  }

  private async processBatch(type: string) {
    const batch = this.eventBatches.get(type);
    if (!batch || batch.events.length === 0) return;

    const events = [...batch.events];
    
    // Clear batch
    batch.events = [];
    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    try {
      await this.processEventBatch(type, events);
      console.log(`Processed batch of ${events.length} ${type} events`);
    } catch (error) {
      console.error(`Error processing ${type} batch:`, error);
      // Handle batch processing error
    }
  }

  private async processEventBatch(type: string, events: any[]) {
    switch (type) {
      case 'analytics':
        await this.processAnalyticsBatch(events);
        break;
      case 'logs':
        await this.processLogsBatch(events);
        break;
    }
  }

  private async processAnalyticsBatch(events: any[]) {
    // Aggregate analytics data
    const aggregated = events.reduce((acc, event) => {
      const data = event.payload;
      acc[data.metric] = (acc[data.metric] || 0) + data.value;
      return acc;
    }, {});

    // Store aggregated data
    for (const [metric, value] of Object.entries(aggregated)) {
      await this.db.table('analytics_summary').create({
        metric,
        value,
        period: 'hourly',
        timestamp: new Date()
      });
    }
  }

  private async processLogsBatch(events: any[]) {
    // Process logs in batch
    const logEntries = events.map(event => ({
      level: event.payload.level,
      message: event.payload.message,
      timestamp: event.payload.timestamp
    }));

    // Send to external logging service
    await this.sendToExternalLogger(logEntries);
  }

  private async sendToExternalLogger(logs: any[]) {
    // Implement external logging
    console.log(`Sent ${logs.length} logs to external service`);
  }
}

const batchProcessor = new BatchedEventProcessor(db);
```

## Cleanup and Shutdown

### Graceful Shutdown

```typescript
class GracefulShutdown {
  private listeners: (() => void)[] = [];
  private isShuttingDown = false;

  constructor(private db: any) {
    this.setupEventListeners();
    this.setupShutdownHandlers();
  }

  private setupEventListeners() {
    // Store unsubscribe functions
    this.listeners.push(
      this.db.table('users').listenToDocuments(this.handleUserEvent.bind(this)),
      this.db.table('orders').listenToDocuments(this.handleOrderEvent.bind(this)),
      this.db.table('payments').listenToDocuments(this.handlePaymentEvent.bind(this))
    );
  }

  private setupShutdownHandlers() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown('uncaughtException');
    });
  }

  private async handleUserEvent(event: any) {
    if (this.isShuttingDown) return;
    // Process user event
  }

  private async handleOrderEvent(event: any) {
    if (this.isShuttingDown) return;
    // Process order event
  }

  private async handlePaymentEvent(event: any) {
    if (this.isShuttingDown) return;
    // Process payment event
  }

  private async shutdown(signal: string) {
    if (this.isShuttingDown) return;
    
    console.log(`Received ${signal}, shutting down gracefully...`);
    this.isShuttingDown = true;

    try {
      // Close all realtime listeners
      console.log('Closing realtime listeners...');
      this.listeners.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error closing listener:', error);
        }
      });

      // Close all database listeners
      this.db.closeListeners();

      // Wait for ongoing operations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

const gracefulShutdown = new GracefulShutdown(db);
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ✅ Good - Proper error handling
const unsubscribe = table.listenToDocuments(async (event) => {
  try {
    await processEvent(event);
  } catch (error) {
    console.error('Event processing error:', error);
    // Handle error appropriately
  }
});

// ❌ Bad - No error handling
const unsubscribe = table.listenToDocuments(async (event) => {
  await processEvent(event); // Could crash the process
});
```

### 2. Implement Proper Cleanup

```typescript
// ✅ Good - Proper cleanup
class EventProcessor {
  private unsubscribes: (() => void)[] = [];

  setupListeners() {
    this.unsubscribes.push(
      table1.listenToDocuments(handler1),
      table2.listenToDocuments(handler2)
    );
  }

  cleanup() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }
}
```

### 3. Use Specific Listeners When Possible

```typescript
// ✅ Good - Specific listener
const unsubscribe = table.listenToDocument(specificId, handler);

// ❌ Less efficient - Filter in handler
const unsubscribe = table.listenToDocuments((event) => {
  if (event.payload.$id === specificId) {
    handler(event);
  }
});
```

### 4. Implement Idempotent Processing

```typescript
// ✅ Good - Idempotent processing
async function processOrder(order: any) {
  // Check if already processed
  const existing = await db.table('processed_orders').find([
    `equal("orderId", "${order.$id}")`
  ]);
  
  if (existing.length > 0) {
    console.log('Order already processed');
    return;
  }

  // Process order
  await doOrderProcessing(order);
  
  // Mark as processed
  await db.table('processed_orders').create({
    orderId: order.$id,
    processedAt: new Date()
  });
}
```

## Troubleshooting

### Debug Event Flow

```typescript
const unsubscribe = table.listenToDocuments((event) => {
  console.log('Event received:', {
    events: event.events,
    documentId: event.payload.$id,
    timestamp: event.timestamp
  });
});
```

### Monitor Performance

```typescript
const unsubscribe = table.listenToDocuments(async (event) => {
  const start = Date.now();
  
  try {
    await processEvent(event);
    console.log(`Event processed in ${Date.now() - start}ms`);
  } catch (error) {
    console.error(`Event failed after ${Date.now() - start}ms:`, error);
  }
});
```

### Check Connection Status

```typescript
// Monitor realtime connection health
setInterval(() => {
  console.log('Realtime listeners active:', {
    users: db.table('users').isUpdated(),
    orders: db.table('orders').isUpdated()
  });
}, 30000); // Every 30 seconds
```