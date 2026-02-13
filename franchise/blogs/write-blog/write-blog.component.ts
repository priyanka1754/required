import { Component } from '@angular/core';
import { BlogService } from '../blog.service';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { AppUploadComponent } from '../../products/app-upload/app-upload.component';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-write-blog',
  templateUrl: './write-blog.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, QuillModule, AppUploadComponent],
})
export class WriteBlogComponent {
  blog: any = { title: '', intro: '', content: '' };
  selectedFile!: File;

  public blogId = '';
  public isEditMode = false;

  // Intro expand/collapse
  public showIntro = true;

  // Quill editor configuration
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['clean'],
      ['blockquote', 'link', 'image'],
    ],
    formats: [
      'bold',
      'italic',
      'underline',
      'strike',
      'header',
      'list',
      'bullet',
      'indent',
      'blockquote',
      'link',
      'image',
    ],
    keyboard: {
      bindings: {
        enter: {
          key: 13,
          handler: function (range: any, context: any) {
            (this as any).insertText(range.index, '\n', 'user');
            (this as any).setSelection(range.index + 1, 0, 'user');
            return false;
          },
        },
      },
    },
    // NOTE: custom image handler is attached dynamically when editor is created
  };

  // Cloudflare / CloudFront CDN domain to serve uploaded images through
  // Set to the domain you provided so uploaded images are accessible via CDN.
  private cloudflareDomain = 'https://d27yy38qedtu85.cloudfront.net';

  private getCloudflareUrl(originalUrl: string): string {
    if (!this.cloudflareDomain) return originalUrl;
    try {
      const u = new URL(originalUrl);
      const path = u.pathname + u.search + u.hash;
      return this.cloudflareDomain.replace(/\/$/, '') + path;
    } catch (err) {
      return originalUrl;
    }
  }

  constructor(
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.blogId = params['id'];
        this.loadBlogForEdit(this.blogId);
      }
    });
  }

  // will hold the Quill instance when editor is created
  quillInstance: any;

  // --- Resizable image state ---
  private pendingFileForUpload: File | null = null;
  // When resizing, this holds the wrapper element we're manipulating
  private resizeTargetElement: HTMLElement | null = null;
  // active resize state
  private resizing = false;
  private resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private startX = 0;
  private startY = 0;
  private startW = 0;
  private startH = 0;
  private aspect = 1;
  private handleSize = 10;

  onEditorCreated(quill: any) {
    this.quillInstance = quill;
    try {
      const toolbar = quill.getModule('toolbar');
      if (toolbar) {
        toolbar.addHandler('image', this.imageHandler.bind(this));
      }
      // allow clicking an existing image to make it resizable
      const root = quill.root as HTMLElement;
      root.addEventListener('click', this.onEditorImageClick.bind(this));
      // keep numbering up-to-date when content changes
      quill.on('text-change', () => this.renumberImages());
    } catch (err) {
      console.error('Error attaching image handler to Quill toolbar', err);
    }
  }

  // Generate a stable-ish blog id on the frontend so images can be uploaded
  // under the same folder before the blog is saved. Backend should accept
  // a provided `blogId` in the create request to keep it consistent.
  private generateBlogId(): string {
    const ts = Date.now().toString(36);
    const rnd = Math.floor(Math.random() * 9000 + 1000).toString(36);
    return `b-${ts}-${rnd}`;
  }
  private onEditorImageClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!target) return;
    const img =
      target.tagName === 'IMG'
        ? (target as HTMLImageElement)
        : target.querySelector && target.querySelector('img');
    if (!img) return;
    // make clicked image resizable
    this.makeImageResizable(img as HTMLImageElement);
  }

  // image handler: insert preview, upload to S3 via presigned URL, then replace preview with public URL
  private imageHandler() {
    const input: HTMLInputElement = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;

      // Read file into a data URL and insert it into the editor; then make it resizable
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const dataUrl = ev.target.result as string;
        this.pendingFileForUpload = file;
        const range = this.quillInstance.getSelection(true);
        const index = (range && range.index) || this.quillInstance.getLength();
        const wrapperHtml = `\n            <div class="ql-blog-image">\n              <img src="${dataUrl}" alt="Uploading..." style="max-width:100%;height:auto;display:block;" />\n              <div class="ql-image-caption">...</div>\n            </div>\n            <p><br></p>\n          `;
        this.quillInstance.clipboard.dangerouslyPasteHTML(
          index,
          wrapperHtml,
          'user'
        );
        this.quillInstance.setSelection(index + 2, 0, 'user');
        this.renumberImages();
        // find the newly inserted image and make it resizable
        setTimeout(() => {
          try {
            const container: HTMLElement = this.quillInstance
              .root as HTMLElement;
            const imgs = Array.from(
              container.querySelectorAll('img')
            ) as HTMLImageElement[];
            for (let i = imgs.length - 1; i >= 0; i--) {
              const imgEl = imgs[i];
              if (imgEl.src === dataUrl) {
                this.makeImageResizable(imgEl);
                break;
              }
            }
          } catch (err) {
            console.warn('Could not attach resizable to inserted image', err);
          }
        }, 50);
        // start uploading in background
        const fileCopy = file; // closure
        // create a separate File object (we want original file uploaded)
        this.uploadFileAndReplace(dataUrl, fileCopy, null);
      };
      reader.readAsDataURL(file);
    };
  }

  // Make an image element resizable by placing an overlay with handles on top (non-destructive)
  private makeImageResizable(img: HTMLImageElement) {
    if (!img) return;
    // avoid attaching multiple overlays per image
    if ((img as any).__resizerAttached) return;
    (img as any).__resizerAttached = true;

    const editorRoot =
      this.quillInstance && this.quillInstance.root
        ? (this.quillInstance.root as HTMLElement)
        : document.body;

    // create overlay element positioned over the image
    const overlay = document.createElement('div');
    overlay.className = 'image-resize-overlay';
    overlay.style.position = 'absolute';
    overlay.style.boxSizing = 'border-box';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';

    const updateOverlayPosition = () => {
      const imgRect = img.getBoundingClientRect();
      overlay.style.left = imgRect.left + 'px';
      overlay.style.top = imgRect.top + 'px';
      overlay.style.width = imgRect.width + 'px';
      overlay.style.height = imgRect.height + 'px';
    };

    updateOverlayPosition();
    document.body.appendChild(overlay);

    const createHandle = (pos: 'nw' | 'ne' | 'sw' | 'se') => {
      const h = document.createElement('div');
      h.className = 'resize-handle ' + pos;
      const s = this.handleSize;
      h.style.width = s + 'px';
      h.style.height = s + 'px';
      h.style.position = 'absolute';
      h.style.background = '#fff';
      h.style.border = '1px solid #333';
      h.style.boxSizing = 'border-box';
      h.style.pointerEvents = 'auto';
      h.style.cursor =
        pos === 'nw' || pos === 'se' ? 'nwse-resize' : 'nesw-resize';
      if (pos === 'nw') {
        h.style.left = '-' + s / 2 + 'px';
        h.style.top = '-' + s / 2 + 'px';
      }
      if (pos === 'ne') {
        h.style.right = '-' + s / 2 + 'px';
        h.style.top = '-' + s / 2 + 'px';
      }
      if (pos === 'sw') {
        h.style.left = '-' + s / 2 + 'px';
        h.style.bottom = '-' + s / 2 + 'px';
      }
      if (pos === 'se') {
        h.style.right = '-' + s / 2 + 'px';
        h.style.bottom = '-' + s / 2 + 'px';
      }
      overlay.appendChild(h);
      h.addEventListener('mousedown', (ev: MouseEvent) => {
        ev.preventDefault();
        this.resizing = true;
        this.resizeHandle = pos;
        this.resizeTargetElement = overlay;
        this.startX = ev.clientX;
        this.startY = ev.clientY;
        const br = overlay.getBoundingClientRect();
        this.startW = br.width;
        this.startH = br.height;
        this.aspect = this.startW / this.startH || 1;
      });
    };

    createHandle('nw');
    createHandle('ne');
    createHandle('sw');
    createHandle('se');

    // on move adjust overlay and image width
    const onMove = (ev: MouseEvent) => {
      if (!this.resizing || !this.resizeTargetElement || !this.resizeHandle)
        return;
      ev.preventDefault();
      const dx = ev.clientX - this.startX;
      let newW = this.startW;
      if (this.resizeHandle === 'se' || this.resizeHandle === 'ne') {
        newW = Math.max(20, this.startW + dx);
      } else {
        newW = Math.max(20, this.startW - dx);
      }
      // apply to overlay and image
      this.resizeTargetElement.style.width = newW + 'px';
      img.style.width = newW + 'px';
    };

    const onUp = async (ev: MouseEvent) => {
      if (!this.resizing || !this.resizeTargetElement) return;
      this.resizing = false;
      this.resizeHandle = null;
      const overlayEl = this.resizeTargetElement;
      this.resizeTargetElement = null;
      // finalize: create resized blob from image
      try {
        const newW = overlayEl.getBoundingClientRect().width;
        const source = new Image();
        source.crossOrigin = 'anonymous';
        source.onload = () => {
          const newH = Math.round(newW / this.aspect);
          const tmp = document.createElement('canvas');
          tmp.width = Math.round(newW);
          tmp.height = newH;
          const tctx = tmp.getContext('2d')!;
          tctx.drawImage(source, 0, 0, tmp.width, tmp.height);
          tmp.toBlob((blob) => {
            if (!blob) return;
            const filename = `resized-${Date.now()}.png`;
            const file = new File([blob], filename, {
              type: blob.type || 'image/png',
            });
            const dataUrl = tmp.toDataURL('image/png');
            img.src = dataUrl;
            this.uploadFileAndReplace(dataUrl, file, img);
            // cleanup overlay after upload started
            setTimeout(() => {
              try {
                document.body.removeChild(overlayEl);
              } catch (e) {}
              (img as any).__resizerAttached = false;
            }, 200);
          }, 'image/png');
        };
        source.onerror = (e) => {
          console.warn('Could not load source image for resizing', e);
        };
        source.src = img.src;
      } catch (err) {
        console.warn('Resizing finalize failed', err);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: false });

    // reposition overlay when window scroll/resizes
    const reposition = () => updateOverlayPosition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  }

  toggleIntro() {
    this.showIntro = !this.showIntro;
  }

  // Return a plain-text truncated preview of the intro (strips HTML)
  getIntroPreview(max = 300): string {
    const raw = this.blog && this.blog.intro ? this.blog.intro : '';
    // strip html tags
    const stripped = raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped.length <= max) return stripped;
    return stripped.slice(0, max).trim() + '...';
  }

  // Upload File and replace preview
  private uploadFileAndReplace(
    previewDataUrl: string,
    file: File,
    targetImg: HTMLImageElement | null
  ) {
    // ensure we have a blogId to put images under
    if (!this.blogId) {
      this.blogId = this.generateBlogId();
    }
    // compute extension
    const ext = (file.type && file.type.split('/')[1]) || 'jpg';
    // determine index for the image (1-based). If we can find the target image
    // element in the editor, use its position; otherwise, find the previewDataUrl
    // occurrence and use its position. This ensures filenames are 1.jpg, 2.jpg...
    let indexForFilename = 0;
    try {
      const container: HTMLElement = this.quillInstance
        ? (this.quillInstance.root as HTMLElement)
        : document.body;
      const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
      if (targetImg) {
        indexForFilename = imgs.findIndex((i) => i === targetImg) + 1;
      } else {
        // find the last image whose src matches previewDataUrl
        for (let i = imgs.length - 1; i >= 0; i--) {
          if (imgs[i].src === previewDataUrl) {
            indexForFilename = i + 1;
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Could not determine image index, falling back to timestamp', err);
    }
    if (!indexForFilename) indexForFilename = Date.now();
    const filename = `${indexForFilename}.${ext}`;
    const filetype = file.type;
    const folder = 'blogs';
    const productId = this.blogId || Date.now().toString();
    const url = `/api/images/generatePresignedUrl?filename=${encodeURIComponent(
      filename
    )}&filetype=${encodeURIComponent(filetype)}&folder=${encodeURIComponent(
      folder
    )}&productId=${encodeURIComponent(productId)}`;

    this.http.get<any>(url).subscribe(
      (response) => {
        const uploadUrl: string =
          response.url || response.uploadUrl || response.presignedUrl;
        let publicUrl: string | undefined =
          response.cloudflareUrl ||
          response.cfUrl ||
          response.cdnUrl ||
          response.fileUrl ||
          response.publicUrl ||
          response.urlPublic;
        if (!uploadUrl) {
          console.error('No presigned upload URL returned from server');
          this.replaceLastInsertedCaption('Upload failed');
          return;
        }

        // Upload via PUT
        this.http
          .put(uploadUrl, file, {
            headers: {
              'Content-Type': filetype,
            },
            responseType: 'text' as 'json',
          })
          .subscribe(
            () => {
              if (!publicUrl) {
                publicUrl = uploadUrl.split('?')[0];
              }
              if (publicUrl) publicUrl = this.getCloudflareUrl(publicUrl);
              // Try to verify public URL is accessible (GET blob)
              this.http.get(publicUrl!, { responseType: 'blob' }).subscribe(
                () => {
                  if (targetImg) {
                    // directly replace the target element's src
                    targetImg.src = publicUrl!;
                    const caption =
                      targetImg.parentElement?.querySelector(
                        '.ql-image-caption'
                      );
                    if (caption) caption.textContent = 'Figure';
                  } else {
                    this.replaceLastInsertedImageSrc(
                      previewDataUrl,
                      publicUrl!
                    );
                  }
                  this.renumberImages();
                },
                () => {
                  console.warn(
                    'Uploaded but public URL not accessible, keeping preview image'
                  );
                  this.replaceLastInsertedCaption('Uploaded');
                }
              );
            },
            (err) => {
              console.error('Image upload failed:', err);
              this.replaceLastInsertedCaption('Upload failed');
            }
          );
      },
      (err) => {
        console.error('Could not get presigned URL', err);
        this.replaceLastInsertedCaption('Upload failed');
      }
    );
  }

  // Renumber images in the editor so captions show Figure 1, Figure 2, ...
  private renumberImages() {
    if (!this.quillInstance) return;
    const container: HTMLElement = this.quillInstance.root as HTMLElement;
    const wrappers = container.querySelectorAll('.ql-blog-image');
    wrappers.forEach((wrap, idx) => {
      const caption = wrap.querySelector('.ql-image-caption');
      if (caption) {
        caption.textContent = `Figure ${idx + 1}`;
      }
    });
  }

  // Replace last inserted image whose src matches previewDataUrl with final public URL
  private replaceLastInsertedImageSrc(
    previewDataUrl: string,
    publicUrl: string
  ) {
    if (!this.quillInstance) return;
    const container: HTMLElement = this.quillInstance.root as HTMLElement;
    // Find image with matching previewDataUrl starting from the end
    const imgs = Array.from(
      container.querySelectorAll('img')
    ) as HTMLImageElement[];
    for (let i = imgs.length - 1; i >= 0; i--) {
      const img = imgs[i];
      if (img.src === previewDataUrl) {
        img.src = publicUrl;
        const caption = img.parentElement?.querySelector('.ql-image-caption');
        if (caption) caption.textContent = 'Figure';
        return;
      }
    }
  }

  private replaceLastInsertedCaption(text: string) {
    if (!this.quillInstance) return;
    const container: HTMLElement = this.quillInstance.root as HTMLElement;
    const caps = Array.from(
      container.querySelectorAll('.ql-image-caption')
    ) as HTMLElement[];
    if (caps.length === 0) return;
    const last = caps[caps.length - 1];
    last.textContent = text;
  }

  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  public loadBlogForEdit(id: string) {
    this.blogService.getBlogById(id).subscribe((res) => {
      const blog = res.blog || res;
      this.blog = blog;
      // Decode HTML entities for proper display in editor
      if (this.blog.content) {
        this.blog.content = this.decodeHtml(this.blog.content);
      }
      if (this.blog.intro) {
        this.blog.intro = this.decodeHtml(this.blog.intro);
      }
    });
  }

  onFileUploaded(event: any) {
    // Handle file upload event if needed
  }

  async submitBlog() {
    // Before submitting, ensure any data-URL images are uploaded to S3 and replaced
    if (this.blog && this.blog.content) {
      this.blog.content = await this.replaceDataUrlImagesWithS3Urls(
        this.blog.content
      );
    }

    const blogRequest = {
      title: this.blog.title,
      intro: this.blog.intro,
      content: this.blog.content,
      authorName: 'SkipCry Team',
      customerId: 'SCM999',
      blogId: this.blogId,
    };

    if (this.isEditMode && this.blogId) {
      this.blogService.editBlog(this.blogId, blogRequest).subscribe(
        () => {
          alert('Blog updated successfully!');
          this.router.navigate(['/blogs']);
        },
        (error) => {
          console.error('Error updating blog:', error);
        }
      );
    } else {
      this.blogService.createBlog(blogRequest).subscribe(
        (res) => {
          this.blogId = res._id;
          alert('Blog created successfully!');
          this.router.navigate(['/blogs']);
        },
        (error) => {
          console.error('Error creating blog:', error);
        }
      );
    }
  }

  // Find any <img src="data:*"> in HTML and upload them to S3, replacing with public URLs
  private async replaceDataUrlImagesWithS3Urls(html: string): Promise<string> {
    // Parse HTML and find <img> tags in document order so we assign filenames
    // incrementally (1,2,3...). This keeps S3 keys ordered per blog id.
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
      // iterate in order and upload any data: images
      for (let idx = 0; idx < imgs.length; idx++) {
        const img = imgs[idx];
        const src = img.getAttribute('src') || '';
        if (src.startsWith('data:')) {
          try {
            // ensure blogId exists
            if (!this.blogId) this.blogId = this.generateBlogId();
            const ext = (src.match(/^data:(image\/([^;]+))/i) && RegExp.$2) || 'png';
            const filename = `${idx + 1}.${ext}`;
            const publicUrl = await this.uploadDataUrlImage(src, filename);
            if (publicUrl) {
              // replace this specific src only
              img.setAttribute('src', publicUrl);
            }
          } catch (err) {
            console.error('Failed to upload embedded image', err);
          }
        }
      }
      // serialize back to string
      html = doc.body.innerHTML;
    } catch (err) {
      console.warn('HTML parsing failed, falling back to previous upload flow', err);
      // fallback to old behavior
      const dataUrlRegex = /<img[^>]*src=["'](data:[^"']+)["'][^>]*>/gi;
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = dataUrlRegex.exec(html)) !== null) {
        matches.push(m[1]);
      }
      const unique = Array.from(new Set(matches));
      for (const dataUrl of unique) {
        try {
          const publicUrl = await this.uploadDataUrlImage(dataUrl);
          if (publicUrl) {
            const escaped = dataUrl.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const replaceRegex = new RegExp(escaped, 'g');
            html = html.replace(replaceRegex, publicUrl);
          }
        } catch (err) {
          console.error('Failed to upload embedded image', err);
        }
      }
    }
    return html;
  }

  // Upload a data: URL image to S3 using an explicit filename (so we can store
  // images as 1.jpg,2.jpg,...). If `filename` is provided, it will be used
  // verbatim when requesting a presigned URL.
  private async uploadDataUrlImage(dataUrl: string, filename?: string): Promise<string | null> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileExt = (blob.type && blob.type.split('/')[1]) || 'png';
    const filetype = blob.type || `image/${fileExt}`;
    const folder = 'blogs';
    if (!this.blogId) this.blogId = this.generateBlogId();
    const productId = this.blogId;

    const useFilename = filename || `embedded-${Date.now()}.${fileExt}`;

    const url = `/api/images/generatePresignedUrl?filename=${encodeURIComponent(
      useFilename
    )}&filetype=${encodeURIComponent(filetype)}&folder=${encodeURIComponent(
      folder
    )}&productId=${encodeURIComponent(productId)}`;
    try {
      const response = await firstValueFrom(this.http.get<any>(url));
      const uploadUrl: string = response.url || response.uploadUrl || response.presignedUrl;
      let publicUrl: string | undefined =
        response.cloudflareUrl || response.cfUrl || response.cdnUrl || response.fileUrl || response.publicUrl || response.urlPublic;
      if (!uploadUrl) {
        console.error('No presigned upload URL returned from server');
        return null;
      }

      await firstValueFrom(
        this.http.put(uploadUrl, blob, {
          headers: { 'Content-Type': filetype },
          responseType: 'text' as 'json',
        })
      );

      if (!publicUrl) publicUrl = uploadUrl.split('?')[0];
      if (publicUrl) publicUrl = this.getCloudflareUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Error uploading embedded image', err);
      return null;
    }
  }
}
