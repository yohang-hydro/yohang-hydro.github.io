/* ============================================
   MOBILE NAVIGATION TOGGLE - 移动端导航切换
   ============================================ */

// 等待DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取汉堡菜单按钮和导航菜单元素
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // 汉堡菜单点击事件：切换移动端导航菜单的显示/隐藏
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 点击导航链接时关闭移动端菜单
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));

    /* ============================================
       SMOOTH SCROLLING - 平滑滚动效果
       ============================================ */
    
    // 为所有锚点链接添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // 计算header高度，用于偏移
                const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ============================================
       HEADER SCROLL EFFECT - 头部滚动效果
       ============================================ */
    
    // 添加头部滚动效果：滚动时改变背景透明度和模糊效果
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            // 滚动超过100px时：半透明背景 + 模糊效果
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            // 滚动小于100px时：恢复原始样式
            header.style.backgroundColor = '#fff';
            header.style.backdropFilter = 'none';
        }
    });

    /* ============================================
       PUBLICATION COUNTS - 出版物计数
       ============================================ */
    
    // 统计每一年份的出版物数量（独立于publicationSummary检查）
    const yearLinks = document.querySelectorAll('a[href^="#year-"]');
    yearLinks.forEach(link => {
        const yearId = link.getAttribute('href').substring(1); // 去掉 #
        const yearHeader = document.getElementById(yearId);
        if (yearHeader) {
            // 找到该年份下的所有 citation-item
            const yearGroup = yearHeader.nextElementSibling;
            if (yearGroup && yearGroup.classList.contains('publications-year-group')) {
                const count = yearGroup.querySelectorAll('.citation-item').length;
                // 更新链接文本，例如 "2025 (3)"
                const originalText = link.textContent;
                const yearMatch = originalText.match(/^\d{4}/);
                if (yearMatch) {
                    link.textContent = `${yearMatch[0]} (${count})`;
                }
            }
        }
    });
    
    // 统计出版物数量（仅当在publications页面时执行）
    const publicationSummary = document.getElementById('publication-summary');
    if (publicationSummary) {
        // 只统计期刊出版物（排除会议论文）
        // 找到"Journal Publications"和"Conferences & Talks"之间的出版物
        const journalPublications = document.querySelector('.publications-by-year:not(.conferences-layout)');
        
        let totalPapers = 0;
        let firstAuthorCount = 0;
        const journalCounts = {}; // 用于统计每个期刊的数量
        
        if (journalPublications) {
            // 统计所有期刊出版物的数量
            const citationItems = journalPublications.querySelectorAll('.citation-item');
            totalPapers = citationItems.length;
            
            // 统计第一作者或通讯作者的数量，以及每个期刊的数量
            citationItems.forEach(item => {
                const citationText = item.querySelector('.citation-text');
                if (citationText) {
                    const text = citationText.innerHTML;
                    // 检查是否以 "Zhang, Y." 开头（第一作者）
                    // 或者包含 "Zhang, Y.*"（通讯作者）
                    if (text.trim().startsWith('<span class="author-name">Zhang, Y.</span>') || 
                        text.includes('<span class="author-name">Zhang, Y.<sup>*</sup></span>')) {
                        firstAuthorCount++;
                    }
                    
                    // 提取期刊名称（在 <em> 标签内）
                    const journalMatch = text.match(/<em>([^<]+)<\/em>/);
                    if (journalMatch) {
                        let journalName = journalMatch[1].trim();
                        
                        // 自动替换期刊名称中的 & 为 and（统一样式）
                        journalName = journalName.replace(/&/g, 'and');
                        
                        journalCounts[journalName] = (journalCounts[journalName] || 0) + 1;
                    }
                }
            });
        }
        
        // 更新页面中的数字
        const totalPapersElement = document.getElementById('total-papers');
        const firstAuthorPapersElement = document.getElementById('first-author-papers');
        
        if (totalPapersElement) {
            totalPapersElement.textContent = totalPapers;
        }
        if (firstAuthorPapersElement) {
            firstAuthorPapersElement.textContent = firstAuthorCount;
        }
        
        // 更新期刊列表
         const journalListElement = document.getElementById('journal-list');
         if (journalListElement) {
             // 定义高影响力期刊的优先级顺序（按重要程度排序）
             const highImpactJournals = [
                'WIREs Water',
                'Geophysical Research Letters',
                'Water Resources Research',
                'Journal of Hydrology',
                'Hydrology and Earth System Sciences',
                'Environmental Modelling and Software',
                'Journal of Hydrometeorology',
                'Science of The Total Environment',
                'Earth and Space Science'
             ];
             
             // 分离高影响力期刊和其他期刊
             const highImpact = [];
             const otherJournals = [];
             
             Object.entries(journalCounts).forEach(([name, count]) => {
                 const index = highImpactJournals.indexOf(name);
                 if (index !== -1) {
                     highImpact.push({ index, name, count });
                 } else {
                     otherJournals.push({ name, count });
                 }
             });
             
             // 高影响力期刊按预定义顺序排序
             highImpact.sort((a, b) => a.index - b.index);
             
             // 其他期刊按字母顺序排序
             otherJournals.sort((a, b) => a.name.localeCompare(b.name));
             
             // 合并期刊列表（高影响力在前，其他在后）
             const allJournals = [...highImpact, ...otherJournals];
             
             // 格式化并显示
             const formattedJournals = allJournals
                 .map(item => `<em>${item.name}</em> (${item.count})`);
             
             journalListElement.innerHTML = formattedJournals.join(', ') + '.';
         }
    }
});
