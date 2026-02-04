import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../blog.service';
import { CommonModule } from '@angular/common';
import { AppService } from '../../app.service';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-details',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './blog-details.component.html',
})
export class BlogDetailsComponent implements OnInit {
  blog: any;
  otherBlogs: any[] = [];
  private readonly cdnBase = 'https://d27yy38qedtu85.cloudfront.net';

  // Quill editor configuration

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],

      [{ header: 1 }, { header: 2 }],

      [{ list: 'ordered' }, { list: 'bullet' }],

      [{ indent: '-1' }, { indent: '+1' }],

      ['clean'],

      ['link'],
    ],
  };

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private appService: AppService, // Inject AppService
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const blogId = this.route.snapshot.paramMap.get('id');

    if (!blogId) {
      console.error('No blog ID found in route');
      return;
    }

    this.blogService.getBlogById(blogId).subscribe(
      (response) => {
        if (!response || !response.blog) {
          console.error('No blog data found for ID:', blogId);
          return;
        }

        // ✅ Assign `response.blog` first
        this.blog = response.blog;

        // ✅ Decode HTML entities and sanitize the content
        if (this.blog.content) {
          let decodedContent = this.decodeHtml(this.blog.content);
          // Replace all &nbsp; with regular spaces for proper text wrapping
          decodedContent = decodedContent
            .replace(/&nbsp;/gi, ' ')
            .replace(/\u00A0/g, ' ')  // Unicode non-breaking space
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/\s+/g, ' ')  // Normalize multiple spaces
            .replace(/<ul>\s*<li>\s*<ul>/gi, '<ul>')  // Remove nested ul structure
            .replace(/<\/ul>\s*<\/li>\s*<\/ul>/gi, '</ul>');  // Remove closing nested ul
          // Rewrite image sources to use CDN base for consistent delivery
          decodedContent = this.rewriteImageSrcsToCdn(decodedContent);
          this.blog.safeContent =
            this.sanitizer.bypassSecurityTrustHtml(decodedContent);
        }
        if (this.blog.intro) {
          let decodedIntro = this.decodeHtml(this.blog.intro);
          // Replace all &nbsp; with regular spaces for proper text wrapping
          decodedIntro = decodedIntro
            .replace(/&nbsp;/gi, ' ')
            .replace(/\u00A0/g, ' ')  // Unicode non-breaking space
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/\s+/g, ' ')  // Normalize multiple spaces
            .replace(/<ul>\s*<li>\s*<ul>/gi, '<ul>')  // Remove nested ul structure
            .replace(/<\/ul>\s*<\/li>\s*<\/ul>/gi, '</ul>');  // Remove closing nested ul
          decodedIntro = this.rewriteImageSrcsToCdn(decodedIntro);
          this.blog.safeIntro =
            this.sanitizer.bypassSecurityTrustHtml(decodedIntro);
        }

        // Fetch other blogs by the same author
        this.fetchOtherBlogs(this.blog.customerId, this.blog._id);
      },
      (error) => {
        console.error('Error fetching blog:', error);
      }
    );
  }

  // Rewrite image src attributes to use the configured CDN base.
  // This replaces the origin part of absolute URLs with the CDN base while keeping the path.
  private rewriteImageSrcsToCdn(html: string): string {
    if (!html) return html;
    const cdnBase = this.cdnBase.replace(/\/$/, '');
    return html.replace(/src=(['"])(https?:\/\/[^'"\s]+)(['"])/gi, (m: string, q1: string, url: string, q3: string) => {
      try {
        const parsed = new URL(url);
        // If already pointing to the CDN, leave as-is
        if (parsed.origin === new URL(cdnBase).origin) return `src=${q1}${url}${q3}`;
        // Replace origin with CDN base and keep pathname
        return `src=${q1}${cdnBase}${parsed.pathname}${q3}`;
      } catch (err) {
        // If URL parsing fails, return original
        return m;
      }
    });
  }

  fetchOtherBlogs(authorId: string, currentBlogId: string) {
    this.blogService.getBlogsByAuthor(authorId).subscribe(
      (blogs) => {
        // Exclude the currently viewed blog
        this.otherBlogs = blogs.filter(
          (blog: any) => blog._id !== currentBlogId
        );
      },
      (error) => {
        console.error('Error fetching other blogs:', error);
      }
    );
  }

  likeBlog() {
    this.blogService.likeBlog(this.blog._id).subscribe(() => {
      this.blog.likes += 1;
    });
  }

  dislikeBlog() {
    this.blogService.dislikeBlog(this.blog._id).subscribe(() => {
      this.blog.dislikes += 1;
    });
  }

  openBlog(blogId: string) {
    this.router.navigate(['/blog-details', blogId]).then(() => {
      window.location.reload(); // Refresh page to reload new blog details
    });
  }

  goBack() {
    this.router.navigate(['/blogs']);
  }

  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
}
