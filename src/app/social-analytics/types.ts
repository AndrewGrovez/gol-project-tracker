// src/app/social-analytics/types.ts
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