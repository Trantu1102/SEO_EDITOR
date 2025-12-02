
import { ArticleData } from "../types";

// Helper function to normalize text for comparison
const normalize = (text: string): string => {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').trim();
};

// Helper to check string similarity
const isSimilar = (str1: string, str2: string): boolean => {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  if (!s1 || !s2) return false;
  
  if (s1 === s2) return true;
  if (s1.startsWith(s2) || s2.startsWith(s1) || s1.includes(s2) || s2.includes(s1)) {
    const lenDiff = Math.abs(s1.length - s2.length);
    if (lenDiff < 50) return true; 
  }
  
  return false;
};

// Helper to get text with proper spacing for block elements
const getSmartText = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    const txt = node.textContent || "";
    return txt;
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    
    // Ignore hidden or script tags
    if (['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input'].includes(tagName)) return "";
    
    // Handle line breaks specifically
    if (tagName === 'br') return "\n";

    let text = "";
    node.childNodes.forEach(child => {
      text += getSmartText(child);
    });

    // Block elements should add spacing
    if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'li', 'tr', 'blockquote', 'figcaption'].includes(tagName)) {
      if (text.trim().length > 0) {
        return "\n" + text + "\n";
      }
    }
    
    return text;
  }
  
  return "";
};

export const scrapeArticle = async (url: string): Promise<ArticleData> => {
  // --- 0. PREPARATION ---
  let validUrl = url;
  let hostname = "";
  try {
    const u = new URL(url);
    validUrl = u.href;
    hostname = u.hostname;
  } catch (e) {
    throw new Error("Invalid URL provided");
  }

  const encodedUrl = encodeURIComponent(validUrl);
  const timestamp = new Date().getTime();

  // Strategy: Robust Proxy Rotation
  // 1. AllOrigins (JSON mode): Most stable, wraps content in JSON to bypass CORS strictness.
  // 2. CorsProxy.io: Direct HTML, fast but sometimes rate-limited.
  // 3. CodeTabs: Reliable backup.
  const proxies = [
    {
      name: "AllOrigins",
      getUrl: () => `https://api.allorigins.win/get?url=${encodedUrl}&disableCache=true&_=${timestamp}`,
      isJson: true
    },
    {
      name: "CorsProxy.io",
      getUrl: () => `https://corsproxy.io/?${encodedUrl}`,
      isJson: false
    },
    {
      name: "CodeTabs",
      getUrl: () => `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}&_=${timestamp}`,
      isJson: false
    },
    {
      name: "ThingProxy",
      getUrl: () => `https://thingproxy.freeboard.io/fetch/${validUrl}`,
      isJson: false
    }
  ];

  let html = "";
  let lastError = "";

  for (const proxy of proxies) {
    try {
      console.log(`Attempting fetch via ${proxy.name}...`);
      const controller = new AbortController();
      // Short timeout for each proxy to failover quickly
      const timeoutId = setTimeout(() => controller.abort(), 20000); 

      const response = await fetch(proxy.getUrl(), { 
        signal: controller.signal,
        // Do NOT send custom headers as they trigger CORS Preflight failure on some proxies
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
          throw new Error(`Status ${response.status}`);
      }

      if (proxy.isJson) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }

      if (html && html.length > 500) {
          console.log(`Success via ${proxy.name}`);
          break; 
      }
    } catch (error: any) {
      console.warn(`Proxy ${proxy.name} failed:`, error.message);
      lastError = error.message;
    }
  }

  if (!html || html.length < 100) {
    throw new Error(`Failed to fetch content. Public proxies might be busy or the site blocks them. Please paste content manually. (Debug: ${lastError})`);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Domain flags
  const isTCCS = hostname.includes('tapchicongsan.org.vn');

  // --- 1. DOM CLEANING ---
  const clutterSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript',
    '.ads', '.ad-container', '.banner', 
    '.menu', '.sidebar', '.noprint', '.comment-box', '.comments',
    '.social-share', '.tags', '.breadcrumb', '.meta-bottom',
    '.tool-bar', '.box-date', '.author-info',
    '.related-news', '.box-related', '.tin-lien-quan', '.relate-container',
    '.news-relate', '.article-relate', '.more-news', '.box-tin-khac',
    '.zone-relate', '.inner-article-relate', '.item-relate',
    '#related-news', '#zone_related_news', 
    '.box-tinlienquan', '.box-tinkhac', '.box-lq',
    '.box_tinkhac', '.list-news-related'
  ];

  clutterSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(node => node.remove());
  });

  // --- 2. TITLE EXTRACTION ---
  let title = "";
  const titleSelectors = [
    '.journal-content-article h1',
    '.title-content', 
    '.cms-title', 
    '.story-title',
    '.article-title',
    'h1.title',
    'h1'
  ];
  
  const siteNameRegex = /^(Tạp chí Cộng sản|Trang chủ|Báo Nhân Dân|VnExpress|Tin tức)$/i;

  for (const sel of titleSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || "";
      if (text.length > 0 && !siteNameRegex.test(text)) {
        title = text;
        break;
      }
    }
  }
  if (!title) title = doc.title || "";
  
  title = title.replace(/\s*(-|\|)\s*(Tạp chí Cộng sản|Báo Nhân Dân|VnExpress|Dân Trí).*$/i, '');
  title = title.replace(/\s*\(\s*[A-ZÀ-ÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯẠ-Ỹ\s\-_]{2,}\s*\)$/, '');
  title = title.trim();

  // --- 3. CONTENT CONTAINER DETECTION ---
  let mainContainer: Element | null = null;
  const contentSelectors = [
    '.journal-content-article', // TCCS
    '.article__body',           // NhanDan
    '.zce-content-body',        // NhanDan
    '.cms-body',                // NhanDan/Others
    '.detail-content-body',     // NhanDan (Old)
    '.content-detail',          // DanTri
    '.fck_detail',              // VnExpress
    '#divContent',
    '.article-content',
    '.detail-content',
    '#content_detail',
    '.sidebar-1',
    'article'
  ];

  for (const sel of contentSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      mainContainer = el;
      console.log(`Found container via selector: ${sel}`);
      break;
    }
  }

  if (!mainContainer) {
    const divs = doc.querySelectorAll('div, td, section');
    let maxP = 0;
    divs.forEach(div => {
      const pCount = div.querySelectorAll('p').length;
      if (pCount > maxP) {
        maxP = pCount;
        mainContainer = div;
      }
    });
  }
  
  if (!mainContainer) mainContainer = doc.body;

  mainContainer.querySelectorAll('h1').forEach(h1 => h1.remove());

  // --- 4. SAPO EXTRACTION ---
  let excerpt = "";
  let excerptNode: Element | null = null;

  const tccsSapoRegex = /^(TCCS|Tạp chí Cộng sản)\s*[-–]\s*/i;
  
  const potentialSapoNodes = mainContainer.querySelectorAll('p, div, span, strong, h2');
  for (let i = 0; i < Math.min(potentialSapoNodes.length, 5); i++) {
    const node = potentialSapoNodes[i];
    const text = node.textContent?.trim() || "";
    if (tccsSapoRegex.test(text)) {
      excerpt = getSmartText(node).replace(/\s+/g, ' ').trim();
      excerptNode = node;
      break;
    }
  }

  if (!excerpt) {
    const sapoSelectors = ['.sapo', '.cms-desc', '.avatar-desc', '.description', '.lead', 'h2.sapo', '.sapo-detail'];
    for (const sel of sapoSelectors) {
      const el = doc.querySelector(sel);
      if (el) {
        excerpt = getSmartText(el).replace(/\s+/g, ' ').trim();
        excerptNode = el;
        break;
      }
    }
  }

  if (!excerpt && mainContainer) {
    // Try first bold paragraph
    const firstP = mainContainer.querySelector('p');
    if (firstP && (firstP.querySelector('strong') || firstP.querySelector('b'))) {
        excerpt = getSmartText(firstP).replace(/\s+/g, ' ').trim();
        excerptNode = firstP;
    }
  }

  if (excerpt) {
    excerpt = excerpt.replace(tccsSapoRegex, '').trim();
    if (excerptNode) {
       excerptNode.remove();
    }
  }
  
  if (!excerpt) {
      excerpt = doc.querySelector('meta[name="description"]')?.getAttribute('content') || "";
  }


  // --- 5. MAIN CONTENT EXTRACTION ---
  const contentParts: string[] = [];
  const normTitle = normalize(title);
  const normExcerpt = normalize(excerpt);
  
  let stopProcessing = false; 

  // --- STRATEGY: HYBRID TRAVERSAL ---
  
  if (isTCCS) {
      // TCCS Specific Strict Logic (Stop at related)
      const traverse = (node: Node) => {
        if (stopProcessing) return;
        if (node.nodeType === Node.TEXT_NODE) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tagName = el.tagName.toLowerCase();
          
          if (['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'form'].includes(tagName)) return;
          
          // Image Extraction
          if (tagName === 'img') {
            let src = el.getAttribute('src') || el.getAttribute('data-src');
            if (src && !src.startsWith('data:')) {
              try {
                const absoluteUrl = new URL(src, validUrl).href;
                if (!absoluteUrl.match(/(icon|logo|pixel|clear|blank)\.(gif|png|svg)$/i)) {
                   contentParts.push(`\n[ẢNH: ${absoluteUrl}]\n`);
                }
              } catch (e) {}
            }
            return;
          }

          const text = el.textContent?.trim() || "";
          const lowerText = text.toLowerCase();
          
          if (['h2', 'h3', 'h4', 'h5', 'strong', 'div', 'p', 'section', 'ul'].includes(tagName)) {
             if (text.length < 200) { 
                if (/^(tin|bài|xem) (liên quan|cùng chủ đề|xem thêm|đọc thêm|tham khảo)/.test(lowerText) ||
                    /^(tài liệu tham khảo|danh mục tài liệu)/.test(lowerText)) {
                     if (!lowerText.includes('có') && !lowerText.includes('là')) { 
                         stopProcessing = true;
                         return;
                     }
                }
             }
          }

          if (['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'figcaption'].includes(tagName)) {
            const cleanText = getSmartText(el).trim();
            if (cleanText.length > 5) {
              if (normTitle && normalize(cleanText).includes(normTitle) && cleanText.length < normTitle.length + 50) return;
              if (normExcerpt && isSimilar(cleanText, excerpt)) return;
              if (contentParts.length < 3) {
                 if (/^(ngày|thứ)\s+\d{1,2}/i.test(cleanText) && cleanText.length < 50) return; 
                 if (/^(nguồn|theo|ảnh|thực hiện)[:]/i.test(cleanText)) return;
              }
              contentParts.push(cleanText);
            }
            return; 
          }
          node.childNodes.forEach(child => traverse(child));
        }
      };
      mainContainer.childNodes.forEach(child => traverse(child));

  } else {
      // GENERAL LOGIC (NhanDan, VnExpress, etc.)
      const processGeneralNode = (node: Node) => {
         if (node.nodeType === Node.TEXT_NODE) return;
         
         if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();
            
            if (['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'form'].includes(tagName)) return;

             // Junk check
             const text = el.textContent?.trim() || "";
             if (/^(tin|bài) (liên quan|cùng chủ đề|đọc thêm)/i.test(text) && text.length < 100) return;

            // Image
            if (tagName === 'img') {
                let src = el.getAttribute('src') || el.getAttribute('data-src');
                if (src && !src.startsWith('data:')) {
                  try {
                    const absoluteUrl = new URL(src, validUrl).href;
                    if (!absoluteUrl.match(/(icon|logo|pixel|clear|blank)\.(gif|png|svg)$/i)) {
                       contentParts.push(`\n[ẢNH: ${absoluteUrl}]\n`);
                    }
                  } catch (e) {}
                }
                return;
            }

            if (['p', 'h2', 'h3', 'h4', 'h5', 'li', 'blockquote', 'figcaption'].includes(tagName)) {
                 const cleanText = getSmartText(el).trim();
                 if (cleanText.length > 5) {
                    if (normTitle && normalize(cleanText).includes(normTitle) && cleanText.length < normTitle.length + 50) return;
                    if (normExcerpt && isSimilar(cleanText, excerpt)) return;
                    contentParts.push(cleanText);
                 }
                 return;
            }

            if (['div', 'section', 'article', 'main', 'ul', 'ol', 'table', 'tbody', 'tr', 'td', 'span', 'strong', 'b', 'em', 'i', 'body'].includes(tagName)) {
                node.childNodes.forEach(child => processGeneralNode(child));
            }
         }
      }
      
      mainContainer.childNodes.forEach(child => processGeneralNode(child));
  }
  
  let content = contentParts.join('\n\n');
  content = content.replace(/\(?\s*Tiêu đề do .* đặt\s*\)?\.?/gi, '');
  
  if (excerpt && content.startsWith(excerpt)) {
      content = content.substring(excerpt.length).trim();
  }

  return {
    title,
    excerpt,
    content: content.trim()
  };
};
