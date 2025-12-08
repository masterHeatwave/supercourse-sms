import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface VoteRequest {
  optionIds: string[];
}

export interface PollResults {
  question: string;
  allowMultiple: boolean;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
  }>;
  closed_at?: string;
  totalVotes: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostVotingService {
  #http = inject(HttpClient);
  
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000/api/v1';

  voteOnPoll(postId: string, voteData: VoteRequest): Observable<any> {
    return this.#http.post(`${this.apiUrl}/posts/${postId}/vote`, voteData);
  }

  getPollResults(postId: string): Observable<{ success: boolean; data: PollResults }> {
    return this.#http.get<{ success: boolean; data: PollResults }>(`${this.apiUrl}/posts/${postId}/results`);
  }

  forcePublishPost(postId: string): Observable<any> {
    return this.#http.patch(`${this.apiUrl}/posts/${postId}/force-publish`, {});
  }
}
