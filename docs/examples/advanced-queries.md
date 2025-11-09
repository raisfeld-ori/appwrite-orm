# Advanced Query Examples

Explore sophisticated querying patterns and techniques using the Appwrite ORM's powerful query capabilities.

## Complex Filtering and Search

### Multi-Criteria Product Search

```typescript
import { ServerORM, Query } from 'appwrite-orm/server';

class AdvancedProductService {
  private static db: any;

  static async initialize() {
    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!
    });

    this.db = await orm.init([productTable, categoryTable, reviewTable]);
  }

  // Advanced product search with multiple filters
  static async searchProducts(searchParams: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    brands?: string[];
    tags?: string[];
    sortBy?: 'price' | 'rating' | 'popularity' | 'newest';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      brands,
      tags,
      sortBy = 'newest',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = searchParams;

    const queries = [];
    const offset = (page - 1) * limit;

    // Text search
    if (query) {
      queries.push(Query.search('name', query));
    }

    // Category filter
    if (category) {
      queries.push(Query.equal('category', category));
    }

    // Price range
    if (minPrice !== undefined) {
      queries.push(Query.greaterThanEqual('price', minPrice));
    }
    if (maxPrice !== undefined) {
      queries.push(Query.lessThanEqual('price', maxPrice));
    }

    // Rating filter
    if (minRating !== undefined) {
      queries.push(Query.greaterThanEqual('averageRating', minRating));
    }

    // Stock filter
    if (inStock) {
      queries.push(Query.greaterThan('stock', 0));
    }

    // Brand filter (multiple brands)
    if (brands && brands.length > 0) {
      queries.push(Query.equal('brand', brands));
    }

    // Tags filter (products must have at least one of the specified tags)
    if (tags && tags.length > 0) {
      // This would require a more complex query in a real implementation
      // For now, we'll search for products that contain any of the tags
      const tagQueries = tags.map(tag => Query.search('tags', tag));
      // Note: Appwrite doesn't support OR queries directly, 
      // so this would need to be handled differently in practice
    }

    // Sorting
    switch (sortBy) {
      case 'price':
        queries.push(sortOrder === 'asc' ? Query.orderAsc('price') : Query.orderDesc('price'));
        break;
      case 'rating':
        queries.push(sortOrder === 'asc' ? Query.orderAsc('averageRating') : Query.orderDesc('averageRating'));
        break;
      case 'popularity':
        queries.push(sortOrder === 'asc' ? Query.orderAsc('salesCount') : Query.orderDesc('salesCount'));
        break;
      case 'newest':
      default:
        queries.push(sortOrder === 'asc' ? Query.orderAsc('createdAt') : Query.orderDesc('createdAt'));
        break;
    }

    // Pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));

    const products = await this.db.products.find(queries);
    const total = await this.countProducts(searchParams);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Count products matching search criteria
  private static async countProducts(searchParams: any): Promise<number> {
    // Similar logic to searchProducts but without pagination and sorting
    const queries = [];

    if (searchParams.query) {
      queries.push(Query.search('name', searchParams.query));
    }
    if (searchParams.category) {
      queries.push(Query.equal('category', searchParams.category));
    }
    if (searchParams.minPrice !== undefined) {
      queries.push(Query.greaterThanEqual('price', searchParams.minPrice));
    }
    if (searchParams.maxPrice !== undefined) {
      queries.push(Query.lessThanEqual('price', searchParams.maxPrice));
    }
    if (searchParams.inStock) {
      queries.push(Query.greaterThan('stock', 0));
    }

    const results = await this.db.products.find(queries);
    return results.length;
  }

  // Get products with complex aggregations
  static async getProductAnalytics(categoryId?: string) {
    let baseQuery = {};
    if (categoryId) {
      baseQuery = { category: categoryId };
    }

    const [
      totalProducts,
      activeProducts,
      averagePrice,
      topRatedProducts,
      bestSellers,
      lowStockProducts
    ] = await Promise.all([
      this.db.products.count(baseQuery),
      this.db.products.count({ ...baseQuery, status: 'active' }),
      this.calculateAveragePrice(baseQuery),
      this.getTopRatedProducts(categoryId, 10),
      this.getBestSellingProducts(categoryId, 10),
      this.getLowStockProducts(categoryId, 10)
    ]);

    return {
      totalProducts,
      activeProducts,
      averagePrice,
      topRatedProducts,
      bestSellers,
      lowStockProducts
    };
  }

  private static async calculateAveragePrice(baseQuery: any): Promise<number> {
    const products = await this.db.products.query(baseQuery, {
      select: ['price']
    });
    
    if (products.length === 0) return 0;
    
    const total = products.reduce((sum: number, product: any) => sum + product.price, 0);
    return total / products.length;
  }

  private static async getTopRatedProducts(categoryId?: string, limit: number = 10) {
    const queries = [
      Query.greaterThan('averageRating', 4.0),
      Query.orderDesc('averageRating'),
      Query.limit(limit)
    ];

    if (categoryId) {
      queries.unshift(Query.equal('category', categoryId));
    }

    return await this.db.products.find(queries);
  }

  private static async getBestSellingProducts(categoryId?: string, limit: number = 10) {
    const queries = [
      Query.greaterThan('salesCount', 0),
      Query.orderDesc('salesCount'),
      Query.limit(limit)
    ];

    if (categoryId) {
      queries.unshift(Query.equal('category', categoryId));
    }

    return await this.db.products.find(queries);
  }

  private static async getLowStockProducts(categoryId?: string, threshold: number = 10) {
    const queries = [
      Query.lessThanEqual('stock', threshold),
      Query.greaterThan('stock', 0),
      Query.orderAsc('stock')
    ];

    if (categoryId) {
      queries.unshift(Query.equal('category', categoryId));
    }

    return await this.db.products.find(queries);
  }
}
```

