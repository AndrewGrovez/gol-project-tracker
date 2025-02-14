// Facebook Types (existing)
export interface FacebookInsightValue {
    value: number;
    end_time: string;
  }
  
  export interface FacebookInsight {
    name: string;
    period: string;
    values: FacebookInsightValue[];
    title: string;
    description: string;
  }
  
  export interface FacebookInsightsResponse {
    data: FacebookInsight[];
  }
  
  export interface PagePost {
    id: string;
    message?: string;
    created_time: string;
    likes: {
      summary: {
        total_count: number;
      };
    };
    comments: {
      summary: {
        total_count: number;
      };
    };
  }
  
  export interface FacebookPostsResponse {
    data: PagePost[];
  }
  
  // Instagram Types
  export interface InstagramMedia {
    like_count: number;
    comments_count: number;
    caption?: string;
    media_url: string;
    timestamp: string;
    permalink: string;
  }
  
  export interface InstagramMediaConnection {
    data: InstagramMedia[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
    };
  }
  
  export interface InstagramBusinessDiscovery {
    username: string;
    followers_count: number;
    media_count: number;
    media: InstagramMediaConnection;
  }
  
  export interface InstagramInsightsResponse {
    business_discovery: InstagramBusinessDiscovery;
  }
  
  // New type for Instagram account-level insights (e.g., reach)
  export interface InstagramInsightValue {
    value: number;
    end_time: string;
  }
  
  export interface InstagramInsight {
    name: string;
    period: string;
    values: InstagramInsightValue[];
  }
  
  export interface InstagramAccountInsightsResponse {
    data: InstagramInsight[];
  }  