import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  learningAnalyticsApi = 'http://localhost:5000/getLearningAnalytics/';
  platformAnalyticsApi = 'http://localhost:5000/getPlatformAnalytics';
  schoolAnalyticsApi = 'http://localhost:5000/getSchoolAnalytics';
  classesAnalyticsApi = 'http://localhost:5000/getClassesAnalytics';
  engagementAnalyticsApi = 'http://localhost:5000/getEngagementAnalytics';
  myActivityAnalyticsApi = 'http://localhost:5000/getMyActivityAnalytics';

  constructor(private http:HttpClient) {}

  getLearningAnalytics():Observable<any>{
    return this.http.get<any>(this.learningAnalyticsApi);
  }

  getPlatformAnalytics(){
    return this.http.get<any>(this.platformAnalyticsApi);
  }

  getSchoolAnalytics(){
    return this.http.get<any>(this.schoolAnalyticsApi);
  }

  getClassesAnalytics(){
    return this.http.get<any>(this.classesAnalyticsApi);
  }

  getEngagementAnalytics(){
    return this.http.get<any>(this.engagementAnalyticsApi);
  }

  getMyActivityAnalytics(){
    return this.http.get<any>(this.myActivityAnalyticsApi);
  }
}