## Time-Based Queries and Analytics

### Sales Analytics with Date Ranges

```typescript
class SalesAnalyticsService {
  private static db: any;

  // Get sales data for a specific time period
  static async getSalesAnalytics(startDate: Date, endDate: Date) {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Get orders within date range
    const orders = await this.db.orders.find([
      Query.greaterThanEqual('createdAt', startISO),
      Query.lessThanEqual('createdAt', endISO),
      Query.equal('status', 'completed'),
      Query.orderDesc('createdAt')
    ]);

    // Calculate metrics
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    // Group by day for trend analysis
    const dailySales = this.groupSalesByDay(orders);
    
    // Top products in this period
    const topProducts = await this.getTopProductsInPeriod(startDate, endDate);

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue,
      dailySales,
      topProducts
    };
  }

  // Get recurring customers (customers with multiple orders)
  static async getRecurringCustomers() {
    const allOrders = await this.db.orders.all({ select: ['customerId'] });
    
    // Group orders by customer
    const customerOrderCounts = allOrders.reduce((acc: any, order: any) => {
      acc[order.customerId] = (acc[order.customerId] || 0) + 1;
      return acc;
    }, {});

    // Filter customers with more than one order
    const recurringCustomerIds = Object.keys(customerOrderCounts)
      .filter(customerId => customerOrderCounts[customerId] > 1);

    // Get customer details
    const recurringCustomers = await Promise.all(
      recurringCustomerIds.map(async (customerId) => {
        const customer = await this.db.customers.get(customerId);
        return {
          ...customer,
          orderCount: customerOrderCounts[customerId]
        };
      })
    );

    return recurringCustomers.sort((a, b) => b.orderCount - a.orderCount);
  }

  // Get monthly growth metrics
  static async getMonthlyGrowth(year: number) {
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const [orderCount, revenue] = await Promise.all([
        this.db.orders.find([
          Query.greaterThanEqual('createdAt', startDate.toISOString()),
          Query.lessThanEqual('createdAt', endDate.toISOString()),
          Query.equal('status', 'completed')
        ]).then((orders: any[]) => orders.length),
        
        this.db.orders.find([
          Query.greaterThanEqual('createdAt', startDate.toISOString()),
          Query.lessThanEqual('createdAt', endDate.toISOString()),
          Query.equal('status', 'completed')
        ]).then((orders: any[]) => 
          orders.reduce((sum, order) => sum + order.total, 0)
        )
      ]);

      months.push({
        month: month + 1,
        orderCount,
        revenue,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0
      });
    }

    return months;
  }

  private static groupSalesByDay(orders: any[]) {
    const dailySales: { [key: string]: { orders: number; revenue: number } } = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      
      if (!dailySales[date]) {
        dailySales[date] = { orders: 0, revenue: 0 };
      }
      
      dailySales[date].orders += 1;
      dailySales[date].revenue += order.total;
    });

    return Object.entries(dailySales)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static async getTopProductsInPeriod(startDate: Date, endDate: Date) {
    // This would require order items table in a real implementation
    // For now, we'll simulate with a simplified approach
    const orders = await this.db.orders.find([
      Query.greaterThanEqual('createdAt', startDate.toISOString()),
      Query.lessThanEqual('createdAt', endDate.toISOString()),
      Query.equal('status', 'completed')
    ]);

    // In a real app, you'd join with order_items table
    // Here we'll assume orders have a productIds field
    const productSales: { [key: string]: number } = {};
    
    orders.forEach((order: any) => {
      if (order.productIds) {
        const productIds = JSON.parse(order.productIds);
        productIds.forEach((productId: string) => {
          productSales[productId] = (productSales[productId] || 0) + 1;
        });
      }
    });

    // Get top 10 products
    const topProductIds = Object.entries(productSales)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([productId]) => productId);

    // Get product details
    const topProducts = await Promise.all(
      topProductIds.map(async (productId) => {
        const product = await this.db.products.get(productId);
        return {
          ...product,
          salesCount: productSales[productId]
        };
      })
    );

    return topProducts;
  }
}
```

