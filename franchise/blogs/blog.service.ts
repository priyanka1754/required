import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // ✅ This ensures Angular provides the service globally
})
export class BlogService {
  private apiUrl = '/api/blogs';

  constructor(private http: HttpClient) {}

  getBlogs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      map((blogs: any) => {
        return blogs.map((blog: any) => {
          blog.imageUrl = `https://d27yy38qedtu85.cloudfront.net/blogs/${blog.blogId}/1.jpg`;
          return blog;
        });
      })
    );
  }

  getBlogById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((blog: any) => {
        blog.blog.imageUrl = `https://d27yy38qedtu85.cloudfront.net/blogs/${blog.blog.blogId}/1.jpg`;
        return blog;
      })
    );
  }

  createBlog(blogData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, blogData);
  }

  deleteBlog(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  deleteBlogWithCustomerId(id: string, customerId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}?customerId=${customerId}`
    );
  }

  likeBlog(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/like`, {});
  }

  dislikeBlog(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/dislike`, {});
  }

  updateBlog(id: string, blogData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, blogData);
  }

  editBlog(id: string, blogData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, blogData);
  }

  getBlogsByAuthor(authorId: string) {
    return this.http.get<any[]>(`/api/blogs?customerId=${authorId}`);
  }
}
