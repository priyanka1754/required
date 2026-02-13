import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from './blog.service';
import { CommonModule } from '@angular/common';
import { AppService } from '../app.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blogs.component.html',
})
export class BlogsComponent implements OnInit {
  blogs: any[] = [];
  isLoggedIn: boolean = false;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.fetchBlogs();
  }

  fetchBlogs() {
    this.blogService.getBlogs().subscribe(
      (blogs) => {
        this.blogs = blogs;
      },
      (error) => {
        console.error('Error fetching blogs:', error);
      }
    );
  }

  navigateToWriteBlog() {
    this.router.navigate(['/write-blog']);
  }

  viewBlogDetails(blogId: string) {
    this.router.navigate(['/blog-details', blogId]);
  }

  editBlog(blog: any) {
    this.router.navigate(['/write-blog'], { queryParams: { id: blog.blogId } });
  }

  deleteBlog(blog: any) {
    if (confirm(`Are you sure you want to delete the blog: "${blog.title}"?`)) {
      this.blogService.deleteBlog(blog.blogId).subscribe(
        () => {
          this.blogs = this.blogs.filter((b) => b._id !== blog._id);
        },
        (error) => {
          console.error('Error deleting blog:', error);
        }
      );
    }
  }
}