## Relationship Queries and Data Aggregation

### Blog System with Complex Relationships

```typescript
class AdvancedBlogService {
  private static db: any;

  // Get blog posts with author and comment statistics
  static async getPostsWithStats(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    // Get posts
    const posts = await this.db.posts.find([
      Query.equal('status', 'published'),
      Query.orderDesc('publishedAt'),
      Query.limit(limit),
      Query.offset(offset)
    ]);

    // Enrich posts with additional data
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const [author, commentCount, likeCount, viewCount] = await Promise.all([
          this.db.authors.get(post.authorId),
          this.db.comments.count({ postId: post.$id, isApproved: true }),
          this.db.likes.count({ postId: post.$id }),
          this.updateAndGetViewCount(post.$id)
        ]);

        return {
          ...post,
          author: {
            name: author?.name,
            avatar: author?.avatar
          },
          stats: {
            comments: commentCount,
            likes: likeCount,
            views: viewCount
          },
          tags: post.tags ? JSON.parse(post.tags) : []
        };
      })
    );

    return enrichedPosts;
  }

  // Get author profile with statistics
  static async getAuthorProfile(authorId: string) {
    const author = await this.db.authors.get(authorId);
    
    if (!author) {
      return null;
    }

    const [
      totalPosts,
      publishedPosts,
      totalViews,
      totalLikes,
      totalComments,
      recentPosts,
      popularPosts
    ] = await Promise.all([
      this.db.posts.count({ authorId }),
      this.db.posts.count({ authorId, status: 'published' }),
      this.getTotalViewsForAuthor(authorId),
      this.getTotalLikesForAuthor(authorId),
      this.getTotalCommentsForAuthor(authorId),
      this.getRecentPostsByAuthor(authorId, 5),
      this.getPopularPostsByAuthor(authorId, 5)
    ]);

    return {
      ...author,
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts: totalPosts - publishedPosts,
        totalViews,
        totalLikes,
        totalComments,
        averageViewsPerPost: publishedPosts > 0 ? totalViews / publishedPosts : 0
      },
      recentPosts,
      popularPosts
    };
  }

  // Get trending posts (high engagement in recent period)
  static async getTrendingPosts(days: number = 7, limit: number = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get recent posts
    const recentPosts = await this.db.posts.find([
      Query.greaterThan('publishedAt', cutoffDate.toISOString()),
      Query.equal('status', 'published')
    ]);

    // Calculate engagement score for each post
    const postsWithEngagement = await Promise.all(
      recentPosts.map(async (post: any) => {
        const [likes, comments, views] = await Promise.all([
          this.db.likes.count({ postId: post.$id }),
          this.db.comments.count({ postId: post.$id, isApproved: true }),
          Promise.resolve(post.viewCount || 0)
        ]);

        // Simple engagement score calculation
        const engagementScore = (likes * 3) + (comments * 5) + (views * 0.1);
        
        return {
          ...post,
          engagementScore,
          stats: { likes, comments, views }
        };
      })
    );

    // Sort by engagement score and return top posts
    return postsWithEngagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
  }

  // Get related posts based on tags and category
  static async getRelatedPosts(postId: string, limit: number = 5) {
    const post = await this.db.posts.get(postId);
    
    if (!post) {
      return [];
    }

    const postTags = post.tags ? JSON.parse(post.tags) : [];
    
    // Get posts with similar tags (simplified approach)
    const allPosts = await this.db.posts.find([
      Query.equal('status', 'published'),
      Query.notEqual('$id', postId),
      Query.orderDesc('publishedAt')
    ]);

    // Score posts based on tag similarity
    const scoredPosts = allPosts.map((otherPost: any) => {
      const otherTags = otherPost.tags ? JSON.parse(otherPost.tags) : [];
      const commonTags = postTags.filter((tag: string) => otherTags.includes(tag));
      const similarityScore = commonTags.length;

      return {
        ...otherPost,
        similarityScore
      };
    });

    // Sort by similarity and return top posts
    return scoredPosts
      .filter(p => p.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // Search posts with advanced filters
  static async searchPosts(searchParams: {
    query?: string;
    authorId?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    minViews?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
  }) {
    const { query, authorId, tags, dateFrom, dateTo, minViews, sortBy = 'relevance' } = searchParams;
    
    const queries = [Query.equal('status', 'published')];

    // Text search
    if (query) {
      queries.push(Query.search('title', query));
    }

    // Author filter
    if (authorId) {
      queries.push(Query.equal('authorId', authorId));
    }

    // Date range
    if (dateFrom) {
      queries.push(Query.greaterThanEqual('publishedAt', dateFrom.toISOString()));
    }
    if (dateTo) {
      queries.push(Query.lessThanEqual('publishedAt', dateTo.toISOString()));
    }

    // View count filter
    if (minViews) {
      queries.push(Query.greaterThanEqual('viewCount', minViews));
    }

    // Sorting
    switch (sortBy) {
      case 'date':
        queries.push(Query.orderDesc('publishedAt'));
        break;
      case 'popularity':
        queries.push(Query.orderDesc('viewCount'));
        break;
      case 'relevance':
      default:
        // For relevance, we might want to implement a more sophisticated scoring
        queries.push(Query.orderDesc('publishedAt'));
        break;
    }

    let posts = await this.db.posts.find(queries);

    // Filter by tags (post-query filtering since Appwrite doesn't support complex JSON queries)
    if (tags && tags.length > 0) {
      posts = posts.filter((post: any) => {
        const postTags = post.tags ? JSON.parse(post.tags) : [];
        return tags.some(tag => postTags.includes(tag));
      });
    }

    return posts;
  }

  // Helper methods
  private static async updateAndGetViewCount(postId: string): Promise<number> {
    const post = await this.db.posts.get(postId);
    if (post) {
      const newViewCount = (post.viewCount || 0) + 1;
      await this.db.posts.update(postId, { viewCount: newViewCount });
      return newViewCount;
    }
    return 0;
  }

  private static async getTotalViewsForAuthor(authorId: string): Promise<number> {
    const posts = await this.db.posts.query({ authorId }, { select: ['viewCount'] });
    return posts.reduce((total: number, post: any) => total + (post.viewCount || 0), 0);
  }

  private static async getTotalLikesForAuthor(authorId: string): Promise<number> {
    const posts = await this.db.posts.query({ authorId }, { select: ['$id'] });
    const postIds = posts.map((post: any) => post.$id);
    
    let totalLikes = 0;
    for (const postId of postIds) {
      const likeCount = await this.db.likes.count({ postId });
      totalLikes += likeCount;
    }
    
    return totalLikes;
  }

  private static async getTotalCommentsForAuthor(authorId: string): Promise<number> {
    const posts = await this.db.posts.query({ authorId }, { select: ['$id'] });
    const postIds = posts.map((post: any) => post.$id);
    
    let totalComments = 0;
    for (const postId of postIds) {
      const commentCount = await this.db.comments.count({ postId, isApproved: true });
      totalComments += commentCount;
    }
    
    return totalComments;
  }

  private static async getRecentPostsByAuthor(authorId: string, limit: number) {
    return await this.db.posts.query(
      { authorId, status: 'published' },
      { orderBy: ['-publishedAt'], limit }
    );
  }

  private static async getPopularPostsByAuthor(authorId: string, limit: number) {
    return await this.db.posts.query(
      { authorId, status: 'published' },
      { orderBy: ['-viewCount'], limit }
    );
  }
}
```

## Performance Optimization Patterns

### Efficient Batch Operations

```typescript
class BatchOperationService {
  private static db: any;

  // Batch create with error handling
  static async batchCreateUsers(userData: any[]): Promise<{
    successful: any[];
    failed: { data: any; error: string }[];
  }> {
    const successful = [];
    const failed = [];

    // Process in chunks to avoid overwhelming the database
    const chunkSize = 10;
    for (let i = 0; i < userData.length; i += chunkSize) {
      const chunk = userData.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (data) => {
        try {
          const user = await this.db.users.create(data);
          return { success: true, user };
        } catch (error) {
          return { success: false, data, error: error.message };
        }
      });

      const results = await Promise.all(chunkPromises);
      
      results.forEach(result => {
        if (result.success) {
          successful.push(result.user);
        } else {
          failed.push({ data: result.data, error: result.error });
        }
      });
    }

    return { successful, failed };
  }

  // Batch update with optimistic concurrency
  static async batchUpdateProducts(updates: { id: string; data: any }[]) {
    const results = [];

    for (const update of updates) {
      try {
        const updatedProduct = await this.db.products.update(update.id, {
          ...update.data,
          updatedAt: new Date()
        });
        results.push({ id: update.id, success: true, product: updatedProduct });
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Efficient data migration
  static async migrateUserData(transformFn: (user: any) => any) {
    const batchSize = 50;
    let offset = 0;
    let processedCount = 0;

    while (true) {
      const users = await this.db.users.all({
        limit: batchSize,
        offset,
        orderBy: ['$id']
      });

      if (users.length === 0) {
        break;
      }

      const updatePromises = users.map(async (user: any) => {
        try {
          const transformedData = transformFn(user);
          await this.db.users.update(user.$id, transformedData);
          return { success: true, id: user.$id };
        } catch (error) {
          return { success: false, id: user.$id, error: error.message };
        }
      });

      const results = await Promise.all(updatePromises);
      processedCount += results.filter(r => r.success).length;

      console.log(`Processed ${processedCount} users...`);
      
      offset += batchSize;
    }

    return processedCount;
  }
}
```

## Real-Time Data Patterns

### Live Dashboard Queries

```typescript
class DashboardService {
  private static db: any;

  // Get real-time dashboard metrics
  static async getDashboardMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      // User metrics
      totalUsers,
      activeUsersToday,
      newUsersThisWeek,
      
      // Content metrics
      totalPosts,
      postsPublishedToday,
      pendingPosts,
      
      // Engagement metrics
      totalViews,
      viewsToday,
      totalComments,
      commentsToday,
      
      // System metrics
      systemHealth
    ] = await Promise.all([
      // User metrics
      this.db.users.count(),
      this.db.users.count({
        lastActiveAt: Query.greaterThanEqual('lastActiveAt', today.toISOString())
      }),
      this.db.users.count({
        createdAt: Query.greaterThanEqual('createdAt', thisWeek.toISOString())
      }),
      
      // Content metrics
      this.db.posts.count(),
      this.db.posts.count({
        publishedAt: Query.greaterThanEqual('publishedAt', today.toISOString()),
        status: 'published'
      }),
      this.db.posts.count({ status: 'draft' }),
      
      // Engagement metrics
      this.getTotalViews(),
      this.getViewsToday(),
      this.db.comments.count(),
      this.db.comments.count({
        createdAt: Query.greaterThanEqual('createdAt', today.toISOString())
      }),
      
      // System health
      this.getSystemHealth()
    ]);

    return {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        newThisWeek: newUsersThisWeek
      },
      content: {
        totalPosts,
        publishedToday: postsPublishedToday,
        pendingPosts
      },
      engagement: {
        totalViews,
        viewsToday,
        totalComments,
        commentsToday
      },
      system: systemHealth,
      lastUpdated: new Date()
    };
  }

  // Get trending content for dashboard
  static async getTrendingContent(limit: number = 10) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [trendingPosts, activeUsers, popularTags] = await Promise.all([
      this.getTrendingPosts(last24Hours, limit),
      this.getMostActiveUsers(last24Hours, limit),
      this.getPopularTags(last24Hours, limit)
    ]);

    return {
      trendingPosts,
      activeUsers,
      popularTags
    };
  }

  private static async getTotalViews(): Promise<number> {
    const posts = await this.db.posts.all({ select: ['viewCount'] });
    return posts.reduce((total: number, post: any) => total + (post.viewCount || 0), 0);
  }

  private static async getViewsToday(): Promise<number> {
    // This would require a views log table in a real implementation
    // For now, we'll return a placeholder
    return 0;
  }

  private static async getSystemHealth() {
    // Check various system metrics
    const [dbResponseTime, errorRate] = await Promise.all([
      this.measureDatabaseResponseTime(),
      this.calculateErrorRate()
    ]);

    return {
      status: dbResponseTime < 1000 && errorRate < 0.01 ? 'healthy' : 'warning',
      dbResponseTime,
      errorRate,
      uptime: process.uptime()
    };
  }

  private static async measureDatabaseResponseTime(): Promise<number> {
    const start = Date.now();
    await this.db.users.count();
    return Date.now() - start;
  }

  private static async calculateErrorRate(): Promise<number> {
    // This would require error logging in a real implementation
    return 0.001; // Placeholder
  }

  private static async getTrendingPosts(since: Date, limit: number) {
    return await this.db.posts.find([
      Query.greaterThan('publishedAt', since.toISOString()),
      Query.equal('status', 'published'),
      Query.orderDesc('viewCount'),
      Query.limit(limit)
    ]);
  }

  private static async getMostActiveUsers(since: Date, limit: number) {
    // This would require activity tracking in a real implementation
    return await this.db.users.find([
      Query.greaterThan('lastActiveAt', since.toISOString()),
      Query.orderDesc('lastActiveAt'),
      Query.limit(limit)
    ]);
  }

  private static async getPopularTags(since: Date, limit: number) {
    // This would require tag analytics in a real implementation
    const recentPosts = await this.db.posts.find([
      Query.greaterThan('publishedAt', since.toISOString()),
      Query.equal('status', 'published')
    ]);

    const tagCounts: { [key: string]: number } = {};
    
    recentPosts.forEach((post: any) => {
      if (post.tags) {
        const tags = JSON.parse(post.tags);
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
}
```

These advanced query examples demonstrate:

1. **Complex Filtering**: Multi-criteria searches with various filters and sorting options
2. **Time-Based Analytics**: Date range queries and trend analysis
3. **Relationship Queries**: Joining data across multiple collections
4. **Performance Optimization**: Batch operations and efficient data processing
5. **Real-Time Patterns**: Dashboard metrics and live data aggregation

Each pattern can be adapted and extended based on your specific use case and performance requirements.